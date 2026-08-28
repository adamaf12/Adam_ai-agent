import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Globe, Calculator, Calendar, FileText, PlusCircle, Brain, HelpCircle, XCircle, Wrench, ShieldCheck } from 'lucide-react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { AutoHealBar } from './AutoHealBar';
import { AgentAvatar } from './AgentAvatar';
import { Virtuoso } from 'react-virtuoso';

interface ChatAreaProps {
  messages: Message[];
  agentName: string;
  isLoading: boolean;
  isArabic: boolean;
  onSendPrompt: (prompt: string) => void;
  onNewChat?: () => void;
  onRetryMessage?: () => void;
  onEditWithNanoBanana?: (imageUrl: string) => void;
  onCancelResponse?: () => void;
  onAutoHealReport?: (msg: string) => void;
  onOpenAutoHealDashboard?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  agentName,
  isLoading,
  isArabic,
  onSendPrompt,
  onNewChat,
  onRetryMessage,
  onEditWithNanoBanana,
  onCancelResponse,
  onAutoHealReport,
  onOpenAutoHealDashboard,
}) => {
  const virtuosoRef = useRef<any>(null);

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ index: messages.length - 1, behavior: 'smooth' });
    }
  }, [messages.length, isLoading]);

  const samplePrompts = isArabic
    ? [
        {
          icon: <Calendar className="w-4 h-4 text-emerald-500" />,
          title: 'جدولة موعد بجدولك',
          prompt: 'اذكرني بموعد اجتماع الفريق غداً الساعة 10 صباحاً لمدة ساعة في التقويم',
        },
        {
          icon: <Globe className="w-4 h-4 text-blue-500" />,
          title: 'بحث الويب والإنترنت',
          prompt: 'ابحث عن أحدث تطورات نماذج الذكاء الاصطناعي لعام 2026 ولخصها في نقاط',
        },
        {
          icon: <Calculator className="w-4 h-4 text-purple-500" />,
          title: 'حساب رياضي وتحويل',
          prompt: 'احسب لي: (250 * 1.15) + 45 وضاعف الناتج',
        },
        {
          icon: <FileText className="w-4 h-4 text-amber-500" />,
          title: 'حفظ ملاحظة نصية',
          prompt: 'احفظ ملاحظة بعنوان "أفكار المشروعات" واكتب بها: بناء تطبيقات الذكاء الاصطناعي متعددة الأدوات',
        },
      ]
    : [
        {
          icon: <Calendar className="w-4 h-4 text-emerald-500" />,
          title: 'Schedule a Meeting',
          prompt: 'Remind me about team sync tomorrow at 10 AM in my calendar',
        },
        {
          icon: <Globe className="w-4 h-4 text-blue-500" />,
          title: 'Web Search Query',
          prompt: 'Search for latest AI Agent updates in 2026 and summarize',
        },
        {
          icon: <Calculator className="w-4 h-4 text-purple-500" />,
          title: 'Math & Conversion',
          prompt: 'Calculate: (250 * 1.15) + 45 and double the result',
        },
        {
          icon: <FileText className="w-4 h-4 text-amber-500" />,
          title: 'Save Text Note',
          prompt: 'Save a note titled "Project Ideas" with content: Build fullstack AI agents with tool use',
        },
      ];

  const userMessagesExist = messages.some((m) => m.sender === 'user');

  const Header = () => (
    <div className="max-w-4xl mx-auto space-y-3 pb-3">
      {/* Dedicated Auto-Healer Tool Bar right at the top of the Chat */}
      <AutoHealBar
        isArabic={isArabic}
        onHealComplete={onAutoHealReport}
        onOpenDashboard={onOpenAutoHealDashboard}
        className="mb-2"
      />

      {/* Welcome Empty Banner if no user messages */}
      {!userMessagesExist && (
        <div className="my-8 text-center space-y-6 animate-fade-in">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 shadow-2xl shadow-cyan-500/25">
              <AgentAvatar className="w-full h-full rounded-[22px]" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase border-2 border-slate-950 shadow-md">
              ADEM AI
            </div>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isArabic ? `أهلاً بك، أنا "${agentName}"` : `Welcome, I am "${agentName}"`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isArabic
                ? 'وكيل الذكاء الاصطناعي الذكي الخبير بالمهمات المتعددة، البحث الحي، التقويم، التذكيرات، والملاحظات.'
                : 'Your intelligent multi-task AI Agent capable of web search, scheduling, notes, and memory.'}
            </p>
          </div>

          {/* Starter Prompts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-4 text-start">
            {samplePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSendPrompt(item.prompt)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:shadow-md transition group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick New Chat bar when messages exist */}
      {userMessagesExist && onNewChat && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-xs rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span>
            {isArabic ? 'المحادثة الحالية نشطة' : 'Active Conversation'}
          </span>
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isArabic ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>
        </div>
      )}
    </div>
  );

  const Footer = () => (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-center justify-between gap-3 my-4 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>
                  {isArabic
                    ? `يقوم ${agentName} بمعالجة وتوليد الإجابة...`
                    : `${agentName} is processing response...`}
                </span>
              </div>
            </div>
            {onCancelResponse && (
              <button
                type="button"
                onClick={onCancelResponse}
                className="px-2.5 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
                title={isArabic ? 'إيقاف التوليد فوراً' : 'Stop generating'}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إيقاف' : 'Stop'}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden px-4 py-4 h-full flex flex-col">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        className="h-full w-full"
        components={{ Header, Footer }}
        itemContent={(index, msg) => (
          <div className="max-w-4xl mx-auto py-2">
            <MessageItem
              key={msg.id}
              message={msg}
              agentName={agentName}
              isArabic={isArabic}
              onRetry={onRetryMessage}
              onEditWithNanoBanana={onEditWithNanoBanana}
              onSelectFollowUp={onSendPrompt}
            />
          </div>
        )}
      />
    </div>
  );
};
