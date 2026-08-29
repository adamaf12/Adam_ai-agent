import { Mic, Paperclip, Send, Square } from 'lucide-react';
import { useState } from 'react';
import { copy } from '../../core/i18n';

export function Composer({ language, busy, onSend, onStop }: { language: 'ar' | 'en'; busy: boolean; onSend: (text: string) => void; onStop: () => void }) {
  const [draft, setDraft] = useState('');
  const t = copy(language);
  const submit = () => { const text = draft.trim(); if (!text || busy) return; onSend(text); setDraft(''); };
  return <div className="composer-wrap"><div className="composer"><button className="composer-icon" aria-label="Attach"><Paperclip size={18} /></button><textarea dir={language === 'ar' ? 'rtl' : 'ltr'} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder={t.placeholder} rows={1} disabled={busy} /><button className="composer-icon" aria-label="Voice"><Mic size={18} /></button><button className={busy ? 'send-button send-button--stop' : 'send-button'} onClick={busy ? onStop : submit} aria-label={busy ? t.stop : t.send}>{busy ? <Square size={15} fill="currentColor" /> : <Send size={16} />}</button></div><span className="composer-hint">{language === 'ar' ? 'Enter للإرسال · Shift + Enter لسطر جديد' : 'Enter to send · Shift + Enter for a new line'}</span></div>;
}
