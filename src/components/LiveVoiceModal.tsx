import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  Settings,
  Radio,
  Sliders,
  X,
  Check,
  RefreshCw,
  Zap,
  Globe,
} from 'lucide-react';
import { AgentSettings } from '../types';
import { AgentAvatar } from './AgentAvatar';
import {
  GLOBAL_VOICES,
  GlobalVoice,
  speakWithGlobalVoice,
  speakChunkStream,
  stopAllSpeech,
} from '../lib/voiceEngine';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentSettings: AgentSettings;
  onSaveVoiceSettings: (voiceId: string, rate: number, pitch: number) => void;
  onSendVoiceQuery: (userText: string) => Promise<string>; // Returns AI text response
  isArabic: boolean;
}

export const STT_LANGUAGES = [
  { id: 'ar-SA', nameAr: 'العربية (الأساسية)', nameEn: 'Arabic (Primary)', flag: '🇸🇦' },
  { id: 'en-US', nameAr: 'الإنجليزية', nameEn: 'English', flag: '🇺🇸' },
  { id: 'fr-FR', nameAr: 'الفرنسية', nameEn: 'French', flag: '🇫🇷' },
  { id: 'es-ES', nameAr: 'الإسبانية', nameEn: 'Spanish', flag: '🇪🇸' },
  { id: 'de-DE', nameAr: 'الألمانية', nameEn: 'German', flag: '🇩🇪' },
  { id: 'it-IT', nameAr: 'الإيطالية', nameEn: 'Italian', flag: '🇮🇹' },
];

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  agentSettings,
  onSaveVoiceSettings,
  onSendVoiceQuery,
  isArabic,
}) => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    agentSettings.voiceSettings?.voiceId || 'adam-neural'
  );
  const [voiceRate, setVoiceRate] = useState<number>(
    agentSettings.voiceSettings?.rate || 1.0
  );
  const [voicePitch, setVoicePitch] = useState<number>(
    agentSettings.voiceSettings?.pitch || 1.0
  );

  const [sttLang, setSttLang] = useState<string>(isArabic ? 'ar-SA' : 'en-US');
  const [callState, setCallState] = useState<'listening' | 'processing' | 'speaking' | 'muted'>('listening');
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [lastAgentAnswer, setLastAgentAnswer] = useState<string>('');
  const [showVoicePicker, setShowVoicePicker] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isComponentMounted = useRef(true);

  // Synchronized state refs to avoid stale closures in Web Speech callbacks
  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const currentVoiceObj =
    GLOBAL_VOICES.find((v) => v.id === selectedVoiceId) || GLOBAL_VOICES[0];

  // Request Microphone Stream and calculate audio level
  const initAudioLevelMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setMicPermissionError(false);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!isComponentMounted.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        // Barge-in / Interruption check: If user speaks loudly while AI is talking, interrupt AI!
        if (normalized > 25 && callStateRef.current === 'speaking') {
          stopAllSpeech();
          setCallState('listening');
        }

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn('Microphone permission or AudioContext error:', err);
      setMicPermissionError(true);
    }
  };

  // Execute AI voice loop when speech chunk finishes
  const handleUserSpoke = async (spokenText: string) => {
    const cleanSpoken = spokenText.trim();
    if (!cleanSpoken || isMutedRef.current) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Stop current speech & set processing state
    stopAllSpeech();
    setCallState('processing');
    setTranscript(cleanSpoken);
    setInterimText('');

    try {
      // Send query to AI
      const answer = await onSendVoiceQuery(cleanSpoken);
      if (!isComponentMounted.current) return;

      setLastAgentAnswer(answer);
      setCallState('speaking');

      // Speak response immediately in streaming chunks as they arrive
      speakChunkStream(answer, selectedVoiceId, {
        customRate: voiceRate,
        customPitch: voicePitch,
        onEnd: () => {
          if (isComponentMounted.current && !isMutedRef.current) {
            setCallState('listening');
            setTranscript('');
          }
        },
        onError: () => {
          if (isComponentMounted.current && !isMutedRef.current) {
            setCallState('listening');
            setTranscript('');
          }
        },
      });
    } catch (err) {
      console.error('Error in live voice query:', err);
      if (isComponentMounted.current) {
        setCallState('listening');
      }
    }
  };

  // Immediate Greeting when Call opens & start mic meter
  useEffect(() => {
    if (!isOpen) return;

    isComponentMounted.current = true;
    initAudioLevelMeter();

    const agentName = agentSettings.name || 'أدم';
    const greetingText = isArabic
      ? `أهلاً بك! أنا ${agentName}، كيف يمكنني مساعدتك اليوم؟ أنا أستمع إليك الآن.`
      : `Hello! I am ${agentName}. I am listening to you now, how can I help you today?`;

    setLastAgentAnswer(greetingText);
    setCallState('speaking');

    // Speak opening greeting out loud
    speakWithGlobalVoice(greetingText, selectedVoiceId, {
      customRate: voiceRate,
      customPitch: voicePitch,
      onEnd: () => {
        if (isComponentMounted.current) {
          setCallState('listening');
        }
      },
      onError: () => {
        if (isComponentMounted.current) {
          setCallState('listening');
        }
      },
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen]);

  // Initialize Web Speech Recognition loop with Barge-in & Safe Auto-restart
  useEffect(() => {
    if (!isOpen) {
      stopAllSpeech();
      return;
    }

    isComponentMounted.current = true;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition API not available in browser');
      setMicPermissionError(true);
      return;
    }

    let restartTimeout: NodeJS.Timeout | null = null;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sttLang;

    recognition.onstart = () => {
      setMicPermissionError(false);
      if (isComponentMounted.current && callStateRef.current !== 'speaking' && callStateRef.current !== 'processing') {
        setCallState('listening');
      }
    };

    recognition.onresult = (event: any) => {
      if (isMutedRef.current) return;

      // Barge-in logic: If AI is speaking and user speaks, stop AI speech!
      if (callStateRef.current === 'speaking') {
        stopAllSpeech();
        setCallState('listening');
      }

      if (callStateRef.current === 'processing') return;

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
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (interimChunk.trim().length > 2) {
            handleUserSpoke(interimChunk);
          }
        }, 1600);
      }

      if (finalChunk) {
        const updatedTranscript = transcriptRef.current ? transcriptRef.current + ' ' + finalChunk : finalChunk;
        setTranscript(updatedTranscript);
        setInterimText('');
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
          if (updatedTranscript.trim().length > 1) {
            handleUserSpoke(updatedTranscript);
          }
        }, 1100);
      }
    };

    recognition.onerror = (err: any) => {
      console.warn('Live voice recognition error:', err?.error);
      if (err?.error === 'not-allowed' || err?.error === 'audio-capture') {
        setMicPermissionError(true);
      }
    };

    recognition.onend = () => {
      if (isOpen && isComponentMounted.current && !isMutedRef.current) {
        restartTimeout = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 300);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed starting live speech recognition:', e);
    }

    return () => {
      if (restartTimeout) clearTimeout(restartTimeout);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isOpen, selectedVoiceId, voiceRate, voicePitch, sttLang]);

  if (!isOpen) return null;

  const handleVoiceChange = (vId: string) => {
    setSelectedVoiceId(vId);
    onSaveVoiceSettings(vId, voiceRate, voicePitch);
    // Test sample
    speakWithGlobalVoice(
      isArabic ? 'أهلاً بك! تم تفعيل هذا الصوت بنجاح.' : 'Hello! This voice is now active.',
      vId,
      { customRate: voiceRate, customPitch: voicePitch }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white relative">
        {/* Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-100">
                  {isArabic ? `مكالمة مباشرة مع ${agentSettings.name || 'أدم'}` : `Live Voice Call with ${agentSettings.name || 'Adam'}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">
                  Multilingual AI ⚡
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isArabic ? 'تحدث بأي لغة وسيجيبك أدم بالصوت الفوري في الحين' : 'Speak in any language for instant spoken AI responses'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title={isArabic ? 'اختيار الصوت العالمي' : 'Change Voice'}
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{currentVoiceObj.badge}</span>
            </button>

            <button
              onClick={() => {
                stopAllSpeech();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Pills Bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />
          <span className="text-[11px] text-slate-400 shrink-0 font-semibold">
            {isArabic ? 'لغة الاستماع:' : 'Listening Lang:'}
          </span>
          {STT_LANGUAGES.map((langItem) => {
            const isSelected = sttLang === langItem.id;
            return (
              <button
                key={langItem.id}
                onClick={() => setSttLang(langItem.id)}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 shrink-0 transition ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{langItem.flag}</span>
                <span>{isArabic ? langItem.nameAr : langItem.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Global Voice Picker Dropdown Modal inside Call */}
        {showVoicePicker && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{isArabic ? 'الأصوات العالمية المتاحة' : 'Global Voice Catalog'}</span>
              </h4>
              <button
                onClick={() => setShowVoicePicker(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 theme-scrollbar">
              {GLOBAL_VOICES.map((v) => {
                const isSelected = v.id === selectedVoiceId;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{isArabic ? v.nameAr : v.nameEn}</span>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {v.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {isArabic ? v.descriptionAr : v.descriptionEn}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Voice Pitch & Speed Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isArabic ? `سرعة النطق (${voiceRate.toFixed(1)}x):` : `Speed (${voiceRate.toFixed(1)}x):`}
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={voiceRate}
                  onChange={(e) => {
                    const r = parseFloat(e.target.value);
                    setVoiceRate(r);
                    onSaveVoiceSettings(selectedVoiceId, r, voicePitch);
                  }}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  {isArabic ? `طبقة الصوت (${voicePitch.toFixed(1)}x):` : `Pitch (${voicePitch.toFixed(1)}x):`}
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.1"
                  value={voicePitch}
                  onChange={(e) => {
                    const p = parseFloat(e.target.value);
                    setVoicePitch(p);
                    onSaveVoiceSettings(selectedVoiceId, voiceRate, p);
                  }}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Central Visualizer Orbit */}
        <div className="py-8 px-6 flex flex-col items-center justify-center space-y-5 text-center">
          {/* Mic Permission Warning Banner */}
          {micPermissionError && (
            <div className="w-full max-w-md p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-bounce">
              <span>
                {isArabic
                  ? '🎙️ يرجى السماح بتشغيل الميكروفون للحدث مع أدم بصوتك'
                  : '🎙️ Please allow microphone access to talk to Adam'}
              </span>
              <button
                onClick={() => initAudioLevelMeter()}
                className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-[11px] shrink-0 hover:bg-amber-400"
              >
                {isArabic ? 'تفعيل ⚡' : 'Enable ⚡'}
              </button>
            </div>
          )}

          {/* Animated Glowing Ring */}
          <div className="relative flex items-center justify-center">
            {/* Dynamic Ripple matching audioLevel */}
            {callState === 'listening' && (
              <span
                style={{ transform: `scale(${1 + audioLevel / 120})` }}
                className="absolute w-40 h-40 rounded-full bg-emerald-500/20 transition-transform duration-75 ease-out opacity-75"
              ></span>
            )}
            {callState === 'speaking' && (
              <span className="absolute w-44 h-44 rounded-full bg-cyan-500/20 animate-pulse opacity-90"></span>
            )}
            {callState === 'processing' && (
              <span className="absolute w-36 h-36 rounded-full bg-amber-500/20 animate-spin border-2 border-amber-500/40 border-t-transparent"></span>
            )}

            {/* Core Orb */}
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all duration-300 z-10 relative overflow-hidden ${
                callState === 'speaking'
                  ? 'bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 border-cyan-300 shadow-cyan-500/40 scale-105'
                  : callState === 'processing'
                  ? 'bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 border-amber-300 shadow-amber-500/40'
                  : isMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                  : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 border-emerald-400 shadow-emerald-500/40'
              }`}
            >
              <AgentAvatar className="w-full h-full rounded-full" />
            </div>
          </div>

          {/* Live Audio Equalizer Waveform */}
          <div className="flex items-center justify-center gap-1.5 h-6">
            {[12, 28, 45, 80, 50, 95, 60, 35, 18].map((baseH, idx) => {
              const computedH = callState === 'listening' && audioLevel > 5
                ? Math.max(6, Math.min(28, (audioLevel / 100) * baseH))
                : callState === 'speaking'
                ? Math.max(6, Math.sin(Date.now() / 150 + idx) * 14 + 14)
                : 6;

              return (
                <span
                  key={idx}
                  style={{ height: `${computedH}px` }}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    callState === 'speaking'
                      ? 'bg-cyan-400 shadow-xs shadow-cyan-400/50'
                      : callState === 'processing'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400 shadow-xs shadow-emerald-400/50'
                  }`}
                />
              );
            })}
          </div>

          {/* Status Label */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  callState === 'speaking'
                    ? 'bg-cyan-400 animate-ping'
                    : callState === 'processing'
                    ? 'bg-amber-400 animate-pulse'
                    : isMuted
                    ? 'bg-rose-500'
                    : 'bg-emerald-400 animate-ping'
                }`}
              ></span>
              <p className="font-extrabold text-base text-slate-100">
                {callState === 'speaking'
                  ? isArabic
                    ? `${agentSettings.name || 'أدم'} يحدّثك الآن بصوت (${currentVoiceObj.nameAr})...`
                    : `${agentSettings.name || 'Adam'} is speaking (${currentVoiceObj.nameEn})...`
                  : callState === 'processing'
                  ? isArabic
                    ? 'جاري تحليل الحديث وتوليد الرد الصوت الفائق...'
                    : 'Processing speech query...'
                  : isMuted
                  ? isArabic
                    ? 'الميكروفون مكتوم'
                    : 'Mic Muted'
                  : isArabic
                  ? `${agentSettings.name || 'أدم'} يستمع إليك مباشرة...`
                  : `${agentSettings.name || 'Adam'} is listening directly...`}
              </p>
            </div>

            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {(transcript || interimText)
                ? `"${transcript || interimText}"`
                : isArabic
                ? 'تحدث بأي لغة وسيجيبك أدم بصوت طبيعي فوري'
                : 'Speak freely in any language'}
            </p>
          </div>

          {/* Last Agent Spoken Answer preview */}
          {lastAgentAnswer && (
            <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 text-right leading-relaxed max-h-24 overflow-y-auto">
              <p className="font-bold text-emerald-400 mb-1 text-[11px] flex items-center gap-1 justify-end">
                <span>{isArabic ? `كلام ${agentSettings.name || 'أدم'}:` : `Spoken by ${agentSettings.name || 'Adam'}:`}</span>
                <Volume2 className="w-3.5 h-3.5" />
              </p>
              <p>{lastAgentAnswer}</p>
            </div>
          )}

          {/* Quick Voice or Text Direct Query Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = manualInput.trim() || transcript.trim() || interimText.trim();
              if (q) {
                handleUserSpoke(q);
                setManualInput('');
              }
            }}
            className="w-full max-w-md flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={
                isArabic
                  ? 'اكتب أو أرسل كلامك المباشر ليرد أدم بصوته...'
                  : 'Type or speak directly to receive spoken AI response...'
              }
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!manualInput.trim() && !transcript.trim() && !interimText.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-extrabold text-xs transition shrink-0"
            >
              {isArabic ? 'إرسال ⚡' : 'Send ⚡'}
            </button>
          </form>
        </div>

        {/* Call Controls Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-center gap-6">
          {/* Mute Mic Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition shadow-lg ${
              isMuted
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            title={isMuted ? (isArabic ? 'إلغاء كتم الصوت' : 'Unmute Mic') : (isArabic ? 'كتم الميكروفون' : 'Mute Mic')}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-emerald-400" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={() => {
              stopAllSpeech();
              onClose();
            }}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 transform active:scale-95 transition flex items-center justify-center"
            title={isArabic ? 'إنهاء المكالمة الصوتية' : 'End Voice Call'}
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Re-speak last answer */}
          <button
            disabled={!lastAgentAnswer}
            onClick={() => {
              if (lastAgentAnswer) {
                speakWithGlobalVoice(lastAgentAnswer, selectedVoiceId, {
                  customRate: voiceRate,
                  customPitch: voicePitch,
                });
              }
            }}
            className="p-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 border border-slate-700 transition"
            title={isArabic ? 'إعادة قراءة الرد الأخير' : 'Replay Answer'}
          >
            <Volume2 className="w-6 h-6 text-cyan-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
