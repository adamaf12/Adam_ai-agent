import {
  Bell,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  Clock,
  Code,
  Cpu,
  Download,
  FileSearch,
  Film,
  Globe,
  GraduationCap,
  LayoutGrid,
  Languages,
  Plus,
  Radio,
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
import { openSafeExternalUrl } from '../../core/utils/mobileWebHandler';
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
  recordContinuousEvolutionStep,
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
import { ChatAcademicModal } from './ChatAcademicModal';

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
  onToggleLanguage,
  onOpenSandbox,
  onSessionMetaChange,
  onNavigateView,
}: {
  language: Language;
  agentName: string;
  copy: { title: string; subtitle: string };
  onNewChat?: () => void;
  onToggleLanguage?: () => void;
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
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [memoryStats, setMemoryStats] = useState(() => getInfiniteMemoryStats());

  useEffect(() => {
    const handleOpenAcademic = () => setIsAcademicModalOpen(true);
    const handleOpenSession = () => {
      setMemoryStats(getInfiniteMemoryStats());
      setIsSessionDrawerOpen(true);
    };

    window.addEventListener('adam_open_academic_modal' as any, handleOpenAcademic);
    window.addEventListener('adam:open-session-drawer' as any, handleOpenSession);
    return () => {
      window.removeEventListener('adam_open_academic_modal' as any, handleOpenAcademic);
      window.removeEventListener('adam:open-session-drawer' as any, handleOpenSession);
    };
  }, []);

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
    const turnStartTime = Date.now();
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
            onOpenExternal: (url) => openSafeExternalUrl(url),
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

      // 6. Perpetual Auto-Evolution & Self-Improvement Loop
      const turnLatency = Date.now() - turnStartTime;
      recordContinuousEvolutionStep(clean, finalized, {
        latencyMs: turnLatency,
        wasSuccess: true,
      });
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
          <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center flex flex-col items-center gap-6 animate-fadeIn select-none">
            {/* Ambient Minimalist Brand Mark */}
            <div className="relative group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] text-[var(--accent)] flex items-center justify-center shadow-lg backdrop-blur-xl">
                <Sparkles size={28} className="drop-shadow-[0_0_10px_var(--accent)]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
                {language === 'ar' ? 'مرحباً، كيف يمكنني مساعدتك اليوم؟' : 'Hello, how can I help you today?'}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                {language === 'ar'
                  ? 'منظومة ذكاء اصطناعي شاملة للبرمجة، التحليل، الإدراك البصري، وإدارة المشاريع.'
                  : 'Executive AI for full-stack engineering, vision perception, and system intelligence.'}
              </p>
            </div>

            {/* 4 Clean Minimal Prompt Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-start">
              {[
                {
                  icon: Code,
                  titleAr: 'برمجة وتطوير تطبيق ويب كامل',
                  titleEn: 'Architect full web application',
                  promptAr: 'برمج لي تطبيق ويب متجاوب وحديث بالكامل بنسبة 100% مع واجهة أنيقة',
                  promptEn: 'Write a complete responsive production-ready web application',
                },
                {
                  icon: Sparkles,
                  titleAr: 'توليد أفكار أو صور سينمائية 8K',
                  titleEn: 'Cinematic 8K image prompt',
                  promptAr: 'أنشئ لي فكرة وتفاصيل برومبت سينمائي فائق الدقة 8K مع توزيع إضاءة احترافي',
                  promptEn: 'Generate an 8K cinematic visual concept with studio lighting',
                },
                {
                  icon: Terminal,
                  titleAr: 'أوامر وإدارة أنظمة لينكس والسيرفرات',
                  titleEn: 'Linux commands & system automation',
                  promptAr: 'ما هي أفضل سكربتات وأوامر فحص وإدارة سيرفرات لينكس بأمان؟',
                  promptEn: 'Provide advanced Linux server audit & automation scripts',
                },
                {
                  icon: GraduationCap,
                  titleAr: 'شرح أكاديمي وحل مسائل تخصصية',
                  titleEn: 'Academic study & problem solving',
                  promptAr: 'اشرح لي مفهوماً علمياً مع أمثلة عملية ونصائح لتثبيت الفهم',
                  promptEn: 'Explain a core scientific concept with practical examples and study tips',
                },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => send(language === 'ar' ? card.promptAr : card.promptEn)}
                    className="group p-3 sm:p-3.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] transition-all flex items-center gap-3 text-start cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] group-hover:bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors truncate flex-1">
                      {language === 'ar' ? card.titleAr : card.titleEn}
                    </span>
                  </button>
                );
              })}
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

      {/* Integrated Academic & Scholarly Library Modal */}
      <ChatAcademicModal
        isOpen={isAcademicModalOpen}
        onClose={() => setIsAcademicModalOpen(false)}
        language={language}
        onSendPrompt={(prompt) => {
          send(prompt);
        }}
      />
    </section>
  );
}
