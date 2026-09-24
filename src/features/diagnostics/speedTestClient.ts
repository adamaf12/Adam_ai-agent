import { getResolvedApiBase } from '../../core/ai/client';

export interface SpeedTestPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  prompt: string;
  expectedTokens: number;
}

export interface SpeedTestSummary {
  provider: string;
  model: string;
  presetId: string;
  totalTokens: number;
  charactersCount: number;
  totalDurationMs: number;
  ttftMs: number;
  generationDurationMs: number;
  averageTps: number;
  peakTps: number;
  chunkCount?: number;
  simulated?: boolean;
}

export interface SpeedTestResultRecord extends SpeedTestSummary {
  id: string;
  timestamp: number;
  promptSnippet: string;
}

export interface SpeedTestStreamCallbacks {
  onInit?: (data: { provider: string; model: string; presetId: string; prompt: string }) => void;
  onFirstToken?: (ttftMs: number) => void;
  onChunk?: (data: {
    deltaText: string;
    accumulatedText: string;
    totalTokens: number;
    currentTps: number;
    elapsedMs: number;
  }) => void;
  onComplete?: (summary: SpeedTestSummary) => void;
  onError?: (err: { message: string; code: string }) => void;
}

const STORAGE_KEY = 'adam_llm_speed_test_history_v1';

export async function fetchSpeedTestInfo(): Promise<{
  ok: boolean;
  provider: string;
  activeModel: string;
  configured: boolean;
  presets: SpeedTestPreset[];
}> {
  const base = getResolvedApiBase();
  try {
    const res = await fetch(`${base}/api/diagnostics/speed-test/info`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    return {
      ok: false,
      provider: 'ADEM-G',
      activeModel: 'ADEM-G 3.8 Flash',
      configured: false,
      presets: [
        {
          id: 'pulse',
          nameEn: 'Quick Pulse',
          nameAr: 'نبضة سريعة',
          descriptionEn: 'Lightweight ~50 token prompt for measuring baseline TTFT.',
          descriptionAr: 'فحص فوري خفيف (~50 رمز) لقياس زمن الاستجابة الأول وسرعة التدفق.',
          prompt: 'In exactly 3 numbered bullet points, explain why streaming tokens in real time improves responsiveness.',
          expectedTokens: 60,
        },
        {
          id: 'standard',
          nameEn: 'Standard Benchmark',
          nameAr: 'المعيار القياسي',
          descriptionEn: 'Balanced technical evaluation (~180 tokens) measuring sustained streaming throughput.',
          descriptionAr: 'تقييم تقني متوازن (~180 رمز) لقياس معدل التدفق المستمر ومعدل الرموز في الثانية.',
          prompt: 'Provide a structured technical breakdown of how an event loop handles microtasks and macrotasks.',
          expectedTokens: 190,
        },
        {
          id: 'arabic',
          nameEn: 'Arabic Multilingual',
          nameAr: 'المعيار العربي المتعدد',
          descriptionEn: 'High-speed Arabic tokenization test evaluating Unicode throughput efficiency.',
          descriptionAr: 'فحص توليد باللغة العربية لتقييم سرعة معالجة محارف اليونيكود ومعدل الرموز العربية.',
          prompt: 'اكتب تحليلاً تقنياً علمياً مركزاً في 4 نقاط رئيسية حول دور الحوسبة الكمية في تسريع الخوارزميات.',
          expectedTokens: 160,
        },
      ],
    };
  }
}

export async function executeSpeedTestStream(
  options: {
    presetId?: string;
    customPrompt?: string;
    model?: string;
  },
  callbacks: SpeedTestStreamCallbacks,
  signal?: AbortSignal
): Promise<SpeedTestSummary> {
  const base = getResolvedApiBase();
  const response = await fetch(`${base}/api/diagnostics/speed-test/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    },
    body: JSON.stringify(options),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const errorObj = { message: errorText || `HTTP ${response.status}`, code: 'HTTP_ERROR' };
    callbacks.onError?.(errorObj);
    throw new Error(errorObj.message);
  }

  if (!response.body) {
    const err = { message: 'Stream response body unavailable.', code: 'NO_STREAM' };
    callbacks.onError?.(err);
    throw new Error(err.message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalSummary: SpeedTestSummary | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed);
          if (event.type === 'init') {
            callbacks.onInit?.(event);
          } else if (event.type === 'first_token') {
            callbacks.onFirstToken?.(event.ttftMs);
          } else if (event.type === 'chunk') {
            callbacks.onChunk?.({
              deltaText: event.deltaText,
              accumulatedText: event.accumulatedText,
              totalTokens: event.totalTokens,
              currentTps: event.currentTps,
              elapsedMs: event.elapsedMs,
            });
          } else if (event.type === 'complete') {
            finalSummary = event.summary;
            callbacks.onComplete?.(event.summary);
          } else if (event.type === 'error') {
            callbacks.onError?.({ message: event.message, code: event.code });
            throw new Error(event.message);
          }
        } catch (parseErr: any) {
          if (parseErr.message && !parseErr.message.includes('JSON')) {
            throw parseErr;
          }
        }
      }
    }

    if (!finalSummary) {
      throw new Error('Speed test stream finished without completion summary.');
    }

    // Save to historical benchmark runs
    saveSpeedTestRun({
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      promptSnippet: (options.customPrompt || options.presetId || 'Benchmark').slice(0, 50),
      ...finalSummary,
    });

    return finalSummary;
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
}

export function getSpeedTestHistory(): SpeedTestResultRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 15) : [];
  } catch {
    return [];
  }
}

export function saveSpeedTestRun(run: SpeedTestResultRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSpeedTestHistory();
    const updated = [run, ...existing.filter((r) => r.id !== run.id)].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearSpeedTestHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
