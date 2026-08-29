import { Sparkles, Trash2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language, Message } from '../../core/domain';
import { httpAgentClient, httpChatClient } from '../../core/ai/client';
import { routePrompt } from '../../core/agent/agentTypes';
import { createAssistantMessage, createUserMessage } from './chatModel';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { StreamingIndicator } from './StreamingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { copy } from '../../core/i18n';
import { clearConversation, loadConversation, saveConversation } from '../../core/storage';

const EMPTY_CONVERSATION = { id: 'default', title: 'Adam', messages: [] as Message[], updatedAt: Date.now() };

export function Chat({ language, agentName, copy: heroCopy }: { language: Language; agentName: string; copy: { title: string; subtitle: string } }) {
  const [messages, setMessages] = useState<Message[]>(() => loadConversation(EMPTY_CONVERSATION).messages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<'chat' | 'web'>('chat');
  const controller = useRef<AbortController | null>(null);
  const t = copy(language);
  const suggestions = useMemo(() => language === 'ar' ? ['خطط ليومي', 'ما آخر أخبار التقنية اليوم؟', 'ساعدني في البرمجة'] : ['Plan my day', 'What are the latest tech news today?', 'Help me code'], [language]);

  useEffect(() => { if (!busy) saveConversation({ ...EMPTY_CONVERSATION, messages, updatedAt: Date.now() }); }, [messages, busy]);

  const send = async (text: string) => {
    const user = createUserMessage(text);
    const assistant = createAssistantMessage();
    const next = [...messages, user];
    const route = routePrompt(text);
    const client = route.intent === 'web' ? httpAgentClient : httpChatClient;
    setActiveRoute(route.intent === 'web' ? 'web' : 'chat');
    setError(null);
    setBusy(true);
    setMessages((current) => [...current, user, assistant]);
    const abort = new AbortController();
    controller.current = abort;
    try {
      await client.send({ messages: next, language, agentName }, abort.signal, (partial) => {
        setMessages((current) => current.map((m) => m.id === assistant.id ? { ...m, content: partial } : m));
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'AI request failed';
      setMessages((current) => current.filter((m) => m.id !== assistant.id));
      setError(message);
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };

  const stop = () => controller.current?.abort();
  const clear = () => { if (!busy) { setMessages([]); setError(null); clearConversation(); } };

  return <section className="chat-page">
    <div className="chat-header">
      <div><span className="eyebrow"><Sparkles size={13} /> ADAM AI</span><h1>{messages.length ? (language === 'ar' ? 'المحادثة' : 'Conversation') : heroCopy.title}</h1><p>{messages.length ? (language === 'ar' ? 'Adam يختار مسار الأدوات المناسب تلقائيًا.' : 'Adam automatically chooses the right execution path.') : heroCopy.subtitle}</p></div>
      <div className="chat-header-actions"><span className="agent-mode" title={activeRoute === 'web' ? 'Grounded web search' : 'Standard reasoning'}><ShieldCheck size={14}/>{activeRoute === 'web' ? (language === 'ar' ? 'بحث موثّق' : 'Grounded') : (language === 'ar' ? 'ذكي' : 'Smart')}</span><button className="icon-button" onClick={clear} disabled={busy} aria-label="Clear conversation"><Trash2 size={18} /></button></div>
    </div>
    <div className="chat-scroll">{messages.length === 0 ? <><EmptyState title={language === 'ar' ? 'ما الذي ننجزه اليوم؟' : 'What are we building today?'} body={language === 'ar' ? 'ابدأ برسالة. Adam سيحدد تلقائيًا إن كانت تحتاج بحثًا أو إجابة مباشرة.' : 'Start with a message. Adam will automatically decide whether it needs grounded search or direct reasoning.'} /><div className="suggestions">{suggestions.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div></> : messages.map((message) => <MessageBubble key={message.id} message={message} language={language} />)}{busy && <StreamingIndicator label={activeRoute === 'web' ? (language === 'ar' ? 'أبحث وأتحقق…' : 'Searching and verifying…') : t.thinking} />}{error && <div className="error-banner" role="alert"><strong>{language === 'ar' ? 'تعذر إكمال الطلب' : 'The request could not be completed'}</strong><span>{error}</span></div>}</div>
    <Composer language={language} busy={busy} onSend={send} onStop={stop} />
  </section>;
}
