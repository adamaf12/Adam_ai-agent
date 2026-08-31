import { ArrowUp, Bot, RotateCcw, Sparkles, Square, Trash2 } from 'lucide-react';
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
import { copy } from '../../core/i18n';
import { clearConversation, loadConversation, saveConversation } from '../../core/storage';

const EMPTY_CONVERSATION = { id: 'default', title: 'Adam', messages: [] as Message[], updatedAt: Date.now() };
function localConfirmation(language: Language, intent: NonNullable<ReturnType<typeof parseLocalIntent>>, data: unknown) {
  if (intent.type === 'task.create') { const title = typeof (data as { title?: unknown })?.title === 'string' ? (data as { title: string }).title : intent.title; return language === 'ar' ? `تمت إضافة المهمة: **${title}**` : `Task added: **${title}**`; }
  return language === 'ar' ? 'تم حفظ هذه المعلومة في ذاكرة Adam المحلية.' : 'Saved to Adam’s local memory.';
}

export function Chat({ language, agentName, copy: heroCopy }: { language: Language; agentName: string; copy: { title: string; subtitle: string } }) {
  const [messages, setMessages] = useState<Message[]>(() => loadConversation(EMPTY_CONVERSATION).messages);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const controller = useRef<AbortController | null>(null);
  const t = copy(language);
  const suggestions = useMemo(() => language === 'ar' ? ['اشرح لي الذكاء الاصطناعي ببساطة', 'ساعدني في كتابة كود', 'خطط لي يومي'] : ['Explain AI simply', 'Help me write code', 'Plan my day'], [language]);
  useEffect(() => { if (!busy) saveConversation({ ...EMPTY_CONVERSATION, messages, updatedAt: Date.now() }); }, [messages, busy]);

  const send = async (text: string) => {
    const clean = text.trim(); if (!clean || busy) return;
    const user = createUserMessage(clean); const assistant = createAssistantMessage(); const next = [...messages, user];
    const route = routePrompt(clean); const capability = toCapabilityRequest(route); const localIntent = parseLocalIntent(clean);
    const client = requiresDedicatedCapability(capability.capability) ? httpAgentClient : httpChatClient;
    setResponse(createResponseState(route.intent)); setLastPrompt(clean); setError(null); setBusy(true); setMessages(current => [...current, user, assistant]);
    const abort = new AbortController(); controller.current = abort;
    try {
      if (localIntent) {
        const input = localIntent.type === 'task.create' ? { title: localIntent.title } : { content: localIntent.content, category: localIntent.category };
        const result = await executeAgentTool({ name: localIntent.type, input }, abort.signal); if (!result.ok) throw new Error(result.error ?? 'The local action could not be completed.');
        const confirmation = localConfirmation(language, localIntent, result.data);
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: confirmation } : m)); setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: confirmation }) : current); setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current); return;
      }
      await client.send({ messages: next, language, agentName, maxModels: route.intent === 'chat' ? 1 : 3 }, abort.signal, partial => {
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: partial.slice(current.content.length) }) : current);
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: partial } : m));
      });
      setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'AI request failed';
      setResponse(current => current ? reduceResponseEvent(current, { type: 'error', code: 'AI_ERROR', message }) : current);
      setMessages(current => current.filter(m => m.id !== assistant.id)); setError(message);
    } finally { setBusy(false); controller.current = null; }
  };
  const stop = () => controller.current?.abort();
  const clear = () => { if (!busy) { setMessages([]); setError(null); setResponse(null); clearConversation(); } };

  return <section className="chat-page">
    <div className="chat-header glass-panel">
      <div className="chat-identity"><div className="adam-orb"><Sparkles size={17}/></div><div><span className="eyebrow">ADAM AI</span><h1>{messages.length ? (language === 'ar' ? 'المحادثة' : 'Conversation') : heroCopy.title}</h1><p>{messages.length ? (language === 'ar' ? 'اسأل بشكل طبيعي. Adam يتولى الباقي.' : 'Ask naturally. Adam handles the rest.') : heroCopy.subtitle}</p></div></div>
      <div className="chat-header-actions"><span className="agent-mode"><i/> {response?.route === 'web' ? (language === 'ar' ? 'معلومات حديثة' : 'Current info') : (language === 'ar' ? 'جاهز' : 'Ready')}</span><button className="icon-button" onClick={clear} disabled={busy} aria-label={language === 'ar' ? 'مسح' : 'Clear'}><Trash2 size={17}/></button></div>
    </div>
    <div className="chat-scroll">{messages.length === 0 ? <><div className="welcome"><div className="welcome-orb"><Bot size={27}/></div><h2>{language === 'ar' ? `أهلاً، أنا ${agentName}` : `Hi, I'm ${agentName}`}</h2><p>{language === 'ar' ? 'اكتب سؤالك مباشرة — لا تحتاج لاختيار نموذج.' : 'Ask directly — you do not need to choose a model.'}</p></div><div className="suggestions">{suggestions.map(s => <button key={s} onClick={() => send(s)}>{s}</button>)}</div></> : messages.map(message => <MessageBubble key={message.id} message={message} language={language}/>)}{busy && <StreamingIndicator label={language === 'ar' ? 'Adam يعمل على إجابتك…' : 'Adam is working on it…'}/>} {error && <div className="error-banner"><strong>{language === 'ar' ? 'لم تصل إجابة' : 'No answer yet'}</strong><span>{language === 'ar' ? 'حدث انقطاع في المحرك. سيُعاد توجيه الطلب عند المحاولة التالية.' : 'The response path was interrupted. The next attempt can use a fallback engine.'}</span><button onClick={() => lastPrompt && send(lastPrompt)}><RotateCcw size={14}/> {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button></div>}</div>
    <Composer language={language} busy={busy} onSend={send} onStop={stop}/>
  </section>;
}
