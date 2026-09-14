import {
  Bell,
  Bot,
  Camera,
  CheckCircle2,
  Clock,
  Code,
  Download,
  FileSearch,
  Languages,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { ChatConversation, Language, Message, ViewId } from '../../core/domain';
import { httpAgentClient, httpChatClient } from '../../core/ai/client';
import { routePrompt } from '../../core/agent/agentTypes';
import { toCapabilityRequest, requiresDedicatedCapability } from '../../core/agent/capabilities';
import { parseLocalIntent } from '../../core/agent/localIntent';
import { executeAgentTool } from '../../core/agent/toolExecutor';
import { createAppLauncherPayload, openAppTarget } from '../../core/agent/appLauncher';
import { checkAndExecuteDirectAutonomousCommand } from '../../core/agent/ademDuoAutonomousAgent';
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
import { ChatSessionDrawer } from './ChatSessionDrawer';

function localConfirmation(language: Language, intent: NonNullable<ReturnType<typeof parseLocalIntent>>, data: unknown) {
  if (intent.type === 'app.open') {
    const cardPayload = createAppLauncherPayload(intent.target, language);
    const appTitle = language === 'ar' ? intent.target.titleAr : intent.target.titleEn;
    return `${cardPayload}\n\n${
      language === 'ar'
        ? `جاري فتح **${appTitle}** فوراً... 🚀`
        : `Opening **${appTitle}** now... 🚀`
    }`;
  }
  if (intent.type === 'task.create') {
    const title = typeof (data as { title?: unknown })?.title === 'string' ? (data as { title: string }).title : intent.title;
    return language === 'ar' ? `✅ تمت إضافة المهمة: **${title}**` : `✅ Task added: **${title}**`;
  }
  return language === 'ar' ? '✅ تم حفظ المعلومة في الذاكرة بنجاح.' : '✅ Saved to memory successfully.';
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
  onOpenSandbox,
  onSessionMetaChange,
  onNavigateView,
}: {
  language: Language;
  agentName: string;
  copy: { title: string; subtitle: string };
  onNewChat?: () => void;
  onOpenSandbox?: (appId: string) => void;
  onSessionMetaChange?: (meta: { title: string; count: number }) => void;
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
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
  const [isSessionDrawerOpen, setIsSessionDrawerOpen] = useState(false);
  const [memoryStats, setMemoryStats] = useState(() => getInfiniteMemoryStats());

  const controller = useRef<AbortController | null>(null);
  const t = copy(language);

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

  // Broadcast session meta (title & conversation count) to AppShell
  useEffect(() => {
    const title = messages.length
      ? currentConversation.title || (language === 'ar' ? 'المحادثة' : 'Conversation')
      : (language === 'ar' ? 'جلسة جديدة' : 'New Session');
    onSessionMetaChange?.({ title, count: conversations.length });
  }, [currentConversation.title, messages.length, conversations.length, language, onSessionMetaChange]);

  // Support opening session drawer from AppShell via custom event
  useEffect(() => {
    const openDrawer = () => {
      setMemoryStats(getInfiniteMemoryStats());
      setIsSessionDrawerOpen(true);
    };
    window.addEventListener('adam:open-session-drawer', openDrawer);
    return () => window.removeEventListener('adam:open-session-drawer', openDrawer);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smooth scroll down when new messages appear or stream starts
  useEffect(() => {
    if (messages.length > 0 || busy) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, busy]);

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

  const send = async (text: string, images?: string[]) => {
    const clean = text.trim();
    if ((!clean && (!images || images.length === 0)) || busy) return;
    const user = createUserMessage(clean, images);
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
      // Check for direct ADEM Autonomous Agent commands (Run code, terminal command, create file, task)
      const autonomousAction = checkAndExecuteDirectAutonomousCommand(clean, language);
      if (autonomousAction) {
        const isAr = language === 'ar';
        let summary = '';
        if (autonomousAction.actionType === 'code_exec') {
          summary = isAr
            ? `⚡ **تم تنفيذ الكود البرمجي بنجاح**`
            : `⚡ **Code executed successfully**`;
        } else if (autonomousAction.actionType === 'terminal_command') {
          summary = isAr
            ? `🖥️ **تم تنفيذ أمر الطرفية بنجاح**`
            : `🖥️ **Terminal command executed successfully**`;
        } else if (autonomousAction.actionType === 'task_created') {
          summary = isAr
            ? `📋 **تم تسجيل المهمة بنجاح**`
            : `📋 **Task registered successfully**`;
        } else if (autonomousAction.actionType === 'file_created') {
          summary = isAr
            ? `💾 **تم إنشاء الملف بنجاح**`
            : `💾 **File generated successfully**`;
        } else if (autonomousAction.actionType === 'sandbox_app') {
          summary = isAr
            ? `🎮 **تم بناء وتشغيل التطبيق بنجاح**`
            : `🎮 **App built and ready in sandbox**`;
        }

        const payloadString = `:::agent-action\n${JSON.stringify(autonomousAction, null, 2)}\n:::`;
        const fullContent = `${summary}\n\n${payloadString}`;

        setMessages(current => current.map(m => m.id === assistant.id ? { ...m, content: fullContent } : m));
        setResponse(current => current ? reduceResponseEvent(current, { type: 'delta', text: fullContent }) : current);
        setResponse(current => current ? reduceResponseEvent(current, { type: 'done' }) : current);
        recordInteractionEpisode(clean, fullContent);

        const localSavedConv: ChatConversation = {
          ...initialConv,
          messages: [...next, { ...assistant, content: fullContent }],
          updatedAt: Date.now(),
        };
        saveConversation(localSavedConv);
        setCurrentConversation(localSavedConv);
        setConversations(loadAllConversations());

        consolidateConversationToInfiniteMemory({
          ...currentConversation,
          messages: [...next, { ...assistant, content: fullContent }],
        });
        setMemoryStats(getInfiniteMemoryStats());
        return;
      }

      if (localIntent) {
        let confirmation = '';
        if (localIntent.type === 'app.open') {
          confirmation = localConfirmation(language, localIntent, null);
          // Trigger instant / automatic app launch
          openAppTarget(localIntent.target, {
            onNavigateView,
            onOpenSandbox,
            onOpenExternal: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
          });
        } else {
          const input = localIntent.type === 'task.create'
            ? { title: localIntent.title }
            : { content: localIntent.content, category: localIntent.category };
          const result = await executeAgentTool({ name: localIntent.type, input }, abort.signal);
          if (!result.ok) throw new Error(result.error ?? 'The local action could not be completed.');
          confirmation = localConfirmation(language, localIntent, result.data);
        }

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
      setMessages(current => current.filter(m => m.id !== assistant.id));
      setError(message);
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };

  const stop = () => controller.current?.abort();

  const triggerVisionUpload = (promptPrefix?: string) => {
    window.dispatchEvent(
      new CustomEvent('adam_trigger_image_upload', {
        detail: { promptPrefix: promptPrefix || '' },
      })
    );
  };

  return (
    <section className={busy ? "chat-page chat-page--busy" : "chat-page"}>
      {/* Sleek Minimalist Session Bar (Desktop only, as mobile has unified this into the single ultra-thin top navbar) */}
      <div className="chat-subnav-bar desktop-only">
        <div className="chat-subnav-info">
          <span className="agent-status-dot" title={language === 'ar' ? 'متصل وجاهز' : 'Connected'} />
          <span className="chat-subnav-title" title={currentConversation.title}>
            {messages.length
              ? currentConversation.title || (language === 'ar' ? 'المحادثة' : 'Conversation')
              : (language === 'ar' ? 'جلسة جديدة' : 'New Session')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Photo & Vision Trigger Button */}
          <button
            type="button"
            onClick={() => triggerVisionUpload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            title={language === 'ar' ? 'إرفاق صورة لحل المسائل والأكواد فورياً' : 'Attach photo/image for instant solving'}
          >
            <Camera size={13} className="text-emerald-400" />
            <span>{language === 'ar' ? '📷 حل صورة' : '📷 Solve Photo'}</span>
          </button>

          {/* Side Panel Trigger Button (زر أنيق للتحكم بالجلسة والسجل والذاكرة) */}
          <button
            type="button"
            onClick={() => {
              setMemoryStats(getInfiniteMemoryStats());
              setIsSessionDrawerOpen(true);
            }}
            className="chat-session-btn"
            title={language === 'ar' ? 'فتح لوحة التحكم بالجلسة والذاكرة والسجل' : 'Open Session Controls & Memory'}
            aria-label="Session Controls"
          >
            <SlidersHorizontal size={13} className="text-emerald-400" />
            <span className="chat-session-btn-text desktop-only">{language === 'ar' ? 'إدارة الجلسة' : 'Session Menu'}</span>
            <div className="chat-session-badges">
              <span className="session-mini-badge" title={language === 'ar' ? 'عدد المحادثات' : 'Chats'}>
                <Clock size={10} />
                {conversations.length}
              </span>
            </div>
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
          <div className="welcome max-w-lg mx-auto px-4 py-8 text-center flex flex-col items-center gap-3 animate-fadeIn">
            <div className="welcome-orb"><Bot size={26} /></div>
            <h2 className="text-lg font-bold tracking-tight text-slate-100">
              {language === 'ar' ? `أهلاً بك! كيف يمكنني مساعدتك؟` : `Welcome! How can I help you?`}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {language === 'ar'
                ? `أنا ${agentName}، مساعدك الذكي. اسألني عن أي شيء، اطلب كتابة أو فحص كود، أو إدارة مهامك فوراً.`
                : `I'm ${agentName}, your personal assistant. Ask a question, write or debug code, or organize your tasks.`}
            </p>

            {/* Clean & Useful Starter Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 w-full max-w-md">
              <button
                type="button"
                onClick={() => send(language === 'ar' ? 'اكتب لي كود بايثون بسيط ومفيد' : 'Write a clean, useful Python script')}
                className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Code size={14} className="text-emerald-400" />
                <span>{language === 'ar' ? 'كتابة كود' : 'Write Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => send(language === 'ar' ? 'لخص لي أهم النصائح لتنظيم الوقت والإنتاجية' : 'Give me the best tips for time management and productivity')}
                className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Clock size={14} className="text-emerald-400" />
                <span>{language === 'ar' ? 'تنظيم الوقت' : 'Organize Time'}</span>
              </button>

              <button
                type="button"
                onClick={() => send(language === 'ar' ? 'ما هي أهم أوامر لينكس التي يحتاجها كل مطور؟' : 'What are the essential Linux commands every developer needs?')}
                className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Terminal size={14} className="text-emerald-400" />
                <span>{language === 'ar' ? 'أوامر لينكس' : 'Linux Commands'}</span>
              </button>

              <button
                type="button"
                onClick={() => triggerVisionUpload()}
                className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Camera size={14} className="text-emerald-400" />
                <span>{language === 'ar' ? 'فحص صورة' : 'Analyze Image'}</span>
              </button>

              <button
                type="button"
                onClick={() => send(language === 'ar' ? 'أنشئ خطة عمل واضحة لتنفيذ مشروع جديد' : 'Create a clear action plan for a new project')}
                className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download size={14} className="text-emerald-400" />
                <span>{language === 'ar' ? 'خطة عمل' : 'Action Plan'}</span>
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, idx) => {
              const prevUser = messages
                .slice(0, idx)
                .reverse()
                .find((m) => m.role === 'user');
              const userPrompt = prevUser?.content || '';
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  language={language}
                  userPrompt={userPrompt}
                  onOpenSandbox={onOpenSandbox}
                  onNavigateView={onNavigateView}
                />
              );
            })}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {busy && (
            <StreamingIndicator
              key="chat-streaming-indicator"
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
        </AnimatePresence>
        {error && (
          <div className="error-banner">
            <strong>{language === 'ar' ? 'لم تصل إجابة' : 'No answer yet'}</strong>
            <span>{language === 'ar' ? 'حدث انقطاع في المحرك. سيُعاد توجيه الطلب عند المحاولة التالية.' : 'The response path was interrupted. The next attempt can use a fallback engine.'}</span>
            <button onClick={() => lastPrompt && send(lastPrompt)}><RotateCcw size={14} /> {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2 w-full flex-none pointer-events-none" />
      </div>

      <Composer language={language} busy={busy} onSend={send} onStop={stop} />

      {/* Session Control Side Drawer (مستخرج عبر الزر الجانبي) */}
      <ChatSessionDrawer
        isOpen={isSessionDrawerOpen}
        onClose={() => setIsSessionDrawerOpen(false)}
        language={language}
        currentConversation={currentConversation}
        conversationsCount={conversations.length}
        memoryCount={memoryStats.total}
        agentStatus={
          response?.route === 'web'
            ? (language === 'ar' ? 'بحث مباشر بالويب' : 'Live Web Search')
            : (language === 'ar' ? 'جاهز ومتصل' : 'Ready & Connected')
        }
        onNewChat={handleStartNewChat}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenMemory={() => {
          setMemoryStats(getInfiniteMemoryStats());
          setIsMemoryModalOpen(true);
        }}
        onClearCurrentMessages={handleClearCurrentMessages}
        onRenameConversation={handleRenameConversation}
      />

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
