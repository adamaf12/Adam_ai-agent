import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Globe,
  Calculator,
  Calendar,
  FileText,
  StopCircle,
  Code,
  Lightbulb,
} from 'lucide-react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
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
  onRetryMessage,
  onEditWithNanoBanana,
  onCancelResponse,
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
          icon: <Globe className="w-4 h-4 text-blue-500" />,
          title: 'بحث مباشر في الإنترنت',
          prompt: 'ابحث عن أحدث تطورات الذكاء الاصطناعي لعام 2026 وقدم ملخصاً شاملاً وموثقاً',
        },
        {
          icon: <Code className="w-4 h-4 text-emerald-500" />,
          title: 'برمجة وبناء الأكواد',
          prompt: 'اكتب كود TypeScript لبناء واجهة تفاعلية مع شرح معماري دقيق',
        },
        {
          icon: <Calendar className="w-4 h-4 text-indigo-500" />,
          title: 'جدولة المهام والتقويم',
          prompt: 'ذكرني بموعد جلسة المراجعة التقنية غداً الساعة 10 صباحاً في التقويم',
        },
        {
          icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
          title: 'تحليل وتفكير عميق',
          prompt: 'حلل إيجابيات وسلبيات الحوسبة السحابية مقارنة بالخوادم المحلية لمشروع ناشئ',
        },
      ]
    : [
        {
          icon: <Globe className="w-4 h-4 text-blue-500" />,
          title: 'Live Web Search',
          prompt: 'Search the latest breakthroughs in AI agents in 2026 and summarize',
        },
        {
          icon: <Code className="w-4 h-4 text-emerald-500" />,
          title: 'Code & Architecture',
          prompt: 'Write clean TypeScript code for an interactive module with full types',
        },
        {
          icon: <Calendar className="w-4 h-4 text-indigo-500" />,
          title: 'Schedule & Calendar',
          prompt: 'Schedule my architecture review meeting tomorrow at 10 AM',
        },
        {
          icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
          title: 'Deep Analysis',
          prompt: 'Analyze cloud native vs on-premise infrastructure for a high-growth startup',
        },
      ];

  const userMessagesExist = messages.some((m) => m.sender === 'user');

  const Header = () => (
    <div className="max-w-3xl mx-auto w-full">
      {/* Minimalist Apple iOS Welcome Screen when no conversation started yet */}
      {!userMessagesExist && (
        <div className="py-12 sm:py-20 text-center space-y-6 animate-fadeIn">
          {/* Glowing Apple Intelligence / Siri Orb / Avatar */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-b from-blue-500/20 via-indigo-500/10 to-transparent backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl flex items-center justify-center">
              <AgentAvatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
            </div>
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 shadow-xs" />
          </div>

          {/* Typography */}
          <div className="space-y-1.5 max-w-lg mx-auto px-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {agentName}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal">
              {isArabic ? 'كيف يمكنني مساعدتك اليوم؟' : 'How can I help you today?'}
            </p>
          </div>

          {/* Apple iOS Starter Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto pt-4 px-2 text-start">
            {samplePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSendPrompt(item.prompt)}
                className="ios-card p-3.5 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all flex flex-col gap-1 text-start group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed px-1">
                  {item.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Footer = () => (
    <div className="max-w-3xl mx-auto w-full">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between gap-3 my-4 px-4 py-3 rounded-full ios-glass border border-black/5 dark:border-white/10 shadow-md max-w-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                <span>
                  {isArabic
                    ? `جاري التفكير وصياغة الإجابة...`
                    : `${agentName} is thinking...`}
                </span>
              </div>
            </div>

            {onCancelResponse && (
              <button
                type="button"
                onClick={onCancelResponse}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-full transition flex items-center gap-1 cursor-pointer shrink-0 ios-btn"
                title={isArabic ? 'إيقاف' : 'Stop'}
              >
                <StopCircle className="w-3 h-3" />
                <span>{isArabic ? 'إيقاف' : 'Stop'}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden px-3 sm:px-4 py-2 h-full flex flex-col">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        className="h-full w-full"
        components={{ Header, Footer }}
        itemContent={(_, msg) => (
          <div className="max-w-3xl mx-auto py-1.5">
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
