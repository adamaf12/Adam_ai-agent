import {
  Bell,
  Bot,
  Brain,
  Clock,
  Code2,
  Languages,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatConversation, Language, Message } from '../../core/domain';
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
import {
  loadConversation,
  saveConversation,
  loadAllConversations,
  createNewConversation,
  deleteConversation,
  renameConversation,
  clearAllConversations,
  setActiveConversationId,
  isGenericTitle,
} from '../../core/storage';
import { recordInteractionEpisode, retrieveAssociativeMemories } from '../../core/agent/cognitiveMemory';
import {
  detectUserCorrection,
  registerLearnedRule,
  recordSelfCorrection,
  generateDynamicDirectives,
} from '../../core/agent/onlineLearning';
import {
  consolidateConversationToInfiniteMemory,
  buildInfiniteMemoryDirective,
  getInfiniteMemoryStats,
} from '../../core/agent/infiniteMemory';
import { proactiveEngine, type ProactiveEvent } from '../../core/agent/proactiveEngine';
import { verifyAndCorrectResponse } from '../../core/agent/deterministicVerifier';
import { ChatHistoryDrawer } from './ChatHistoryDrawer';
import { InfiniteMemoryModal } from './InfiniteMemoryModal';

function localConfirmation(language: Language, intent: NonNullable<ReturnType<typeof parseLocalIntent>>, data: unknown) {
  if (intent.type === 'task.create') {
    const title = typeof (data as { title?: unknown })?.title === 'string' ? (data as { title: string }).title : intent.title;
    return language === 'ar' ? `تمت إضافة المهمة: **${title}**` : `Task added: **${title}**`;
  }
  return language === 'ar' ? 'تم حفظ هذه المعلومة في ذاكرة Adam المحلية.' : 'Saved to Adam’s local memory.';
}

function deriveTitleFromMessages(messages: Message[], fallback: string): string {
  const firstUser = messages.find(m => m.role === 'user')?.content?.trim();
  if (!firstUser) return fallback;
  const clean = firstUser.replace(/[\n\r]+/g, ' ').trim();
  return clean.length > 38 ? clean.slice(0, 38) + '…' : clean;
}

export function Chat({
  language,
  agentName,
  copy: heroCopy,
  onNewChat,
}: {
  language: Language;
  agentName: string;
  copy: { title: string; subtitle: string };
  onNewChat?: () => void;
}) {
  const [currentConversation, setCurrentConversation] = useState<ChatConversation>(() => loadConversation());
  const [conversations, setConversations] = useState<ChatConversation[]>(() => loadAllConversations());
  const [messages, setMessages] = useState<Message[]>(() => currentConversation.messages);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveEvent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryStats, setMemoryStats] = useState(() => getInfiniteMemoryStats());

  const controller = useRef<AbortController | null>(null);
  const t = copy(language);

  const quickActions = useMemo(() => language === 'ar' ? [
    { icon: Brain, title: 'مساعد ذكي', text: 'اسأل Adam عن أي شيء', prompt: 'ساعدني في هذا الموضوع: ' },
    { icon: WandSparkles, title: 'كتابة نصوص', text: 'مقال، رسالة أو فكرة', prompt: 'ساعدني في كتابة: ' },
    { icon: Languages, title: 'ترجمة', text: 'ترجمة دقيقة وسريعة', prompt: 'ترجم إلى العربية: ' },
    { icon: Code2, title: 'برمجة', text: 'اكتب أو أصلح الكود', prompt: 'ساعدني في كتابة الكود التالي: ' },
  ] : [
    { icon: Brain, title: 'AI Assistant', text: 'Ask Adam anything', prompt: 'Help me with this: ' },
    { icon: WandSparkles, title: 'Write', text: 'Article, message or idea', prompt: 'Help me write: ' },
    { icon: Languages, title: 'Translate', text: 'Fast accurate translation', prompt: 'Translate to English: ' },
    { icon: Code2, title: 'Coding', text: 'Write or fix code', prompt: 'Help me write this code: ' },
  ], [language]);

  const suggestions = useMemo(() => language === 'ar'
    ? ['اشرح لي الذكاء الاصطناعي ببساطة', 'خطط لي يومي', 'ساعدني في الدراسة']
    : ['Explain AI simply', 'Plan my day', 'Help me study'], [language]);

  // Sync active conversation changes
  useEffect(() => {
    if (!busy) {
      const defaultTitle = language === 'ar' ? 'محادثة جديدة' : 'New conversation';
      const isDefault = !currentConversation.title || currentConversation.title === 'Adam' || currentConversation.title.includes('محادثة') || currentConversation.title.includes('conversation');
      const finalTitle = isDefault && messages.length > 0 ? deriveTitleFromMessages(messages, defaultTitle) : currentConversation.title || defaultTitle;

      const updatedConv: ChatConversation = {
        ...currentConversation,
        title: finalTitle,
        messages,
        updatedAt: Date.now(),
      };
      saveConversation(updatedConv);
      setConversations(loadAllConversations());
    }
  }, [messages, busy, currentConversation.id, language]);

  useEffect(() => {
    proactiveEngine.start();
    const unsub = proactiveEngine.subscribe(setProactiveAlerts);
    return () => {
      unsub();
      proactiveEngine.stop();
    };
  }, []);

  const handleStartNewChat = () => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }
    // 1. Consolidate knowledge from current session into permanent Infinite Memory
    if (messages.length > 0) {
      consolidateConversationToInfiniteMemory({
        ...currentConversation,
        messages,
      });
      setMemoryStats(getInfiniteMemoryStats());
    }

    // 2. Create and switch to brand new conversation, keeping prior conversations safe!
    const newConv = createNewConversation('', language);
    setCurrentConversation(newConv);
    setMessages([]);
    setError(null);
    setResponse(null);
    setBusy(false);
    setConversations(loadAllConversations());

    if (onNewChat) onNewChat();
  };

  const handleSelectConversation = (id: string) => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }

    // Save current session memory before switching
    if (messages.length > 0) {
      consolidateConversationToInfiniteMemory({
        ...currentConversation,
        messages,
      });
      setMemoryStats(getInfiniteMemoryStats());
    }

    setActiveConversationId(id);
    const selected = loadConversation(undefined, id);
    setCurrentConversation(selected);
    setMessages(selected.messages);
    setError(null);
    setResponse(null);
    setBusy(false);
    setConversations(loadAllConversations());
  };

  const handleDeleteConversation = (id: string) => {
    const { remaining, nextActiveId } = deleteConversation(id);
    setConversations(remaining);
    if (currentConversation.id === id) {
      const nextConv = loadConversation(undefined, nextActiveId);
      setCurrentConversation(nextConv);
      setMessages(nextConv.messages);
      setResponse(null);
      setError(null);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConversation(id, newTitle);
    if (currentConversation.id === id) {
      setCurrentConversation((prev) => ({ ...prev, title: newTitle }));
    }
    setConversations(loadAllConversations());
  };

  const handleClearAllHistory = () => {
    clearAllConversations();
    const fresh = loadConversation();
    setCurrentConversation(fresh);
    setMessages([]);
    setConversations([fresh]);
  };

  const handleClearCurrentMessages = () => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }
    setBusy(false);
    setMessages([]);
    setError(null);
    setResponse(null);
    const updated: ChatConversation = {
      ...currentConversation,
      messages: [],
      updatedAt: Date.now(),
    };
    saveConversation(updated);
    setConversations(loadAllConversations());
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    const user = createUserMessage(clean);
    const assistant = createAssistantMessage();
    const next = [...messages, user];

    // Immediate auto-save upon sending user message
    const defaultTitle = language === 'ar' ? 'محادثة جديدة' : 'New conversation';
    const autoTitle = isGenericTitle(currentConversation.title)
      ? deriveTitleFromMessages(next, defaultTitle)
      : currentConversation.title || defaultTitle;

    const initialConv: ChatConversation = {
      ...currentConversation,
      title: autoTitle,
      messages: next,
      updatedAt: Date.now(),
    };
    saveConversation(initialConv);
    setCurrentConversation(initialConv);
    setConversations(loadAllConversations());

    const route = routePrompt(clean);
    const capability = toCapabilityRequest(route);
    const localIntent = parseLocalIntent(clean);
    const client = requiresDedicatedCapability(capability.capability) ? httpAgentClient : httpChatClient;

    // 1. Online Learning: detect and register immediate user corrections
    const userCorrection = detectUserCorrection(clean);
    if (userCorrection) {
      registerLearnedRule(userCorrection);
    }

    // 2. Cognitive Memory & Directives: recall associative insights
    const { contextString: memoryHint } = retrieveAssociativeMemories(clean, { maxItems: 3, maxChars: 500 });
    const { directivesString: learnedHint } = generateDynamicDirectives(clean, { maxRules: 3, maxChars: 500 });

    // 3. Infinite Cross-Session Memory Directive
    const infiniteHint = buildInfiniteMemoryDirective(clean, language, 5);

    const messagesToSend = [...next];
    const cognitiveDirectives = [infiniteHint, memoryHint, learnedHint].filter(Boolean).join('\n\n');
    if (cognitiveDirectives) {
      messagesToSend.splice(messagesToSend.length - 1, 0, {
        id: 'cognitive-directives',
        role: 'system' as unknown as 'assistant',
        content: cognitiveDirectives,
        createdAt: Date.now(),
      });
    }

    setResponse(createResponseState(route.intent));
    setLastPrompt(clean);
    setError(null);
    setBusy(true);
    setMessages(current => [...current, user, assistant]);

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
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: confirmation } : m));
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: confirmation }) : current);
        setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);
        recordInteractionEpisode(clean, confirmation);

        const localSavedConv: ChatConversation = {
          ...initialConv,
          messages: [...next, { ...assistant, content: confirmation }],
          updatedAt: Date.now(),
        };
        saveConversation(localSavedConv);
        setCurrentConversation(localSavedConv);
        setConversations(loadAllConversations());

        consolidateConversationToInfiniteMemory({
          ...currentConversation,
          messages: [...next, { ...assistant, content: confirmation }],
        });
        setMemoryStats(getInfiniteMemoryStats());
        return;
      }

      let streamedOutput = '';
      await client.send({ messages: messagesToSend, language, agentName, maxModels: route.intent === 'chat' ? 1 : 3 }, abort.signal, partial => {
        streamedOutput = partial;
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: partial.slice(current.content.length) }) : current);
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: partial } : m));
      });
      setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);

      // 4. Deterministic Self-Verification Gate
      const verification = verifyAndCorrectResponse(streamedOutput);
      const finalized = verification.verifiedText;
      if (verification.isModified) {
        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: finalized } : m));
        for (const corr of verification.corrections) {
          recordSelfCorrection(corr.original, corr.corrected, corr.reason);
        }
      }

      // 5. Continuous Long-Term & Infinite Memory consolidation
      recordInteractionEpisode(clean, finalized);

      const finalSavedConv: ChatConversation = {
        ...initialConv,
        messages: [...next, { ...assistant, content: finalized }],
        updatedAt: Date.now(),
      };
      saveConversation(finalSavedConv);
      setCurrentConversation(finalSavedConv);
      setConversations(loadAllConversations());

      consolidateConversationToInfiniteMemory({
        ...currentConversation,
        messages: [...next, { ...assistant, content: finalized }],
      });
      setMemoryStats(getInfiniteMemoryStats());
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'AI request failed';
      setResponse(current => current ? reduceResponseEvent(current, { type: 'error', code: 'AI_ERROR', message }) : current);
      if (streamedOutput && streamedOutput.trim().length > 0) {
        // Keep partial answer and finalize conversation state
        setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);
        const finalSavedConv: ChatConversation = {
          ...initialConv,
          messages: [...next, { ...assistant, content: streamedOutput }],
          updatedAt: Date.now(),
        };
        saveConversation(finalSavedConv);
        setCurrentConversation(finalSavedConv);
        setConversations(loadAllConversations());
      } else {
        setMessages(current => current.filter(m => m.id !== assistant.id));
        setError(message);
      }
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };

  const stop = () => controller.current?.abort();

  return (
    <section className="chat-page">
      <div className="chat-header glass-panel">
        <div className="chat-identity">
          <div className="adam-orb"><Sparkles size={17} /></div>
          <div>
            <span className="eyebrow">ADAM AI</span>
            <h1>
              {messages.length
                ? currentConversation.title || (language === 'ar' ? 'المحادثة' : 'Conversation')
                : heroCopy.title}
            </h1>
            <p>
              {messages.length
                ? (language === 'ar' ? 'اسأل بشكل طبيعي. Adam يتولى الباقي مع ذاكرة مستمرة.' : 'Ask naturally. Adam handles the rest with continuous memory.')
                : heroCopy.subtitle}
            </p>
          </div>
        </div>

        <div className="chat-header-actions">
          <span className="agent-mode">
            <i /> {response?.route === 'web' ? (language === 'ar' ? 'معلومات حديثة' : 'Current info') : (language === 'ar' ? 'جاهز' : 'Ready')}
          </span>

          {/* Chat History Drawer Trigger */}
          <button
            className="header-action-btn"
            onClick={() => setIsHistoryOpen(true)}
            title={language === 'ar' ? 'سجل المحادثات السابقة' : 'Past Conversations'}
            aria-label={language === 'ar' ? 'السجل' : 'History'}
          >
            <Clock size={14} />
            <span>{language === 'ar' ? `السجل (${conversations.length})` : `History (${conversations.length})`}</span>
          </button>

          {/* Infinite Memory Trigger */}
          <button
            className="header-action-btn header-action-btn--memory"
            onClick={() => {
              setMemoryStats(getInfiniteMemoryStats());
              setIsMemoryModalOpen(true);
            }}
            title={language === 'ar' ? 'ذاكرة Adam اللانهائية المستمرة' : "Adam's Infinite Memory"}
            aria-label="Infinite Memory"
          >
            <Brain size={14} />
            <span>{language === 'ar' ? `الذاكرة (${memoryStats.total})` : `Memory (${memoryStats.total})`}</span>
          </button>

          {/* New Chat Button */}
          <button
            className="header-action-btn header-action-btn--primary"
            onClick={handleStartNewChat}
            title={t.newChat}
            aria-label={t.newChat}
          >
            <Plus size={14} />
            <span>{t.newChat}</span>
          </button>

          {/* Clear Current Chat */}
          <button
            className="icon-button"
            onClick={handleClearCurrentMessages}
            title={language === 'ar' ? 'مسح رسائل هذه المحادثة' : 'Clear current conversation messages'}
            aria-label={language === 'ar' ? 'مسح' : 'Clear'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="chat-scroll">
        {proactiveAlerts.length > 0 && (
          <div className="proactive-banner" role="status" aria-live="polite">
            <div className="proactive-banner-content">
              <Bell size={16} />
              <span>
                <strong>{proactiveAlerts[0].title}</strong>: {proactiveAlerts[0].description}
              </span>
            </div>
            <button
              className="proactive-banner-dismiss"
              onClick={() => proactiveEngine.dismissEvent(proactiveAlerts[0].id)}
              aria-label={language === 'ar' ? 'إغلاق التنبيه' : 'Dismiss notification'}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <>
            <div className="welcome">
              <div className="welcome-orb"><Bot size={27} /></div>
              <h2>{language === 'ar' ? `أهلاً، أنا ${agentName}` : `Hi, I'm ${agentName}`}</h2>
              <p>{language === 'ar' ? 'اسألني مباشرة أو اختر اختصارًا للبدء بسرعة.' : 'Ask directly or choose a shortcut to get started.'}</p>
            </div>

            <div className="quick-actions" aria-label={language === 'ar' ? 'اختصارات سريعة' : 'Quick actions'}>
              {quickActions.map(({ icon: Icon, title, text, prompt }) => (
                <button className="quick-action" key={title} onClick={() => send(prompt)}>
                  <span className="quick-action-icon"><Icon size={18} /></span>
                  <span><strong>{title}</strong><small>{text}</small></span>
                </button>
              ))}
            </div>

            <div className="suggestions">
              {suggestions.map(s => <button key={s} onClick={() => send(s)}>{s}</button>)}
            </div>
          </>
        ) : (
          messages.map(message => <MessageBubble key={message.id} message={message} language={language} />)
        )}

        {busy && (
          <StreamingIndicator
            label={
              /(?:صورة|صوره|صور|ارسم|ارسم لي|رسمة|رسمه|أنشئ صورة|انشئ صورة|صمم صورة|توليد صورة|أريد صورة|اريد صورة|صورة فقط|خلفية|image|photo|picture|wallpaper|draw|illustration)\b/i.test(lastPrompt) &&
              !/(?:برمج|كود|تطبيق|html|javascript|code|calculator)/i.test(lastPrompt)
                ? (language === 'ar' ? 'Adam يولد الصورة ويضبط الإضاءة السينمائية…' : 'Adam is synthesizing and rendering the image…')
                : (language === 'ar' ? 'Adam يعمل على إجابتك…' : 'Adam is working on it…')
            }
            isImage={
              /(?:صورة|صوره|صور|ارسم|ارسم لي|رسمة|رسمه|أنشئ صورة|انشئ صورة|صمم صورة|توليد صورة|أريد صورة|اريد صورة|صورة فقط|خلفية|image|photo|picture|wallpaper|draw|illustration)\b/i.test(lastPrompt) &&
              !/(?:برمج|كود|تطبيق|html|javascript|code|calculator)/i.test(lastPrompt)
            }
            language={language}
            prompt={lastPrompt}
          />
        )}
        {error && (
          <div className="error-banner">
            <strong>{language === 'ar' ? 'لم تصل إجابة' : 'No answer yet'}</strong>
            <span>{language === 'ar' ? 'حدث انقطاع في المحرك. سيُعاد توجيه الطلب عند المحاولة التالية.' : 'The response path was interrupted. The next attempt can use a fallback engine.'}</span>
            <button onClick={() => lastPrompt && send(lastPrompt)}><RotateCcw size={14} /> {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>
          </div>
        )}
      </div>

      <Composer language={language} busy={busy} onSend={send} onStop={stop} />

      {/* History Drawer Modal */}
      <ChatHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        activeId={currentConversation.id}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleStartNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onClearAll={handleClearAllHistory}
        language={language}
      />

      {/* Infinite Memory Modal */}
      <InfiniteMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => {
          setIsMemoryModalOpen(false);
          setMemoryStats(getInfiniteMemoryStats());
        }}
        language={language}
      />
    </section>
  );
}
