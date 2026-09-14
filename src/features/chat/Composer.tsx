import {
  Code2,
  Gamepad2,
  Image as ImageIcon,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  Square,
  Wrench,
  X,
  Calculator,
  FileSearch,
  Camera,
  ImagePlus,
  UploadCloud,
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

  // Listen for external image trigger events (from Welcome cards, Studio, or header buttons)
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
      setImages((prev) => [...prev, ...processed].slice(0, 8)); // max 8 images per prompt
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

    // If user sent image without prompt, generate an ultra-smart vision instruction
    const defaultPrompt = isAr
      ? 'قم فوراً بفحص كافة مكونات هذه الصورة وإدراك محتواها بدقة، واستنتج المسألة أو الكود أو الخطأ الموجود فيها، وتأكد ذاتياً من صحة الحل وقدّم الإجابة الكاملة والدقيقة 100% فوراً.'
      : 'Immediately scan and perceive all components of this image, infer the problem, code, or error, self-verify the solution, and provide the complete 100% accurate answer directly.';

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
        isDragging ? 'ring-2 ring-emerald-500/80 bg-emerald-950/30 rounded-2xl' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-slate-950/90 border-2 border-dashed border-emerald-400/80 backdrop-blur-sm pointer-events-none animate-fadeIn">
          <div className="flex flex-col items-center gap-2 text-center text-emerald-300 font-medium">
            <UploadCloud size={32} className="text-emerald-400 animate-bounce" />
            <span className="text-sm font-semibold">
              {isAr ? 'أفلت الصورة هنا للفحص وحل المسائل فورياً ⚡' : 'Drop image here for instant vision & solving ⚡'}
            </span>
            <span className="text-xs text-slate-400">
              {isAr ? 'يدعم PNG, JPG, WebP, لقطات الشاشة' : 'Supports PNG, JPG, WebP, Screenshots'}
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

      {/* Instant Vision & Image Accessibility Quick Bar (When no image is attached yet) */}
      {images.length === 0 && (
        <div className="flex items-center gap-1.5 mb-2 px-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 text-[11px] font-semibold transition-all shadow-sm active:scale-95"
            title={isAr ? 'إرفاق صورة لحلها فورياً' : 'Attach image for instant solution'}
          >
            <Camera size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>{isAr ? '📷 حل صورة / مسألة' : '📷 Solve Photo/Image'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              insertPromptChip(isAr ? 'قم بتشخيص الخطأ البرمجي الظاهر في لقطة الشاشة، واشرح سببه وقدّم الكود المصحح كاملاً: ' : 'Debug the code error in this screenshot, explain root cause and give the full fix: ');
              fileInputRef.current?.click();
            }}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-colors"
          >
            <Wrench size={12} className="text-amber-400" />
            <span>{isAr ? '🛠️ فحص لقطة شاشة' : '🛠️ Screen Error'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              insertPromptChip(isAr ? 'استخرج واقرأ جميع النصوص والجداول الموجودة في هذه الصورة بدقة (OCR): ' : 'Extract all text and tables from this image accurately (OCR): ');
              fileInputRef.current?.click();
            }}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition-colors"
          >
            <FileSearch size={12} className="text-cyan-400" />
            <span>{isAr ? '📝 استخراج نصوص (OCR)' : '📝 Extract Text'}</span>
          </button>
        </div>
      )}

      {/* Image Attachments Preview Tray */}
      {images.length > 0 && (
        <div className="mb-2 px-1 flex flex-col gap-2 animate-fadeIn">
          {/* Smart Instant Vision Status Banner */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium shadow-sm">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400 animate-pulse" />
              <span>
                {isAr
                  ? '⚡ الإدراك البصري الفوري نشط: فحص المكونات والتحقق الذاتي من الحل تلقائياً'
                  : '⚡ Instant Vision Active: Auto-detecting components & self-verifying solutions'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setImages([])}
              className="text-slate-400 hover:text-rose-400 transition ml-2"
            >
              {isAr ? 'حذف الكل' : 'Clear all'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md max-w-xs"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                />
                <div className="flex flex-col min-w-0 pr-1 text-[11px]">
                  <span className="truncate max-w-[120px] text-slate-200 font-medium">{img.name}</span>
                  <span className="text-[10px] text-slate-400">{formatFileSize(img.sizeBytes)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="p-1 rounded-full bg-slate-800 text-slate-300 hover:bg-rose-500 hover:text-white transition"
                  title={isAr ? 'إزالة الصورة' : 'Remove'}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Quick Problem Solving Chips for Images */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => insertPromptChip(isAr ? 'افحص الصورة واكتشف المشكلة/الخطأ وقدم الحل المصحح والنهائي فوراً: ' : 'Inspect image, detect problem/error and provide verified fix immediately: ')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors flex items-center gap-1"
            >
              <Sparkles size={12} />
              <span>{isAr ? '⚡ فحص وحل فوري' : '⚡ Instant Solve'}</span>
            </button>
            <button
              type="button"
              onClick={() => insertPromptChip(isAr ? 'قم بتشخيص الخطأ البرمجي الظاهر في لقطة الشاشة، واشرح سببه وقدّم الكود المصحح كاملاً: ' : 'Debug the code error in this screenshot, explain root cause and give the full fix: ')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 transition-colors flex items-center gap-1"
            >
              <Wrench size={12} />
              <span>{isAr ? '🛠️ حل الخطأ البرمجي' : '🛠️ Fix Code Error'}</span>
            </button>
            <button
              type="button"
              onClick={() => insertPromptChip(isAr ? 'حل المسألة الرياضية/العلمية الموجودة في الصورة بالتفصيل مع توضيح خطوات القوانين والحل النهائي: ' : 'Solve the math/science problem in this image step by step with formulas: ')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60 transition-colors flex items-center gap-1"
            >
              <Calculator size={12} />
              <span>{isAr ? '📐 حل المسألة الرياضية' : '📐 Solve Math Problem'}</span>
            </button>
            <button
              type="button"
              onClick={() => insertPromptChip(isAr ? 'استخرج واقرأ جميع النصوص والجداول الموجودة في هذه الصورة بدقة (OCR): ' : 'Extract all text and tables from this image accurately (OCR): ')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 transition-colors flex items-center gap-1"
            >
              <FileSearch size={12} />
              <span>{isAr ? '📝 استخراج النصوص (OCR)' : '📝 Extract Text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Astra Developer & Creator Tool Chips */}
      {showQuickModes && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1 animate-fadeIn">
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'أريد كود كامل بنسبة 100% بدون أي نقصان لـ: ' : 'Write 100% complete production code for: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Code2 size={12} />
            <span>{isAr ? '💻 كود كامل 100%' : '💻 Full Code'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'اصنع لي لعبة Canvas كاملة مع تحكم وأصوات لـ: ' : 'Build a playable HTML5 Canvas game with sound for: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Gamepad2 size={12} />
            <span>{isAr ? '🎮 لعبة تفاعلية' : '🎮 Canvas Game'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'لدي خطأ برمجي/استثناء، قم بتحليله وإصلاحه جذرياً: ' : 'Fix this bug and analyze the root cause: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-amber-400 border border-amber-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Wrench size={12} />
            <span>{isAr ? '🛠️ تصحيح أخطاء' : '🛠️ Debug Error'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(isAr ? 'أنشئ لي صورة سينمائية 8K واقعية لـ: ' : 'Generate an 8K photorealistic image of: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-purple-400 border border-purple-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>{isAr ? '🎨 صورة 8K' : '🎨 8K Visual'}</span>
          </button>
        </div>
      )}

      <div className="composer">
        <button
          type="button"
          className="composer-icon"
          onClick={() => setShowQuickModes((prev) => !prev)}
          aria-label="Toggle prompt tools"
          title={isAr ? 'أدوات ومساعدات Astra البرمجية' : 'Astra Dev Tools'}
        >
          <Sparkles size={17} className={showQuickModes ? 'text-emerald-400' : ''} />
        </button>

        {/* Attach Image & Files Button - Prominently Styled */}
        <button
          type="button"
          className={`composer-icon relative transition-all ${
            images.length > 0
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'hover:text-emerald-400 hover:bg-emerald-500/10'
          }`}
          onClick={() => fileInputRef.current?.click()}
          aria-label={isAr ? 'إرفاق صورة أو مستند' : 'Attach Image'}
          title={isAr ? 'إرفاق صورة لحل المسائل والأخطاء وفحص النصوص فورياً' : 'Attach image to solve problems, code errors, or analyze'}
          disabled={processingImages}
        >
          {processingImages ? (
            <Loader2 size={17} className="animate-spin text-emerald-400" />
          ) : (
            <Camera size={17} className={images.length > 0 ? 'text-emerald-400' : 'text-emerald-400/90'} />
          )}
        </button>

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
                ? 'جاري الاستماع إليك...'
                : 'Listening...'
              : images.length > 0
              ? isAr
                ? 'اكتب طلبك أو المسألة لحلها من الصورة المرفقة...'
                : 'Ask a question or request a solution for the attached image...'
              : (isAr ? 'اكتب رسالتك، الصق كود أو ارفع صورة لحلها...' : 'Type a prompt, paste code, or drop an image...')
          }
          rows={1}
          disabled={busy}
        />

        <button
          type="button"
          className={listening ? 'composer-icon composer-icon--recording' : 'composer-icon'}
          onClick={toggleListening}
          aria-label={isAr ? 'تسجيل صوتي' : 'Voice input'}
          title={listening ? (isAr ? 'إيقاف التسجيل' : 'Stop voice') : (isAr ? 'تحدث مع Adam' : 'Speak to Adam')}
        >
          {listening ? <MicOff size={17} color="#ef4444" /> : <Mic size={17} />}
        </button>

        <button
          type="button"
          className={busy ? 'send-button send-button--stop' : 'send-button'}
          onClick={busy ? onStop : submit}
          aria-label={busy ? t.stop : t.send}
          disabled={!busy && !draft.trim() && images.length === 0}
        >
          {busy ? <Square size={14} fill="currentColor" /> : <Send size={15} />}
        </button>
      </div>

      <div className="composer-footer-credits flex items-center justify-between mt-1 px-2 text-[11px]">
        <span className="composer-creator-credit text-emerald-400/95 font-medium tracking-normal select-none">
          {isAr ? 'تم تطويره من قبل : أدم فيدات' : 'Developed by : Adem Feidat'}
        </span>
        <span className="font-mono text-[10px] text-slate-400/75 select-none">Astra 4.5 Ultra • Vision Enabled</span>
      </div>
    </div>
  );
}
