import React, { useEffect, useRef, useState } from 'react';
import { Mic, Sparkles, Volume2, Zap } from 'lucide-react';
import { speakWithGlobalVoice } from '../lib/voiceEngine';

interface WakeWordListenerProps {
  isEnabled: boolean;
  isArabic: boolean;
  agentName: string;
  isLiveVoiceOpen: boolean;
  isContinuousListening: boolean;
  customWakeWord?: string;
  onWakeWordTriggered: (commandAfterWakeWord?: string) => void;
  selectedVoiceId?: string;
}

// Web Audio API Activation Sci-Fi Chime
function playWakeChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // First high note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second chime note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.1); // D6
    gain2.gain.setValueAtTime(0.12, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('[Wake Chime Error]:', err);
  }
}

export const WakeWordListener: React.FC<WakeWordListenerProps> = ({
  isEnabled,
  isArabic,
  agentName,
  isLiveVoiceOpen,
  isContinuousListening,
  customWakeWord,
  onWakeWordTriggered,
  selectedVoiceId = 'adam-neural',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showWakeToast, setShowWakeToast] = useState(false);
  const [lastDetectedText, setLastDetectedText] = useState('');

  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);

  const defaultPhrases = [
    'آدم',
    'ادم',
    'أدم',
    'يا آدم',
    'يا ادم',
    'يا أدم',
    'ياادام',
    'ادام',
    'adam',
    'hey adam',
    'hi adam',
    'ok adam',
    'hello adam',
  ];

  if (agentName && !defaultPhrases.includes(agentName.toLowerCase())) {
    defaultPhrases.push(agentName.toLowerCase());
    defaultPhrases.push(`يا ${agentName.toLowerCase()}`);
  }

  if (customWakeWord && customWakeWord.trim()) {
    defaultPhrases.push(customWakeWord.trim().toLowerCase());
  }

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // If feature disabled, or if other voice features are active, pause background wake-word listener
    if (!isEnabled || isLiveVoiceOpen || isContinuousListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition not supported for background Wake Word.');
      setIsListening(false);
      return;
    }

    let restartTimeout: NodeJS.Timeout | null = null;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = isArabic ? 'ar-SA' : 'en-US';

    recognition.onstart = () => {
      if (isComponentMounted.current) {
        setIsListening(true);
      }
    };

    recognition.onresult = (event: any) => {
      let currentSpeech = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentSpeech += event.results[i][0].transcript;
      }

      const lowerSpeech = currentSpeech.toLowerCase().trim();

      // Check if any wake phrase matches
      for (const phrase of defaultPhrases) {
        const idx = lowerSpeech.indexOf(phrase);
        if (idx !== -1) {
          // Matched Wake Word!
          playWakeChime();

          // Extract text following the wake phrase
          const commandAfter = lowerSpeech.substring(idx + phrase.length).trim();

          setLastDetectedText(currentSpeech);
          setShowWakeToast(true);
          setTimeout(() => setShowWakeToast(false), 3500);

          // Stop recognition temporarily to allow response handling
          try {
            recognition.stop();
          } catch (e) {}

          onWakeWordTriggered(commandAfter);
          break;
        }
      }
    };

    recognition.onerror = (err: any) => {
      if (err?.error !== 'no-speech' && err?.error !== 'aborted') {
        console.warn('[Wake Word Recognition Error]:', err?.error);
      }
    };

    recognition.onend = () => {
      if (isComponentMounted.current && isEnabled && !isLiveVoiceOpen && !isContinuousListening) {
        restartTimeout = setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {}
        }, 500);
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[Wake Word Start Error]:', err);
    }

    return () => {
      if (restartTimeout) clearTimeout(restartTimeout);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [isEnabled, isArabic, agentName, isLiveVoiceOpen, isContinuousListening, customWakeWord]);

  if (!isEnabled) return null;

  return (
    <>
      {/* Visual Toast Notification when Wake Word is Triggered */}
      {showWakeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-950/90 text-white border border-emerald-500/50 shadow-2xl shadow-emerald-500/30 flex items-center gap-3 animate-bounce">
          <div className="p-2 rounded-xl bg-emerald-500 text-slate-950">
            <Zap className="w-5 h-5 fill-slate-950 animate-pulse" />
          </div>
          <div className="text-xs">
            <p className="font-extrabold text-emerald-400">
              {isArabic ? '⚡ استجاب أدم لكلمة الاستيقاظ!' : '⚡ Adam woke up to your voice!'}
            </p>
            <p className="text-[11px] text-slate-300 line-clamp-1 italic">
              "{lastDetectedText}"
            </p>
          </div>
        </div>
      )}
    </>
  );
};
