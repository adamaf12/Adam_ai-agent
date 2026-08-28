import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, X, Radio } from 'lucide-react';
import { speakWithGlobalVoice, stopAllSpeech } from '../lib/voiceEngine';
import { saveVoiceInteraction } from '../lib/storage';

interface ContinuousListeningBarProps {
  isActive: boolean;
  onToggle: () => void;
  onSendVoiceCommand: (text: string) => Promise<string | void> | void;
  isArabic: boolean;
  agentName: string;
  isLoading: boolean;
  selectedVoiceId?: string;
  voiceRate?: number;
  voicePitch?: number;
}

export const ContinuousListeningBar: React.FC<ContinuousListeningBarProps> = ({
  isActive,
  onToggle,
  onSendVoiceCommand,
  isArabic,
  agentName,
  isLoading,
  selectedVoiceId = 'adam-neural',
  voiceRate = 1.0,
  voicePitch = 0.95,
}) => {
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'listening' | 'speaking' | 'processing'>('listening');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // Synchronized Refs to fix stale closure bugs
  const liveTranscriptRef = useRef(liveTranscript);
  useEffect(() => {
    liveTranscriptRef.current = liveTranscript;
  }, [liveTranscript]);

  const interimTextRef = useRef(interimText);
  useEffect(() => {
    interimTextRef.current = interimText;
  }, [interimText]);

  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Helper to trigger voice command
  const triggerVoiceSubmit = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoadingRef.current) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setSpeechStatus('processing');
    setLiveTranscript('');
    setInterimText('');

    try {
      const responseText = await onSendVoiceCommand(trimmed);

      if (responseText && typeof responseText === 'string') {
        saveVoiceInteraction(trimmed, responseText, 'continuous_mic');
        setSpeechStatus('speaking');
        speakWithGlobalVoice(responseText, selectedVoiceId, {
          customRate: voiceRate,
          customPitch: voicePitch,
          onEnd: () => {
            if (isComponentMounted.current && isActive) {
              setSpeechStatus('listening');
            }
          },
          onError: () => {
            if (isComponentMounted.current && isActive) {
              setSpeechStatus('listening');
            }
          },
        });
      } else {
        setTimeout(() => {
          if (isComponentMounted.current) {
            setSpeechStatus('listening');
          }
        }, 1200);
      }
    } catch (err) {
      console.error('[Voice Command execution error]:', err);
      if (isComponentMounted.current) {
        setSpeechStatus('listening');
      }
    }
  };

  useEffect(() => {
    isComponentMounted.current = true;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isActive) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = isArabic ? 'ar-SA' : 'en-US';

      recognition.onstart = () => {
        if (isComponentMounted.current) {
          setSpeechStatus('listening');
        }
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += trans;
          } else {
            interimChunk += trans;
          }
        }

        if (interimChunk) {
          setInterimText(interimChunk);
          setSpeechStatus('speaking');

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (interimTextRef.current.trim().length > 2) {
              triggerVoiceSubmit(interimTextRef.current);
            }
          }, 1800);
        }

        if (finalChunk) {
          const updatedLive = liveTranscriptRef.current
            ? liveTranscriptRef.current + ' ' + finalChunk
            : finalChunk;
          setLiveTranscript(updatedLive);
          setInterimText('');
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          silenceTimerRef.current = setTimeout(() => {
            if (updatedLive.trim().length > 1) {
              triggerVoiceSubmit(updatedLive);
            }
          }, 1200);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Continuous speech recognition error:', err?.error);
        if (err?.error !== 'no-speech') {
          setSpeechStatus('listening');
        }
      };

      recognition.onend = () => {
        if (isActive && isComponentMounted.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Failed to restart speech recognition:', e);
            }
          }, 300);
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error('Error starting continuous recognition:', err);
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setLiveTranscript('');
      setInterimText('');
    }

    return () => {
      isComponentMounted.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isActive, isArabic]);

  if (!isActive) return null;

  const currentDisplay = (liveTranscript + ' ' + interimText).trim();

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4 py-2 pointer-events-none flex justify-center animate-fadeIn">
      <div className="pointer-events-auto max-w-2xl w-full bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center justify-between gap-3">
        {/* Animated Listening Icon */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                {isArabic ? `وضع الاستماع المستمر (${agentName})` : `Continuous Listening (${agentName})`}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                {speechStatus === 'speaking'
                  ? isArabic
                    ? 'جاري التقاط الصوت...'
                    : 'Capturing speech...'
                  : speechStatus === 'processing'
                  ? isArabic
                    ? 'تنفيذ الأمر...'
                    : 'Executing command...'
                  : isArabic
                  ? 'يستمع للأوامر مباشرة'
                  : 'Listening for voice commands'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 truncate max-w-sm mt-0.5">
              {currentDisplay
                ? `"${currentDisplay}"`
                : isArabic
                ? `تحدث بأمرك الصوتي مباشرة (مثال: "احسب 50 * 4" أو "أضف موعد غداً")...`
                : `Speak your command freely (e.g. "Add meeting tomorrow" or "Calculate 50 * 4")...`}
            </p>
          </div>
        </div>

        {/* Actions Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {currentDisplay && (
            <button
              onClick={() => triggerVoiceSubmit(currentDisplay)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
              title={isArabic ? 'إرسال الأمر الآن' : 'Send Command Now'}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تنفيذ' : 'Run'}</span>
            </button>
          )}

          <button
            onClick={onToggle}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={isArabic ? 'إيقاف وضع الاستماع' : 'Stop Continuous Mode'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
