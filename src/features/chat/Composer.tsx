import {
  BrainCircuit,
  Camera,
  Check,
  Code2,
  Gamepad2,
  Globe,
  Languages,
  Loader2,
  Mic,
  MicOff,
  Radio,
  FileAudio,
  MapPin,
  Search,
  Send,
  Sparkles,
  Square,
  UploadCloud,
  Wrench,
  X,
} from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { copy } from '../../core/i18n';
import { processImageFile, formatFileSize, type ProcessedImage } from '../../core/utils/imageUtils';
import { TranslationModal } from '../translation/TranslationModal';

export interface DialectOption {
  code: string;
  label: string;
  flag: string;
  nativeName: string;
}

export const GLOBAL_DIALECTS: DialectOption[] = [
  { code: 'ar-DZ', label: 'الجزائرية (الدارجة)', flag: '🇩🇿', nativeName: 'Djazairia' },
  { code: 'ar-SA', label: 'العربية الفصحى / السعودية', flag: '🇸🇦', nativeName: 'Fusha / Saudi' },
  { code: 'ar-EG', label: 'اللهجة المصرية', flag: '🇪🇬', nativeName: 'Masriya' },
  { code: 'ar-MA', label: 'المغربية (الدارجة)', flag: '🇲🇦', nativeName: 'Darija Maghribia' },
  { code: 'ar-TN', label: 'اللهجة التونسية', flag: '🇹🇳', nativeName: 'Tounsia' },
  { code: 'ar-SY', label: 'الشامية (سوريا/لبنان)', flag: '🇸🇾', nativeName: 'Shamiya' },
  { code: 'ar-PS', label: 'اللهجة الفلسطينية / الأردنية', flag: '🇵🇸', nativeName: 'Filastiniya / Urduniya' },
  { code: 'ar-IQ', label: 'اللهجة العراقية', flag: '🇮🇶', nativeName: 'Iraqiya' },
  { code: 'ar-SD', label: 'اللهجة السودانية', flag: '🇸🇩', nativeName: 'Sudaniya' },
  { code: 'ar-AE', label: 'اللهجة الإماراتية والخليجية', flag: '🇦🇪', nativeName: 'Emirati / Gulf' },
  { code: 'ar-KW', label: 'اللهجة الكويتية', flag: '🇰🇼', nativeName: 'Kuwaitiya' },
  { code: 'ar-YE', label: 'اللهجة اليمنية', flag: '🇾🇪', nativeName: 'Yamaniya' },
  { code: 'ar-OM', label: 'اللهجة العمانية', flag: '🇴🇲', nativeName: 'Omaniya' },
  { code: 'ar-LY', label: 'اللهجة الليبية', flag: '🇱🇾', nativeName: 'Libiya' },
  { code: 'en-US', label: 'English (United States)', flag: '🇺🇸', nativeName: 'English (US)' },
  { code: 'en-GB', label: 'English (United Kingdom)', flag: '🇬🇧', nativeName: 'English (UK)' },
  { code: 'en-AU', label: 'English (Australia)', flag: '🇦🇺', nativeName: 'English (AU)' },
  { code: 'en-CA', label: 'English (Canada)', flag: '🇨🇦', nativeName: 'English (CA)' },
  { code: 'fr-FR', label: 'Français (France)', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'fr-CA', label: 'Français (Québec / Canada)', flag: '🇨🇦', nativeName: 'Québécois' },
  { code: 'es-ES', label: 'Español (España)', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'es-MX', label: 'Español (México / LatAm)', flag: '🇲🇽', nativeName: 'Latinoamérica' },
  { code: 'de-DE', label: 'Deutsch (Deutschland)', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it-IT', label: 'Italiano (Italia)', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷', nativeName: 'Português BR' },
  { code: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹', nativeName: 'Português PT' },
  { code: 'tr-TR', label: 'Türkçe (Türkiye)', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'ru-RU', label: 'Русский (Russian)', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'zh-CN', label: '中文 (Mandarin Simplified)', flag: '🇨🇳', nativeName: '中文 (简体)' },
  { code: 'ja-JP', label: '日本語 (Japanese)', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko-KR', label: '한국어 (Korean)', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'id-ID', label: 'Bahasa Indonesia', flag: '🇮🇩', nativeName: 'Indonesia' },
  { code: 'fa-IR', label: 'فارسی (Persian)', flag: '🇮🇷', nativeName: 'فارسی' },
  { code: 'ur-PK', label: 'اردو (Urdu)', flag: '🇵🇰', nativeName: 'اردو' },
];

export function Composer({
  language,
  busy,
  onSend,
  onStop,
}: {
  language: 'ar' | 'en';
  busy: boolean;
  onSend: (text: string, images?: string[]) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [processingImages, setProcessingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [listening, setListening] = useState(false);
  const [showQuickModes, setShowQuickModes] = useState(false);
  const [showDialects, setShowDialects] = useState(false);
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [dialectTab, setDialectTab] = useState<'all' | 'arabic' | 'world'>('all');
  const [dialectSearch, setDialectSearch] = useState('');
  const isAr = language === 'ar';
  const [voiceDialect, setVoiceDialect] = useState<string>(() => {
    return localStorage.getItem('adam_voice_dialect') || (isAr ? 'ar-DZ' : 'en-US');
  });

  // Audio Recording & Transcription (gemini-3.5-transcribe)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const filteredDialects = useMemo(() => {
    return GLOBAL_DIALECTS.filter((d) => {
      const isArabic = d.code.startsWith('ar-');
      if (dialectTab === 'arabic' && !isArabic) return false;
      if (dialectTab === 'world' && isArabic) return false;

      if (!dialectSearch.trim()) return true;
      const q = dialectSearch.toLowerCase().trim();
      return (
        d.label.toLowerCase().includes(q) ||
        d.nativeName.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q)
      );
    });
  }, [dialectTab, dialectSearch]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const t = copy(language);

  // Listen for external image trigger events
  useEffect(() => {
    const handleTrigger = (e: CustomEvent<{ promptPrefix?: string; imageUrls?: string[]; skipFileInput?: boolean }>) => {
      if (e.detail?.promptPrefix) {
        setDraft((prev) => (prev ? `${e.detail.promptPrefix} ${prev}` : e.detail.promptPrefix));
      }
      if (e.detail?.imageUrls && e.detail.imageUrls.length > 0) {
        const newImgs: ProcessedImage[] = e.detail.imageUrls.map((url, idx) => ({
          id: `img-${Date.now()}-${idx}`,
          dataUrl: url,
          name: `screen_capture_${idx + 1}.png`,
          sizeBytes: Math.round(url.length * 0.75),
          mimeType: 'image/png',
        }));
        setImages((prev) => [...prev, ...newImgs]);
      } else if (!e.detail?.skipFileInput) {
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('adam_trigger_image_upload' as any, handleTrigger);
    return () => {
      window.removeEventListener('adam_trigger_image_upload' as any, handleTrigger);
    };
  }, []);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 160)}px`;
    }
  }, [draft]);

  const handleFiles = async (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name)
    );

    if (validImageFiles.length === 0) return;

    setProcessingImages(true);
    try {
      const processed = await Promise.all(
        validImageFiles.map((file) => processImageFile(file))
      );
      setImages((prev) => [...prev, ...processed].slice(0, 8));
    } catch (err) {
      console.error('Failed to process image attachment:', err);
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      handleFiles(imageFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const submit = () => {
    const text = draft.trim();
    if ((!text && images.length === 0) || busy) return;

    const defaultPrompt = isAr
      ? 'قم بفحص وتحليل الصورة المرفقة واستنتج المطلوب وقدم الحل الدقيق والشامل فوراً.'
      : 'Analyze this image and provide the complete, accurate solution directly.';

    const finalPrompt = text || defaultPrompt;
    const imageUrls = images.map((img) => img.dataUrl);

    onSend(finalPrompt, imageUrls.length > 0 ? imageUrls : undefined);
    setDraft('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const sendAudioToTranscribeApi = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        if (!base64Data) {
          setIsTranscribing(false);
          return;
        }

        const res = await fetch('/api/audio/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        });

        const data = await res.json();
        if (data.ok && data.transcript) {
          setDraft((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
        } else {
          console.warn('Transcription returned no text or error:', data);
        }
        setIsTranscribing(false);
      };
    } catch (e) {
      console.error('Audio transcription error:', e);
      setIsTranscribing(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerIntervalRef.current);
        setRecordSeconds(0);
        setIsRecordingAudio(false);
        sendAudioToTranscribeApi(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecordingAudio(true);
      setRecordSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone stream error, falling back to browser speech recognition', err);
      fallbackBrowserSpeech();
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecordingAudio) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  const fallbackBrowserSpeech = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setDraft((prev) =>
        prev
          ? `${prev} (${isAr ? 'الإملاء الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported'})`
          : isAr
          ? 'الإملاء الصوتي غير مدعوم في هذا المتصفح'
          : 'Speech recognition not supported'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceDialect || (isAr ? 'ar-DZ' : 'en-US');
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendAudioToTranscribeApi(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleSelectDialect = (code: string) => {
    setVoiceDialect(code);
    try {
      localStorage.setItem('adam_voice_dialect', code);
    } catch {}
    setShowDialects(false);
  };

  const insertPromptChip = (prefix: string) => {
    setDraft((prev) => (prev ? `${prefix} ${prev}` : prefix));
    setShowQuickModes(false);
    textareaRef.current?.focus();
  };

  return (
    <div
      className={`composer-wrap relative transition-all duration-200 ${
        isDragging ? 'ring-2 ring-[var(--accent)] bg-[var(--accent-subtle)] rounded-3xl' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-[var(--surface)]/95 border-2 border-dashed border-[var(--accent)] backdrop-blur-md pointer-events-none animate-fadeIn">
          <div className="flex flex-col items-center gap-2 text-center text-[var(--accent)] font-medium">
            <UploadCloud size={32} className="animate-bounce" />
            <span className="text-sm font-bold">
              {isAr ? 'أفلت الصورة هنا للفحص الذكي ⚡' : 'Drop image here for analysis ⚡'}
            </span>
          </div>
        </div>
      )}

      {/* Hidden File Input for Image Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files);
          }
        }}
      />

      {/* Image Attachments Preview Tray */}
      {images.length > 0 && (
        <div className="mb-2.5 p-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col gap-2 animate-fadeIn shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--text)] font-semibold px-1">
            <span className="flex items-center gap-1.5 text-[var(--accent)]">
              <Sparkles size={13} className="animate-pulse" />
              <span>{isAr ? 'صور مرفقة جاهزة للإدراك البصري' : 'Attached images ready for Vision analysis'}</span>
            </span>
            <button
              type="button"
              onClick={() => setImages([])}
              className="text-[var(--muted)] hover:text-rose-400 text-[11px] transition cursor-pointer"
            >
              {isAr ? 'حذف الكل' : 'Clear'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative flex items-center gap-2 p-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm max-w-xs"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-10 h-10 object-cover rounded-lg border border-[var(--border)]"
                />
                <div className="flex flex-col min-w-0 pr-1 text-[11px]">
                  <span className="truncate max-w-[110px] text-[var(--text)] font-medium">{img.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{formatFileSize(img.sizeBytes)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="p-1 rounded-full bg-[var(--surface-2)] text-[var(--muted)] hover:text-rose-400 transition cursor-pointer"
                  title={isAr ? 'إزالة' : 'Remove'}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Developer & Creator Chips Drawer (Horizontal scroll for all phone widths) */}
      {showQuickModes && (
        <div className="flex items-center gap-2 mb-2.5 px-1 overflow-x-auto scrollbar-none py-0.5 animate-fadeIn select-none">
          <button
            type="button"
            onClick={() => setShowDialects((prev) => !prev)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0 ${
              showDialects
                ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]'
                : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border-[var(--border)]'
            }`}
          >
            <Languages size={13} className="text-emerald-400" />
            <span>
              {GLOBAL_DIALECTS.find((d) => d.code === voiceDialect)?.flag}{' '}
              {GLOBAL_DIALECTS.find((d) => d.code === voiceDialect)?.label.split(' ')[0] || (isAr ? 'اللهجة واللغة' : 'Dialect')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? '🔍 ابحث في Google وقدم أحدث معلومات حية مع المصادر لـ: ' : '🔍 Search Google for real-time live sources about: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Google Search Grounding (gemini-3.5-flash)"
          >
            <Search size={13} className="text-cyan-400" />
            <span>{isAr ? 'بحث حي Google 🔍' : 'Search Grounding 🔍'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? '📍 ابحث في خرائط Google عن أفضل الأماكن والتقييمات والروابط لـ: ' : '📍 Find Google Maps locations, ratings, and reviews for: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Google Maps Grounding (gemini-3.5-flash)"
          >
            <MapPin size={13} className="text-emerald-400" />
            <span>{isAr ? 'خرائط Google 📍' : 'Maps Grounding 📍'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('adam:open-live-voice'))}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Multimodal Live API via WebSockets (ADEM-G 3.8 Live)"
          >
            <Radio size={13} className="text-purple-400 animate-pulse" />
            <span>{isAr ? 'بث حي صوت ورؤية ⚡' : 'Multimodal Live ⚡'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'ترجم هذا الكلام باحترافية ودقة إلى الإنجليزية: ' : 'Translate this text accurately to Arabic: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Languages size={13} className="text-emerald-400" />
            <span>{isAr ? 'ترجمة فورية 🌐' : 'Translate 🌐'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'فكر بعمق استثنائي وحلل كل خطوة وقدم أدق حل علمي/برمجي لـ: ' : 'Think deeply step-by-step with ultra-high reasoning for: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:border-violet-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <BrainCircuit size={13} className="text-violet-400" />
            <span>{isAr ? 'تفكير عميق 🧠' : 'Deep Reasoning 🧠'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'برمج لي كود كامل بنسبة 100% لـ: ' : 'Write 100% complete production code for: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Code2 size={13} className="text-[var(--accent)]" />
            <span>{isAr ? 'برمجة كود' : 'Write Code'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'اصنع لعبة تفاعلية HTML5 Canvas لـ: ' : 'Build a playable HTML5 Canvas game for: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Gamepad2 size={13} className="text-cyan-400" />
            <span>{isAr ? 'لعبة تفاعلية' : 'Interactive Game'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'افحص هذا الخطأ واشرح سببه وقدم الحل الجذري: ' : 'Analyze this error and provide the root cause fix: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Wrench size={13} className="text-amber-400" />
            <span>{isAr ? 'تصحيح أخطاء' : 'Debug Fix'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'أنشئ صورة سينمائية فائقة الدقة 8K لـ: ' : 'Generate an 8K photorealistic visual of: ')}
            className="text-xs font-bold px-3 py-1.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            <Sparkles size={13} className="text-purple-400" />
            <span>{isAr ? 'توليد 8K' : '8K Visual'}</span>
          </button>
        </div>
      )}

      {/* Dialect / Language Selector Tray */}
      {showDialects && (
        <div className="mb-2.5 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] animate-fadeIn shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text)]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Globe size={14} />
              <span>{isAr ? 'اختر لهجة الإملاء والحديث' : 'Select Voice & Dialect Accent'}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDialects(false)}
              className="text-[var(--muted)] hover:text-[var(--text)] text-xs font-medium cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>

          {/* Dialect Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1 bg-[var(--surface)] p-0.5 rounded-xl border border-[var(--border)] flex-shrink-0">
              <button
                type="button"
                onClick={() => setDialectTab('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  dialectTab === 'all'
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? 'الكل' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setDialectTab('arabic')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  dialectTab === 'arabic'
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? '🇩🇿 العربية واللهجات' : 'Arabic Dialects'}
              </button>
              <button
                type="button"
                onClick={() => setDialectTab('world')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  dialectTab === 'world'
                    ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {isAr ? '🌍 لغات عالمية' : 'Global Languages'}
              </button>
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                value={dialectSearch}
                onChange={(e) => setDialectSearch(e.target.value)}
                placeholder={isAr ? 'بحث في اللهجات واللغات...' : 'Filter dialects or countries...'}
                className="w-full py-1 px-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              {dialectSearch && (
                <button
                  type="button"
                  onClick={() => setDialectSearch('')}
                  className={`absolute top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] text-xs ${isAr ? 'left-2' : 'right-2'}`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Dialect Options Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {filteredDialects.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => handleSelectDialect(d.code)}
                className={`flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl text-xs text-right transition cursor-pointer ${
                  voiceDialect === d.code
                    ? 'bg-[var(--accent)] text-slate-950 font-bold shadow-sm'
                    : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{d.flag}</span>
                  <span className="truncate">{d.label}</span>
                </div>
                {voiceDialect === d.code && <Check size={12} className="flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio Recording / Transcription Status Pill (gemini-3.5-transcribe) */}
      {(isRecordingAudio || isTranscribing) && (
        <div className="flex items-center justify-between mb-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            {isRecordingAudio ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold text-rose-400">
                  {isAr ? `جاري التسجيل الصوتي (${recordSeconds}s)` : `Recording audio (${recordSeconds}s)`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? '• اضغط على الميكروفون للإنهاء والتفريغ' : '• Click mic to stop & transcribe'}
                </span>
              </>
            ) : (
              <>
                <Loader2 size={13} className="animate-spin text-cyan-400" />
                <span className="font-bold text-cyan-300">
                  {isAr ? 'جاري التفريغ الصوتي الذكي...' : 'Transcribing audio...'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  gemini-3.5-transcribe
                </span>
              </>
            )}
          </div>
          {isRecordingAudio && (
            <button
              type="button"
              onClick={stopAudioRecording}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
            >
              {isAr ? 'إنهاء وتفريغ' : 'Stop & Done'}
            </button>
          )}
        </div>
      )}

      {/* Main Luxury Composer Box */}
      <div className="composer flex items-end gap-1 sm:gap-2 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-[var(--surface)]/95 border border-[var(--border-strong)] shadow-2xl backdrop-blur-3xl transition-all duration-300 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_30px_var(--accent-glow)] w-full">
        {/* Quick Power Tools Toggle */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            showQuickModes
              ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-bold shadow-inner'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
          onClick={() => setShowQuickModes((prev) => !prev)}
          aria-label="Toggle prompt tools"
          title={isAr ? 'أدوات مساعدة سريعة' : 'Quick Prompt Tools'}
        >
          <Sparkles size={16} />
        </button>

        {/* Attach Image Button */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            images.length > 0
              ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/40 shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
          onClick={() => fileInputRef.current?.click()}
          aria-label={isAr ? 'إرفاق صورة أو مستند' : 'Attach Image'}
          title={isAr ? 'إرفاق صورة' : 'Attach image'}
          disabled={processingImages}
        >
          {processingImages ? (
            <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
          ) : (
            <Camera size={16} />
          )}
        </button>

        {/* Dedicated Instant Translation Trigger Button (Desktop / Tablet) */}
        <button
          type="button"
          className={`hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl items-center justify-center transition-all cursor-pointer shrink-0 ${
            showTranslateModal
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-[var(--muted)] hover:text-emerald-400 hover:bg-[var(--surface-2)]'
          }`}
          onClick={() => setShowTranslateModal(true)}
          aria-label={isAr ? 'ترجمة فورية للنصوص' : 'Universal Translation'}
          title={isAr ? 'ترجمة النصوص إلى أي لغة' : 'Translate text to any language'}
        >
          <Languages size={16} />
        </button>

        {/* Flexible Text Input Wrapper */}
        <div className="flex-1 min-w-0 w-full flex items-center">
          <textarea
            ref={textareaRef}
            dir={isAr ? 'rtl' : 'ltr'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              listening
                ? isAr
                  ? 'جاري الاستماع بدقة...'
                  : 'Listening...'
                : images.length > 0
                ? isAr
                  ? 'اكتب رسالتك حول الصورة...'
                  : 'Ask about the attached image...'
                : isAr
                ? 'اكتب رسالتك هنا...'
                : 'Type your message here...'
            }
            rows={1}
            disabled={busy}
            className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] placeholder:truncate placeholder:whitespace-nowrap resize-none py-1.5 sm:py-2 px-1 min-h-[28px] max-h-[160px] font-normal leading-relaxed overflow-y-auto block"
          />
        </div>

        {/* Hidden Audio File Input for gemini-3.5-transcribe */}
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleAudioFileUpload}
        />

        {/* Audio File Upload for gemini-3.5-transcribe (Desktop / Tablet) */}
        <button
          type="button"
          className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl items-center justify-center transition-all cursor-pointer shrink-0 text-[var(--muted)] hover:text-cyan-400 hover:bg-[var(--surface-2)]"
          onClick={() => audioFileInputRef.current?.click()}
          aria-label={isAr ? 'تفريغ ملف صوتي (gemini-3.5-transcribe)' : 'Transcribe Audio File (gemini-3.5-transcribe)'}
          title={isAr ? 'رفع وتفريغ ملف صوتي بالذكاء الاصطناعي' : 'Upload & Transcribe Audio'}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <Loader2 size={16} className="animate-spin text-cyan-400" />
          ) : (
            <FileAudio size={16} />
          )}
        </button>

        {/* Voice Input Microphone (gemini-3.5-transcribe) */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isRecordingAudio
              ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : listening
              ? 'bg-amber-500/20 text-amber-400 animate-pulse border border-amber-500/40'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
          onClick={toggleVoiceRecording}
          aria-label={isAr ? 'تسجيل وتفريغ صوتي (gemini-3.5-transcribe)' : 'Transcribe Voice (gemini-3.5-transcribe)'}
          title={
            isRecordingAudio
              ? isAr
                ? `إيقاف التسجيل وتفريغ الكلام (${recordSeconds}s)`
                : `Stop & Transcribe (${recordSeconds}s)`
              : isAr
              ? 'تسجيل وتفريغ صوتي بدقة فائقة (gemini-3.5-transcribe)'
              : 'Voice Recording & Transcription (gemini-3.5-transcribe)'
          }
        >
          {isRecordingAudio ? (
            <MicOff size={16} className="text-rose-400" />
          ) : (
            <Mic size={16} />
          )}
        </button>

        {/* Send / Stop Action Button */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg ${
            busy
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
              : draft.trim() || images.length > 0
              ? 'bg-[var(--accent)] hover:opacity-95 text-[var(--accent-contrast)] shadow-[0_0_20px_var(--accent-glow)] active:scale-95'
              : 'bg-[var(--surface-2)] text-[var(--muted)] opacity-50 cursor-not-allowed'
          }`}
          onClick={busy ? onStop : submit}
          aria-label={busy ? t.stop : t.send}
          disabled={!busy && !draft.trim() && images.length === 0}
        >
          {busy ? <Square size={13} fill="currentColor" /> : <Send size={15} />}
        </button>
      </div>

      {/* Clean & Minimalist Creator Signature */}
      <div className="flex items-center justify-between mt-1.5 px-3 text-[11px] text-[var(--muted)] select-none">
        <span className="font-semibold text-[var(--text-secondary)]">
          {isAr ? 'ADEM • تم تطويره من قبل : أدم فيدات' : 'ADEM • Developed by : Adem Feidat'}
        </span>
        <span className="font-mono text-[10px]">v2.5 Ultra</span>
      </div>

      {/* Universal Fast Translation Modal */}
      <TranslationModal
        isOpen={showTranslateModal}
        onClose={() => setShowTranslateModal(false)}
        language={language}
        initialText={draft}
        onSendToChat={(translatedText) => {
          setDraft(translatedText);
          setShowTranslateModal(false);
          textareaRef.current?.focus();
        }}
      />
    </div>
  );
}
