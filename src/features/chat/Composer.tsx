import { Code2, Gamepad2, Mic, MicOff, Paperclip, Send, Sparkles, Square, Wrench } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { copy } from '../../core/i18n';

export function Composer({
  language,
  busy,
  onSend,
  onStop,
}: {
  language: 'ar' | 'en';
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [showQuickModes, setShowQuickModes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const t = copy(language);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollH, 24), 160)}px`;
    }
  }, [draft]);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft('');
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
          ? `${prev} (${language === 'ar' ? 'الإملاء الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported'})`
          : language === 'ar'
          ? 'الإملاء الصوتي غير مدعوم في هذا المتصفح'
          : 'Speech recognition not supported'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
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

  const handleAttach = () => {
    const sample =
      language === 'ar'
        ? 'قم بفحص وتلخيص هذا الملف البرمجي وتحديد نقاط التحسين.'
        : 'Analyze and summarize this code file and highlight improvements.';
    setDraft((prev) => (prev ? `${prev}\n${sample}` : sample));
    textareaRef.current?.focus();
  };

  const insertPromptChip = (prefix: string) => {
    setDraft((prev) => (prev ? `${prefix} ${prev}` : prefix));
    setShowQuickModes(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="composer-wrap">
      {/* Quick Astra Developer & Creator Tool Chips */}
      {showQuickModes && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 px-1 animate-fadeIn">
          <button
            type="button"
            onClick={() => insertPromptChip(language === 'ar' ? 'أريد كود كامل بنسبة 100% بدون أي نقصان لـ: ' : 'Write 100% complete production code for: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-emerald-400 border border-emerald-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Code2 size={12} />
            <span>{language === 'ar' ? '💻 كود كامل 100%' : '💻 Full Code'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(language === 'ar' ? 'اصنع لي لعبة Canvas كاملة مع تحكم وأصوات لـ: ' : 'Build a playable HTML5 Canvas game with sound for: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-cyan-400 border border-cyan-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Gamepad2 size={12} />
            <span>{language === 'ar' ? '🎮 لعبة تفاعلية' : '🎮 Canvas Game'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(language === 'ar' ? 'لدي خطأ برمجي/استثناء، قم بتحليله وإصلاحه جذرياً: ' : 'Fix this bug and analyze the root cause: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-amber-400 border border-amber-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Wrench size={12} />
            <span>{language === 'ar' ? '🛠️ تصحيح أخطاء' : '🛠️ Debug Error'}</span>
          </button>
          <button
            type="button"
            onClick={() => insertPromptChip(language === 'ar' ? 'أنشئ لي صورة سينمائية 8K واقعية لـ: ' : 'Generate an 8K photorealistic image of: ')}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/90 text-purple-400 border border-purple-500/30 hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>{language === 'ar' ? '🎨 صورة 8K' : '🎨 8K Visual'}</span>
          </button>
        </div>
      )}

      <div className="composer">
        <button
          type="button"
          className="composer-icon"
          onClick={() => setShowQuickModes((prev) => !prev)}
          aria-label="Toggle prompt tools"
          title={language === 'ar' ? 'أدوات ومساعدات Astra البرمجية' : 'Astra Dev Tools'}
        >
          <Sparkles size={17} className={showQuickModes ? 'text-emerald-400' : ''} />
        </button>

        <button
          type="button"
          className="composer-icon"
          onClick={handleAttach}
          aria-label={language === 'ar' ? 'إرفاق' : 'Attach'}
          title={language === 'ar' ? 'إرفاق ملف أو نص' : 'Attach file'}
        >
          <Paperclip size={17} />
        </button>

        <textarea
          ref={textareaRef}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={listening ? (language === 'ar' ? 'جاري الاستماع إليك...' : 'Listening...') : t.placeholder}
          rows={1}
          disabled={busy}
        />

        <button
          type="button"
          className={listening ? 'composer-icon composer-icon--recording' : 'composer-icon'}
          onClick={toggleListening}
          aria-label={language === 'ar' ? 'تسجيل صوتي' : 'Voice input'}
          title={listening ? (language === 'ar' ? 'إيقاف التسجيل' : 'Stop voice') : (language === 'ar' ? 'تحدث مع Adam' : 'Speak to Adam')}
        >
          {listening ? <MicOff size={17} color="#ef4444" /> : <Mic size={17} />}
        </button>

        <button
          type="button"
          className={busy ? 'send-button send-button--stop' : 'send-button'}
          onClick={busy ? onStop : submit}
          aria-label={busy ? t.stop : t.send}
          disabled={!busy && !draft.trim()}
        >
          {busy ? <Square size={14} fill="currentColor" /> : <Send size={15} />}
        </button>
      </div>

      <div className="composer-footer-credits flex items-center justify-between mt-1 px-2 text-[11px]">
        <span className="composer-creator-credit text-emerald-400/95 font-medium tracking-normal select-none">
          {language === 'ar' ? 'تم تطويره من قبل : أدم فيدات' : 'Developed by : Adem Feidat'}
        </span>
        <span className="font-mono text-[10px] text-slate-400/75 select-none">Astra 4.5 Ultra</span>
      </div>
    </div>
  );
}
