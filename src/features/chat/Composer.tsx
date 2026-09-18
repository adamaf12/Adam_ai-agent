import {
  Camera,
  Code2,
  Gamepad2,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Square,
  UploadCloud,
  Wrench,
  X,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { copy } from '../../core/i18n';
import { processImageFile, formatFileSize, type ProcessedImage } from '../../core/utils/imageUtils';

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const t = copy(language);
  const isAr = language === 'ar';

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

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

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
      recognition.lang = isAr ? 'ar-SA' : 'en-US';
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

      {/* Main Luxury Composer Box */}
      <div className="composer flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-[var(--surface)]/95 border border-[var(--border-strong)] shadow-2xl backdrop-blur-3xl transition-all duration-300 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_30px_var(--accent-glow)]">
        {/* Quick Power Tools Toggle */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
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
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
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

        {/* Text Input Area */}
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
          className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-[var(--text)] placeholder-[var(--muted)] resize-none py-1.5 sm:py-2 px-1 min-h-[26px] max-h-[160px] font-normal leading-relaxed"
        />

        {/* Voice Input Microphone */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
            listening
              ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
          onClick={toggleListening}
          aria-label={isAr ? 'تسجيل صوتي' : 'Voice input'}
          title={listening ? (isAr ? 'إيقاف التسجيل' : 'Stop voice') : (isAr ? 'إملاء صوتي' : 'Voice dictation')}
        >
          {listening ? <MicOff size={16} className="text-rose-400" /> : <Mic size={16} />}
        </button>

        {/* Send / Stop Action Button */}
        <button
          type="button"
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-lg ${
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
    </div>
  );
}
