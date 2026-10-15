import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export type GenerationTaskType =
  | 'image'
  | 'video'
  | 'game'
  | 'app'
  | 'chat'
  | 'search'
  | 'vector'
  | 'audio'
  | 'general';

export type GenerationStatus =
  | 'idle'
  | 'generating'
  | 'cancelling'
  | 'completed'
  | 'error';

export interface GenerationState {
  isGenerating: boolean;
  status: GenerationStatus;
  taskType: GenerationTaskType;
  taskTitle: string;
  stage: string;
  progress: number; // 0 - 100
  currentStep: number;
  totalSteps: number;
  elapsedSeconds: number;
  startedAt: number | null;
  error: string | null;
}

export interface StartGenerationOptions {
  taskType: GenerationTaskType;
  taskTitle?: string;
  initialStage?: string;
  totalSteps?: number;
  controller?: AbortController;
}

export interface GenerationContextValue extends GenerationState {
  startGeneration: (options: StartGenerationOptions) => AbortController;
  updateStage: (stage: string, progress?: number, currentStep?: number) => void;
  setProgress: (progress: number) => void;
  finishGeneration: () => void;
  cancelGeneration: (reason?: string) => void;
  registerAbortController: (controller: AbortController) => void;
  forceUnlock: (reason?: string) => void;
}

const DEFAULT_STATE: GenerationState = {
  isGenerating: false,
  status: 'idle',
  taskType: 'general',
  taskTitle: '',
  stage: '',
  progress: 0,
  currentStep: 1,
  totalSteps: 3,
  elapsedSeconds: 0,
  startedAt: null,
  error: null,
};

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GenerationState>(DEFAULT_STATE);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);

  // Clear elapsed timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((startTime: number) => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setState((prev) => (prev.isGenerating ? { ...prev, elapsedSeconds: elapsed } : prev));
    }, 1000);
  }, [stopTimer]);

  const startGeneration = useCallback(
    (options: StartGenerationOptions): AbortController => {
      const controller = options.controller || new AbortController();
      controllerRef.current = controller;

      const now = Date.now();
      const totalSteps = options.totalSteps || 3;
      const initialStage = options.initialStage || '';

      setState({
        isGenerating: true,
        status: 'generating',
        taskType: options.taskType,
        taskTitle: options.taskTitle || '',
        stage: initialStage,
        progress: 10,
        currentStep: 1,
        totalSteps,
        elapsedSeconds: 0,
        startedAt: now,
        error: null,
      });

      startTimer(now);

      // Notify global listeners if needed
      window.dispatchEvent(
        new CustomEvent('adam:generation-started', {
          detail: { taskType: options.taskType, title: options.taskTitle },
        })
      );

      return controller;
    },
    [startTimer]
  );

  const updateStage = useCallback(
    (stage: string, progress?: number, currentStep?: number) => {
      setState((prev) => {
        if (!prev.isGenerating) return prev;
        const nextProgress =
          progress !== undefined
            ? Math.min(100, Math.max(0, progress))
            : prev.progress;
        const nextStep =
          currentStep !== undefined ? currentStep : prev.currentStep;
        return {
          ...prev,
          stage,
          progress: nextProgress,
          currentStep: nextStep,
        };
      });
    },
    []
  );

  const setProgress = useCallback((progress: number) => {
    setState((prev) => {
      if (!prev.isGenerating) return prev;
      return {
        ...prev,
        progress: Math.min(100, Math.max(0, progress)),
      };
    });
  }, []);

  const finishGeneration = useCallback(() => {
    stopTimer();
    controllerRef.current = null;
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      status: 'completed',
      progress: 100,
      currentStep: prev.totalSteps,
    }));

    window.dispatchEvent(new CustomEvent('adam:generation-completed'));

    // Reset back to idle shortly after completion
    setTimeout(() => {
      setState((prev) => (!prev.isGenerating ? DEFAULT_STATE : prev));
    }, 1200);
  }, [stopTimer]);

  const cancelGeneration = useCallback(
    (reason = 'cancelled') => {
      stopTimer();
      if (controllerRef.current) {
        try {
          controllerRef.current.abort(new Error(reason));
        } catch {
          // ignore already aborted
        }
        controllerRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isGenerating: false,
        status: 'cancelling',
        stage: '',
        progress: 0,
        error: reason,
      }));

      window.dispatchEvent(
        new CustomEvent('adam:generation-cancelled', {
          detail: { reason },
        })
      );

      setTimeout(() => {
        setState(DEFAULT_STATE);
      }, 300);
    },
    [stopTimer]
  );

  const forceUnlock = useCallback(
    (reason = 'Force unlocked by system or user') => {
      stopTimer();
      if (controllerRef.current) {
        try {
          controllerRef.current.abort(new Error(reason));
        } catch {
          // ignore already aborted
        }
        controllerRef.current = null;
      }

      setState(DEFAULT_STATE);

      window.dispatchEvent(
        new CustomEvent('adam:force-unlock', {
          detail: { reason },
        })
      );
    },
    [stopTimer]
  );

  // Watchdog Timer: prevents UI from ever remaining locked for > 35 seconds without resolution
  useEffect(() => {
    if (!state.isGenerating) return;
    const watchdog = setTimeout(() => {
      console.warn('[GenerationWatchdog] Generation exceeded 35s timeout. Automatically releasing UI lock.');
      forceUnlock('Generation timeout watchdog triggered');
    }, 35_000);
    return () => clearTimeout(watchdog);
  }, [state.isGenerating, forceUnlock]);

  // Expose global force unlock listener and window helper
  useEffect(() => {
    const handleGlobalUnlock = () => {
      forceUnlock();
    };
    window.addEventListener('adam:request-force-unlock', handleGlobalUnlock);
    (window as any).__adamForceUnlock = forceUnlock;
    return () => {
      window.removeEventListener('adam:request-force-unlock', handleGlobalUnlock);
      delete (window as any).__adamForceUnlock;
    };
  }, [forceUnlock]);

  const registerAbortController = useCallback((controller: AbortController) => {
    controllerRef.current = controller;
  }, []);

  const value: GenerationContextValue = {
    ...state,
    startGeneration,
    updateStage,
    setProgress,
    finishGeneration,
    cancelGeneration,
    registerAbortController,
    forceUnlock,
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration(): GenerationContextValue {
  const ctx = useContext(GenerationContext);
  if (!ctx) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return ctx;
}
