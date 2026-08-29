import { Sparkles, Trash2, ShieldCheck, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Language, Message } from '../../core/domain';
import { httpAgentClient, httpChatClient } from '../../core/ai/client';
import { routePrompt } from '../../core/agent/agentTypes';
import { toCapabilityRequest, requiresDedicatedCapability } from '../../core/agent/capabilities';
import { parseLocalIntent } from '../../core/agent/localIntent';
import { executeAgentTool } from '../../core/agent/toolExecutor';
import { createResponseState, reduceResponseEvent, type ResponseState } from '../../core/agent/responseModel';
import { createAssistantMessage, createUserMessage } from './chatModel';
import { MessageBubble } from './MessageBubble';
import { Composer } from './Composer';
import { StreamingIndicator } from './StreamingIndicator';
import { EmptyState } from '../../components/EmptyState';
import { copy } from '../../core/i18n';
import { clearConversation, loadConversation, saveConversation } from '../../core/storage';

const EMPTY_CONVERSATION = { id: 'default', title: 'Adam', messages: [] as Message[], updatedAt: Date.now() };

function localConfirmation(language: Language, intent: NonNullable<ReturnType<typeof parseLocalIntent>>, data: unknown) {
  if (intent.type === 'task.create') {
    const title = typeof (data as { title?: unknown })?.title === 'string' ? (data as { title: string }).title : intent.title;
    return language === 'ar' ? `تمت إضافة المهمة: **${title}**` : `Task added: **${title}**`;
  }
  return language === 'ar' ? 'تم حفظ هذه المعلومة في ذاكرة Adam المحلية.' : 'I saved that in Adam’s local memory.';
}

export function Chat({ language, agentName, copy: heroCopy }: { language: Language; agentName: string; copy: { title: string; subtitle: string } }) {
  const [messages, setMessages] = useState<Message[]>(() => loadConversation(EMPTY_CONVERSATION).messages);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const controller = useRef<AbortController | null>(null);
  const t = copy(language);
  const suggestions = useMemo(() => language === 'ar' ? ['خطط ليومي', 'ما آخر أخبار التقنية اليوم؟', 'ساعدني في البرمجة'] : ['Plan my day', 'What are the latest tech news today?', 'Help me code'], [language]);

  useEffect(() => { if (!busy) saveConversation({ ...EMPTY_CONVERSATION, messages, updatedAt: Date.now() }); }, [messages, busy]);

  const send = async (text: string) => {
    const user = createUserMessage(text);
    const assistant = createAssistantMessage();
    const next = [...messages, user];
    const route = routePrompt(text);
    const capability = toCapabilityRequest(route);
    const localIntent = parseLocalIntent(text);
    const client = requiresDedicatedCapability(capability.capability) ? httpAgentClient : httpChatClient;
    setResponse(createResponseState(route.intent));
    setLastPrompt(text);
    setError(null);
    setBusy(true);
    setMessages((current) => [...current, user, assistant]);
    const abort = new AbortController();
    controller.current = abort;
    try {
      if (localIntent) {
        const input = localIntent.type === 'task.create'
          ? { title: localIntent.title }
          : { content: localIntent.content, category: localIntent.category };
        const result = await executeAgentTool({ name: localIntent.type, input }, abort.signal);
        if (!result.ok) throw new Error(result.error ?? 'The local action could not be completed.');
        const confirmation = localConfirmation(language, localIntent, result.data);
        setMessages((current) => current.map((m) => m.id === assistant.id ? { ...m, content: confirmation } : m));
        setResponse((current) => current ? reduceResponseEvent(current, { type: 'delta', text: confirmation }) : current);
        setResponse((current) => current ? reduceResponseEvent(current, { type: 'done' }) : current);
        return;
      }

      await client.send({ messages: next, language, agentName }, abort.signal, (partial) => {
        setResponse((current) => current ? reduceResponseEvent(current, { type: 'delta', text: partial.slice(current.content.length) }) : current);
        setMessages((current) => current.map((m) => m.id === assistant.id ? { ...m, content: partial } : m));
      });
      setResponse((current) => current ? reduceResponseEvent(current, { type: 'done' }) : current);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'AI request failed';
      setResponse((current) => current ? reduceResponseEvent(current, { type: 'error', code: 'AI_ERROR', message }) : current);
      setMessages((current) => current.filter((m) => m.id !== assistant.id));
      setError(message);
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };

  const stop = () => controller.current?.abort();
  const clear = () => { if (!busy) { setMessages([]); setError(null); setResponse(null); clearConversation(); } };

  return <section className="chat-page">
    <div className="chat-header">
      <div><span className="eyebrow"><Sparkles size={13} /> ADAM AI</span><h1>{messages.length ? (language === 'ar' ? 'المحادثة' : 'Conversation') : heroCopy.title}</h1><p>{messages.length ? (language === 'ar' ? 'Adam يفهم طلبك ويختار المسار المناسب تلقائيًا.' : 'Adam understands your request and chooses the right path automatically.') : heroCopy.subtitle}</p></div>
      <div className="chat-header-actions"><span className="agent-mode" title={response?.route === 'web' ? 'Grounded web search' : 'Agent reasoning'}><ShieldCheck size={14}/>{response?.route === 'web' ? (language === 'ar' ? 'بحث موثّق' : 'Grounded') : (language === 'ar' ? 'ذكي' : 'Smart')}</span><button className="icon-button" onClick={clear} disabled={busy} aria-label={language === 'ar' ? 'مسح المحادثة' : 'Clear conversation'}><Trash2 size={18} /></button></div>
    </div>
    <div className="chat-scroll">{messages.length === 0 ? <><EmptyState title={language === 'ar' ? 'ما الذي ننجزه اليوم؟' : 'What are we building today?'} body={language === 'ar' ? 'اكتب طلبك طبيعيًا. Adam سيحدد تلقائيًا ما يحتاجه لتنفيذه.' : 'Ask naturally. Adam will decide what it needs to handle the request.'} /><div className="suggestions">{suggestions.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}</div></> : messages.map((message) => <MessageBubble key={message.id} message={message} language={language} />)}{busy && <StreamingIndicator label={response?.route === 'web' ? (language === 'ar' ? 'أبحث وأتحقق من المعلومات…' : 'Searching and verifying…') : (language === 'ar' ? 'أفكر في أفضل إجابة…' : 'Thinking through the best answer…')} />}{error && <div className="error-banner" role="alert"><strong>{language === 'ar' ? 'تعذر إكمال الطلب' : 'The request could not be completed'}</strong><span>{error}</span><button onClick={() => lastPrompt && !busy && send(lastPrompt)}><RotateCcw size={14}/>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}</div>
    <Composer language={language} busy={busy} onSend={send} onStop={stop} />
  </section>;
}
