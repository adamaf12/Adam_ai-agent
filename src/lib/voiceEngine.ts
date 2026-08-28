import { loadSettings } from './storage';
import { syncVoiceEngineLanguage } from './languageResolver';
export interface GlobalVoice {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  gender: 'male' | 'female';
  lang: string;
  badge: string;
  pitch: number;
  rate: number;
  preferredBrowserKeywords: string[];
}

export const GLOBAL_VOICES: GlobalVoice[] = [
  {
    id: 'adam-neural',
    nameAr: 'أدم القيادي (Adam Executive Male)',
    nameEn: 'Adam Executive Male (Arabic & Universal)',
    descriptionAr: 'صوت رجالي قيادي عميق، فصيح ومتميز بنبرة رزينة وواضحة جداً',
    descriptionEn: 'Deep, authoritative executive male voice with crisp diction',
    gender: 'male',
    lang: 'ar-SA',
    badge: 'صوت أدم القيادي 👨‍💼',
    pitch: 0.88,
    rate: 1.0,
    preferredBrowserKeywords: ['Tariq', 'Maged', 'Naayf', 'Zayd', 'David', 'Mark', 'Male', 'ar'],
  },
  {
    id: 'zeina-arabic',
    nameAr: 'زينة الناعمة (Zeina Soft Female)',
    nameEn: 'Zeina Natural Female (Arabic)',
    descriptionAr: 'صوت أنثوي عربي ناعم، هادئ وطبيعي للغاية للقراءة والتواصل الرقيق',
    descriptionEn: 'Gentle, expressive, and warm female Arabic voice',
    gender: 'female',
    lang: 'ar-EG',
    badge: 'أنثوي دافئ 👩‍💼',
    pitch: 1.15,
    rate: 0.96,
    preferredBrowserKeywords: ['Zeina', 'Salma', 'Hoda', 'Laila', 'Zira', 'Female', 'ar'],
  },
  {
    id: 'sarah-expressive',
    nameAr: 'سارة المشرقة (Sarah Vibrant Female)',
    nameEn: 'Sarah Vibrant Female AI',
    descriptionAr: 'صوت أنثوي عصري وحيوي بنبرة ذكية ومشرقة للتفاعل والتحدث المباشر',
    descriptionEn: 'Bright, energetic, and modern female conversational voice',
    gender: 'female',
    lang: 'ar-SA',
    badge: 'أنثوي حيوية 🌺',
    pitch: 1.22,
    rate: 1.02,
    preferredBrowserKeywords: ['Sarah', 'Zariyah', 'Laila', 'Salma', 'Female', 'ar'],
  },
  {
    id: 'tariq-news',
    nameAr: 'طارق الإخباري (Tariq Broadcast Male)',
    nameEn: 'Tariq Broadcast Male (Deep)',
    descriptionAr: 'صوت رجالي عربي فصيح جداً بنبرة الإلقاء والتحليل الإخباري الوقور',
    descriptionEn: 'Very deep, articulate news anchor male voice for formal tasks',
    gender: 'male',
    lang: 'ar-SA',
    badge: 'إخباري عميق 🎙️',
    pitch: 0.80,
    rate: 1.05,
    preferredBrowserKeywords: ['Tariq', 'Naayf', 'Maged', 'Arabic', 'Male', 'ar'],
  },
  {
    id: 'marcus-studio',
    nameAr: 'ماركوس الإنجليزي (Marcus English Male)',
    nameEn: 'Marcus Global English Studio Male',
    descriptionAr: 'صوت رجالي إنجليزي احترافي بنبرة استوديو متقنة للمحادثات العالمية',
    descriptionEn: 'Studio quality English male voice for technical and global talks',
    gender: 'male',
    lang: 'en-US',
    badge: 'English Male 🇬🇧',
    pitch: 0.92,
    rate: 1.0,
    preferredBrowserKeywords: ['Natural', 'Neural', 'Google', 'David', 'Guy', 'George', 'en'],
  },
  {
    id: 'sophia-english',
    nameAr: 'صوفيا الإنجليزية (Sophia English Female)',
    nameEn: 'Sophia English Studio Female',
    descriptionAr: 'صوت أنثوي إنجليزي راقٍ بنطق دولي فصيح ونقي',
    descriptionEn: 'Elegant English female voice with flawless global pronunciation',
    gender: 'female',
    lang: 'en-US',
    badge: 'English Female 🇺🇸',
    pitch: 1.18,
    rate: 0.98,
    preferredBrowserKeywords: ['Samantha', 'Karen', 'Zira', 'Victoria', 'Jenny', 'Female', 'en'],
  },
  {
    id: 'pierre-french',
    nameAr: 'بيير الفرنسي (Pierre French Male)',
    nameEn: 'Pierre French Studio Male',
    descriptionAr: 'صوت رجالي فرنسي أنيق وناعم للمحادثات باللغة الفرنسية',
    descriptionEn: 'Smooth French male voice with elegant Parisian accent',
    gender: 'male',
    lang: 'fr-FR',
    badge: 'Français Homme 🇫🇷',
    pitch: 0.90,
    rate: 0.97,
    preferredBrowserKeywords: ['fr', 'French', 'Thomas', 'Nicolas', 'Paul', 'Male'],
  },
  {
    id: 'amelie-french',
    nameAr: 'أميتي الفرنسية (Amélie French Female)',
    nameEn: 'Amélie French Studio Female',
    descriptionAr: 'صوت أنثوي فرنسي ناعم ورقيق للتحدث باللغة الفرنسية بطلاقة',
    descriptionEn: 'Graceful French female voice with melodious tone',
    gender: 'female',
    lang: 'fr-FR',
    badge: 'Français Femme 🌸',
    pitch: 1.14,
    rate: 1.0,
    preferredBrowserKeywords: ['fr', 'French', 'Hortense', 'Julie', 'Roxane', 'Female'],
  },
  {
    id: 'carlos-spanish',
    nameAr: 'كارلوس الإسباني (Carlos Spanish Male)',
    nameEn: 'Carlos Spanish Male Voice',
    descriptionAr: 'صوت رجالي إسباني دافئ وطبيعي للتحدث بالإسبانية بطلاقة',
    descriptionEn: 'Warm and resonant Spanish male voice',
    gender: 'male',
    lang: 'es-ES',
    badge: 'Español Hombre 🇪🇸',
    pitch: 0.88,
    rate: 1.0,
    preferredBrowserKeywords: ['es', 'Spanish', 'Alvaro', 'Jorge', 'Pablo', 'Male'],
  },
  {
    id: 'hans-german',
    nameAr: 'هانس الألماني (Hans German Male)',
    nameEn: 'Hans German Male Voice',
    descriptionAr: 'صوت رجالي ألماني واضح ودقيق للحوارات بالألمانية',
    descriptionEn: 'Clear and articulate German male voice',
    gender: 'male',
    lang: 'de-DE',
    badge: 'Deutsch Mann 🇩🇪',
    pitch: 0.94,
    rate: 0.95,
    preferredBrowserKeywords: ['de', 'German', 'Stefan', 'Klaus', 'Male'],
  },
  {
    id: 'cyber-glitch-male',
    nameAr: 'نيو سايبر المستقبلي (Neo Cyber Synth Male)',
    nameEn: 'Neo Cyber Synth Male (Futuristic)',
    descriptionAr: 'نبرة صوت مستقبلية معدنية ساحرة ومتقنة تمنح تجربة تواصل خارجة عن المألوف',
    descriptionEn: 'Futuristic synth-harmonized resonant male voice with cyberpunk undertones',
    gender: 'male',
    lang: 'ar-SA',
    badge: 'سايبر مستقبلي 🤖',
    pitch: 0.76,
    rate: 1.04,
    preferredBrowserKeywords: ['David', 'Guy', 'Neural', 'Natural', 'Male', 'ar'],
  },
  {
    id: 'luna-cosmic-female',
    nameAr: 'لونا الكونية الساحرة (Luna Cosmic Ambient Female)',
    nameEn: 'Luna Cosmic Ambient Female',
    descriptionAr: 'صوت أنثوي فضائي حالِم ناعم وعميق يعزز الاسترخاء والتركيز الإبداعي الفائق',
    descriptionEn: 'Ethereal, dreamy, ultra-smooth cosmic ambient female voice',
    gender: 'female',
    lang: 'ar-EG',
    badge: 'كوني حالِم ✨',
    pitch: 1.28,
    rate: 0.92,
    preferredBrowserKeywords: ['Zeina', 'Salma', 'Zira', 'Samantha', 'Female', 'ar'],
  },
  {
    id: 'global-auto',
    nameAr: 'المكتشف الذكي للغة والجنس (Auto Smart Multi-Voice)',
    nameEn: 'Auto Smart Multi-Voice Engine',
    descriptionAr: 'يكتشف لغة النص ونوعه تلقائياً مع موازنة الصوت تلقائياً',
    descriptionEn: 'Automatically detects language & selects optimal voice dynamics',
    gender: 'male',
    lang: 'auto',
    badge: 'مكتشف آلي 🌍',
    pitch: 1.0,
    rate: 1.0,
    preferredBrowserKeywords: ['Neural', 'Natural', 'Google'],
  },
];

let activeSpeechUtterance: SpeechSynthesisUtterance | null = null;

export function stopAllSpeech(): void {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {}
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeSpeechUtterance = null;
  }
}

// Detect text language helper
function detectLanguage(text: string): string {
  const arabicPattern = /[\u0600-\u06FF]/;
  const frenchPattern = /[àâäéèêëîïôöùûüç]/i;
  const spanishPattern = /[ñáéíóúü]/i;
  const germanPattern = /[äöüß]/i;

  if (arabicPattern.test(text)) return 'ar-SA';
  if (frenchPattern.test(text)) return 'fr-FR';
  if (spanishPattern.test(text)) return 'es-ES';
  if (germanPattern.test(text)) return 'de-DE';
  return 'en-US';
}

export function speakWithGlobalVoice(
  text: string,
  voiceId?: string,
  options?: {
    customRate?: number;
    customPitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser environment');
    options?.onEnd?.();
    return;
  }

  // Clean text from code blocks or heavy symbols for smooth audio output
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' [كود برمجي] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_-]/g, ' ')
    .trim();

  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  stopAllSpeech();

  
  const settings = loadSettings();
  const detectedTextLang = detectLanguage(cleanText);
  const optimalVoiceId = syncVoiceEngineLanguage(settings, detectedTextLang.slice(0, 2));
  const finalVoiceId = voiceId && voiceId !== 'adam-neural' ? voiceId : (settings.voiceSettings?.voiceId || optimalVoiceId);
  let voiceConfig = GLOBAL_VOICES.find((v) => v.id === finalVoiceId) || GLOBAL_VOICES[0];
  
  let targetLang = voiceConfig.lang;

  if (targetLang === 'auto' || voiceId === 'global-auto' || !voiceId || voiceId === 'adam-neural') {
    targetLang = detectedTextLang;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options?.customRate || voiceConfig.rate;
  utterance.pitch = options?.customPitch || voiceConfig.pitch;
  utterance.lang = targetLang;

  // Try to find matching browser neural / high quality voice respecting gender & language
  const availableVoices = window.speechSynthesis.getVoices();
  if (availableVoices && availableVoices.length > 0) {
    let matchedVoice: SpeechSynthesisVoice | undefined;

    const langPrefix = targetLang.slice(0, 2).toLowerCase();
    const isFemaleRequested = voiceConfig.gender === 'female';

    // 1. First priority: Match language + gender + specific voice keywords
    for (const kw of voiceConfig.preferredBrowserKeywords) {
      matchedVoice = availableVoices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const vLangLower = v.lang.toLowerCase();
        const matchesLang = vLangLower.includes(langPrefix);
        const matchesKw = nameLower.includes(kw.toLowerCase());

        // Gender filter
        if (isFemaleRequested) {
          const isMaleName = nameLower.includes('male') || nameLower.includes('david') || nameLower.includes('mark') || nameLower.includes('guy');
          return matchesLang && matchesKw && !isMaleName;
        } else {
          const isFemaleName = nameLower.includes('female') || nameLower.includes('zira') || nameLower.includes('samantha') || nameLower.includes('zeina');
          return matchesLang && matchesKw && !isFemaleName;
        }
      });
      if (matchedVoice) break;
    }

    // 2. Second priority: Match language + gender without keyword
    if (!matchedVoice) {
      matchedVoice = availableVoices.find((v) => {
        const nameLower = v.name.toLowerCase();
        const matchesLang = v.lang.toLowerCase().startsWith(langPrefix);
        if (isFemaleRequested) {
          return matchesLang && (nameLower.includes('female') || nameLower.includes('woman') || nameLower.includes('zira') || nameLower.includes('samantha') || nameLower.includes('zeina') || nameLower.includes('laila'));
        } else {
          return matchesLang && !nameLower.includes('female') && !nameLower.includes('zira');
        }
      });
    }

    // 3. Fallback: Any voice matching target language prefix
    if (!matchedVoice) {
      matchedVoice = availableVoices.find((v) =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    activeSpeechUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    activeSpeechUtterance = null;
    options?.onError?.(e);
  };

  activeSpeechUtterance = utterance;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('[Speech Synthesis Error]:', err);
    options?.onError?.(err);
  }
}

/**
 * Immediate Real-Time Audio Chunk Streaming Synthesizer.
 * Splits incoming text or streams into sentence/phrase chunks and synthesizes each chunk immediately,
 * minimizing latency for live voice interactions.
 */
export function speakChunkStream(
  text: string,
  voiceId?: string,
  options?: {
    customRate?: number;
    customPitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): void {
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' [كود برمجي] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#*_-]/g, ' ')
    .trim();

  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  // Split into sentence/clause chunks for zero-latency streaming synthesis
  const rawChunks = cleanText.split(/([.!?\n؛؟]+)/);
  const chunks: string[] = [];
  for (let i = 0; i < rawChunks.length; i += 2) {
    const clause = rawChunks[i] || '';
    const punctuation = rawChunks[i + 1] || '';
    const chunk = (clause + punctuation).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
  }

  if (chunks.length <= 1) {
    speakWithGlobalVoice(cleanText, voiceId, options);
    return;
  }

  stopAllSpeech();
  let index = 0;
  let hasStarted = false;

  const speakNext = () => {
    if (index >= chunks.length) {
      options?.onEnd?.();
      return;
    }

    const currentChunk = chunks[index];
    index++;

    speakWithGlobalVoice(currentChunk, voiceId, {
      customRate: options?.customRate,
      customPitch: options?.customPitch,
      onStart: () => {
        if (!hasStarted) {
          hasStarted = true;
          options?.onStart?.();
        }
      },
      onEnd: speakNext,
      onError: (err) => {
        console.warn('[Chunk Synthesis Error]:', err);
        speakNext();
      },
    });
  };

  speakNext();
}

export function isCurrentlySpeaking(): boolean {
  if (currentAudioElement && !currentAudioElement.paused) {
    return true;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

let currentAudioElement: HTMLAudioElement | null = null;

export async function speakWithGrokTTS(
  text: string,
  voiceId: string = 'eve',
  language?: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  stopAllSpeech();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id: voiceId, language }),
    });

    if (!res.ok) {
      console.warn('[Grok TTS Fallback]: Backend returned non-OK status, switching to browser TTS');
      speakWithGlobalVoice(text, 'adam-neural', options);
      return;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio')) {
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;

      audio.onplay = () => options?.onStart?.();
      audio.onended = () => {
        currentAudioElement = null;
        URL.revokeObjectURL(audioUrl);
        options?.onEnd?.();
      };
      audio.onerror = (e) => {
        currentAudioElement = null;
        URL.revokeObjectURL(audioUrl);
        console.warn('[Grok Audio Play Error]:', e);
        speakWithGlobalVoice(text, 'adam-neural', options);
      };

      await audio.play();
      return;
    }

    // Fallback if JSON returned
    speakWithGlobalVoice(text, 'adam-neural', options);
  } catch (err) {
    console.warn('[Grok TTS Fetch Error]:', err);
    speakWithGlobalVoice(text, 'adam-neural', options);
  }
}
