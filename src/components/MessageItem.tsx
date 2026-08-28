import React, { useState } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  ExternalLink,
  FileText,
  Paperclip,
  Cpu,
  Zap,
  Download,
  Image as ImageIcon,
  Brain,
  ChevronDown,
  ChevronUp,
  Code,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Message } from '../types';
import { ToolExecutionCard } from './ToolExecutionCard';
import { AgentAvatar } from './AgentAvatar';
import { speakWithGlobalVoice, stopAllSpeech } from '../lib/voiceEngine';
import { downloadImageAsPng } from '../lib/imageUtils';

interface MessageItemProps {
  message: Message;
  agentName: string;
  isArabic: boolean;
  onRetry?: () => void;
  onEditWithNanoBanana?: (imageUrl: string) => void;
  onSelectFollowUp?: (suggestion: string) => void;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  const isInline = inline || (!match && !codeString.includes('\n'));

  if (isInline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 font-mono text-xs text-emerald-700 dark:text-emerald-300 font-semibold" {...props}>
        {children}
      </code>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-md font-mono text-xs text-start" dir="ltr">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">{match ? match[1] : 'code'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const MessageItem = React.memo(
  ({
    message,
    agentName,
    isArabic,
    onRetry,
    onEditWithNanoBanana,
    onSelectFollowUp,
  }: MessageItemProps) => {
    const [copied, setCopied] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReasoningTrace, setShowReasoningTrace] = useState(false);

  const isUser = message.sender === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stopAllSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakWithGlobalVoice(message.content, 'adam-neural', {
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex gap-3 my-4 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } group`}
    >
      {/* Avatar */}
      <AgentAvatar isUser={isUser} className="w-9 h-9 rounded-2xl" />

      {/* Bubble Container */}
      <div className={`max-w-[85%] md:max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name and timestamp */}
        <div
          className={`flex items-center flex-wrap gap-1.5 text-[11px] font-medium text-slate-400 px-1 ${
            isUser ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          <span>{isUser ? (isArabic ? 'أنت' : 'You') : agentName}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
          {!isUser && message.modelUsed && (
            <>
              <span>•</span>
              <span
                className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono shadow-2xs font-semibold"
                title={isArabic ? 'النموذج الفعال الذي تولد الرد بوسطته' : 'Active Model Fallback'}
              >
                <Cpu className="w-2.5 h-2.5 text-emerald-500" />
                <span>{isArabic ? 'النموذج:' : 'Model:'}</span>
                <span className="font-bold">{message.modelUsed}</span>
              </span>
            </>
          )}
          {!isUser && message.responseTimeMs !== undefined && (
            <span
              className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono font-semibold shadow-2xs"
              title={isArabic ? 'سرعة زمن الاستجابة الفائقة للسيرفر' : 'Ultra Fast Response Time'}
            >
              <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>
                {message.responseTimeMs < 1000
                  ? `${message.responseTimeMs} ms`
                  : `${(message.responseTimeMs / 1000).toFixed(2)} s`}
              </span>
            </span>
          )}
        </div>

        {/* Message Box */}
        <div
          className={`p-4 rounded-3xl text-sm leading-relaxed shadow-xs ${
            isUser
              ? 'bg-emerald-600 text-white rounded-te-none'
              : message.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 rounded-tl-none'
                : 'bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
          }`}
        >
          {/* File Attachment preview */}
          {message.attachment && (
            <div className="mb-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
              {message.attachment.type.startsWith('image/') && message.attachment.dataUrl ? (
                <div className="space-y-2">
                  <div className="relative group overflow-hidden rounded-2xl border border-slate-700/50 bg-black/40">
                    <img
                      src={message.attachment.dataUrl}
                      alt={message.attachment.name}
                      className="w-full max-h-80 object-contain rounded-2xl transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="overflow-hidden text-xs">
                      <p className="font-bold truncate text-slate-800 dark:text-slate-200">{message.attachment.name}</p>
                      <p className="text-[10px] opacity-75">
                        {(message.attachment.size / 1024).toFixed(1)} KB (PNG)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onEditWithNanoBanana && message.attachment.dataUrl && (
                        <button
                          type="button"
                          onClick={() => onEditWithNanoBanana(message.attachment!.dataUrl!)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
                          title={isArabic ? 'تعديل هذه الصورة بمحرك نانو بنانة الذكي' : 'Edit with Nano Banana AI'}
                        >
                          <span className="text-xs">🍌</span>
                          <span>{isArabic ? 'تعديل بنانو بنانة ⚡' : 'Nano Banana ⚡'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => downloadImageAsPng(message.attachment!.dataUrl!, message.attachment!.name || 'image')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
                        title={isArabic ? 'تحميل الصورة بصيغة PNG' : 'Download PNG Image'}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'تحميل PNG 📥' : 'Download PNG 📥'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden text-xs">
                    <p className="font-bold truncate">{message.attachment.name}</p>
                    <p className="text-[10px] opacity-75">
                      {(message.attachment.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thought Process / Reasoning Trace */}
          {!isUser && (message.thoughtProcess || (message.reasoningSteps && message.reasoningSteps.length > 0)) && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowReasoningTrace(!showReasoningTrace)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-500/20 transition shadow-2xs"
              >
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span>{isArabic ? 'مسار التفكير والتصحيح الذاتي (Reasoning Trace 🧠)' : 'Reasoning & Action Trace 🧠'}</span>
                {showReasoningTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showReasoningTrace && (
                <div className="mt-2 p-3 rounded-2xl bg-purple-950/20 dark:bg-slate-900/90 border border-purple-500/30 text-xs text-slate-300 space-y-2 animate-fade-in">
                  {message.thoughtProcess && (
                    <p className="italic text-purple-200/90 leading-relaxed font-mono text-[11px]">
                      "{message.thoughtProcess}"
                    </p>
                  )}

                  {message.reasoningSteps && message.reasoningSteps.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-purple-500/20">
                      <p className="font-bold text-slate-400 text-[10px]">
                        {isArabic ? 'خطوات التنفيذ المنهجية:' : 'Execution Steps:'}
                      </p>
                      {message.reasoningSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-[11px]">
                          <span className="font-bold text-purple-400">{sIdx + 1}.</span>
                          <div className="flex-1">
                            <span className="font-semibold text-slate-200">{isArabic ? (step.titleAr || step.titleEn) : (step.titleEn || step.titleAr)}</span>
                            {(step.detailAr || step.detailEn) && (
                              <p className="text-[10px] text-slate-400">
                                {isArabic ? (step.detailAr || step.detailEn) : (step.detailEn || step.detailAr)}
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text Content */}
          {isUser ? (
            <div className="whitespace-pre-wrap break-words font-sans text-sm">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words font-sans leading-relaxed text-sm space-y-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => <>{children}</>,
                  p: ({ node, ...props }) => <div className="leading-relaxed my-1.5" {...props} />,
                  code: CodeBlock,
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2 hover:opacity-80"
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc list-inside space-y-1 my-1.5" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal list-inside space-y-1 my-1.5" />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1 {...props} className="text-base font-bold my-2 text-emerald-800 dark:text-emerald-300" />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2 {...props} className="text-sm font-bold my-1.5 text-slate-800 dark:text-slate-200" />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 {...props} className="text-xs font-bold my-1 text-slate-700 dark:text-slate-300" />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      {...props}
                      className="border-s-3 border-emerald-500 ps-3 italic text-slate-600 dark:text-slate-400 my-2"
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-slate-300 dark:border-slate-700">
                      <table {...props} className="min-w-full text-xs text-start" />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th {...props} className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold border-b border-slate-300 dark:border-slate-700" />
                  ),
                  td: ({ node, ...props }) => (
                    <td {...props} className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800" />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 ms-1 bg-emerald-500 rounded-xs animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Suggested Follow-ups Chips */}
          {!isUser && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && onSelectFollowUp && (
            <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isArabic ? 'اقتراحات متابعة ذكية:' : 'Smart Suggested Follow-ups:'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.suggestedFollowUps.map((suggestion, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => onSelectFollowUp(suggestion)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] shadow-xs"
                  >
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tool Executions Cards */}
          {message.toolExecutions && message.toolExecutions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              {message.toolExecutions.map((tool, idx) => (
                <ToolExecutionCard key={idx} tool={tool} isArabic={isArabic} />
              ))}
            </div>
          )}

          {/* Grounding Sources */}
          {message.groundingSources && message.groundingSources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <p className="font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                {isArabic ? 'مصادر الإنترنت والويب:' : 'Web Grounding Sources:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.groundingSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition text-[11px]"
                  >
                    <span className="truncate max-w-[150px]">{src.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Dedicated Retry Prompt Card / Watchdog Re-trigger Alert */}
          {!isUser && (message.isError || message.retryPrompt || message.watchdogTriggered) && onRetry && (
            <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {message.watchdogTriggered ? (
                    <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span>
                    {message.watchdogTriggered
                      ? isArabic
                        ? 'مراقب الاستجابة الذكي (10 ثوانٍ) - تم التنبيه'
                        : 'Watchdog Timer Alert (10s threshold)'
                      : isArabic
                        ? 'هل ترغب في إعادة المحاولة؟'
                        : 'Would you like to retry this query?'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold">
                  {isArabic ? 'محرك الحماية' : 'Stream Watchdog'}
                </span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {message.retryPrompt ||
                  (isArabic
                    ? 'لم يتم استلام أي نص من تدفق البيانات خلال 10 ثوانٍ، أو تعذر إكمال الإجابة. يمكنك الضغط أدناه لإعادة إرسال الاستفسار فوراً وتفعيل نموذج بديل.'
                    : 'No content was received in the stream within 10 seconds, or response was interrupted. Click below to re-trigger the query immediately.')}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isArabic ? '🔄 إعادة إرسال الاستفسار الآن (Retry Query)' : '🔄 Retry Query Now'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div
          className={`flex items-center gap-2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'justify-end' : 'justify-start'
          }`}
        >
          <button
            onClick={handleCopy}
            className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title={isArabic ? 'نسخ النص' : 'Copy'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {!isUser && (
            <button
              onClick={handleToggleSpeech}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title={isSpeaking ? (isArabic ? 'إيقاف الصوت' : 'Stop Audio') : (isArabic ? 'قراءة بصوت مرتفع' : 'Read Aloud')}
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {message.isError && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إعادة المحاولة' : 'Retry'}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders when callbacks are recreated
  return (
    prevProps.message === nextProps.message &&
    prevProps.agentName === nextProps.agentName &&
    prevProps.isArabic === nextProps.isArabic
  );
});
