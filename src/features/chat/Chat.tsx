import { Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { Language, Message } from '../../core/domain';
import { httpChatClient } from '../../core/ai/client';
import { createAssistantMessage, createUserMessage } from './chatModel';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { StreamingIndicator } from './StreamingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { copy } from '../../core/i18n';

export function Chat({ language, agentName, copy: heroCopy }: { language: Language; agentName: string; copy: { title: string; subtitle: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const t = copy(language);
  const suggestions = useMemo(() => language === 'ar' ? ['خطط ليومي', 'لخّص هذا النص', 'ساعدني في البرمجة'] : ['Plan my day', 'Summarize this text', 'Help me code'], [language]);
  const send = async (text: string) => {
    setError(null); setBusy(true);
    const user = createUserMessage(text); const assistant = createAssistantMessage();
    setMessages((current) => [...current, user, assistant]);
    const next = [...messages, user];
    const abort = new AbortController(); controller.current = abort;
    try {
      await httpChatClient.send({ messages: next, language, agentName }, abort.signal, (partial) => setMessages((current) => current.map((m) => m.id === assistant.id ? { ...m, content: partial } : m)));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'AI request failed';
      setMessages((current) => current.filter((m) => m.id !== assistant.id)); setError(message);
    } finally { setBusy(false); controller.current = null; }
  };
  const stop = () => controller.current?.abort();
  const clear = () => { if (!busy) { setMessages([]); setError(null); } };
  return <section className="chat-page"><div className="chat-header"><div><span className="eyebrow"><Sparkles size={13} /> ADAM AI</span><h1>{messages.length ? (language === 'ar' ? 'المحادثة' : 'Conversation') : heroCopy.title}</h1><p>{messages.length ? (language === 'ar' ? 'سأتابع السياق معك خطوة بخطوة.' : 'I’ll keep the context with you, step by step.') : heroCopy.subtitle}</p></div><button className="icon-button" onClick={clear} disabled={busy} aria-label="Clear conversation"><Trash2 size={18} /></button></div>
    <div className="chat-scroll">{messages.length === 0 ? <><EmptyState title={language === 'ar' ? `ما الذي ننجزه اليوم؟` : `What are we building today?`} body={language === 'ar' ? 'ابدأ برسالة قصيرة. Adam سيحدد المسار المناسب تلقائياً.' : 'Start with a simple message. Adam will choose the right path automatically.'} /><div className="suggestions">{suggestions.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div></> : messages.map((message) => <MessageBubble key={message.id} message={message} language={language} />)}{busy && <StreamingIndicator label={t.thinking} />}{error && <div className="error-banner" role="alert"><strong>{language === 'ar' ? 'تعذر إكمال الطلب' : 'The request could not be completed'}</strong><span>{error}</span></div>}</div>
    <Composer language={language} busy={busy} onSend={send} onStop={stop} />
  </section>;
}
