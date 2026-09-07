import { Mic, MicOff, Paperclip, Send, Square } from 'lucide-react';
import { useRef, useState } from 'react';
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
  const recognitionRef = useRef<any>(null);
  const t = copy(language);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    onSend(text);
    setDraft('');
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
      alert(
        language === 'ar'
          ? 'المتصفح لا يدعم ميزة الإملاء الصوتي المباشر.'
          : 'Speech recognition is not supported in this browser.'
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
  };

  return (
    <div className="composer-wrap">
      <div className="composer">
        <button
          className="composer-icon"
          onClick={handleAttach}
          aria-label={language === 'ar' ? 'إرفاق' : 'Attach'}
          title={language === 'ar' ? 'إرفاق ملف أو نص' : 'Attach file'}
        >
          <Paperclip size={18} />
        </button>

        <textarea
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
          className={listening ? 'composer-icon composer-icon--recording' : 'composer-icon'}
          onClick={toggleListening}
          aria-label={language === 'ar' ? 'تسجيل صوتي' : 'Voice input'}
          title={listening ? (language === 'ar' ? 'إيقاف التسجيل' : 'Stop voice') : (language === 'ar' ? 'تحدث مع Adam' : 'Speak to Adam')}
        >
          {listening ? <MicOff size={18} color="#ef4444" /> : <Mic size={18} />}
        </button>

        <button
          className={busy ? 'send-button send-button--stop' : 'send-button'}
          onClick={busy ? onStop : submit}
          aria-label={busy ? t.stop : t.send}
          disabled={!busy && !draft.trim()}
        >
          {busy ? <Square size={15} fill="currentColor" /> : <Send size={16} />}
        </button>
      </div>

      <span className="composer-hint">
        {language === 'ar' ? 'Enter للإرسال · Shift + Enter لسطر جديد' : 'Enter to send · Shift + Enter for a new line'}
      </span>
    </div>
  );
}
