import React from 'react';
import { Bot, LoaderCircle, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';

export function StreamingIndicator({
  label,
  isImage,
  language = 'ar',
  prompt,
}: {
  label: string;
  isImage?: boolean;
  language?: 'ar' | 'en';
  prompt?: string;
}) {
  const isAr = language === 'ar';
  const slideX = isAr ? 14 : -14;

  if (isImage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, x: slideX, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="message-row w-full"
        role="status"
        aria-live="polite"
      >
        <div className="message-avatar">
          <Sparkles size={17} className="text-[var(--accent)] animate-pulse" />
        </div>
        <div className="message-body w-full max-w-lg">
          <div className="message-meta">
            <span className="font-bold text-[var(--text)]">ADEM Studio</span>
            <span className="text-xs text-[var(--accent)] font-medium">
              {isAr ? 'جاري بناء المشهد البصري…' : 'Generating…'}
            </span>
          </div>
          
          <div className="my-2 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-md relative">
            <div className="w-full aspect-video relative flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface-2)]">
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                  <ImageIcon size={22} className="animate-pulse" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                    <Wand2 size={13} className="text-[var(--accent)]" />
                    <span>{isAr ? 'توليد الصورة وتوزيع الإضاءة السينمائية' : 'Synthesizing High-Resolution Scene'}</span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] max-w-xs truncate font-mono">
                    {prompt || (isAr ? 'معالجة البرومبت بدقة…' : 'Processing prompt…')}
                  </p>
                </div>

                <div className="w-44 bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden mt-1 border border-[var(--border)]">
                  <div className="bg-[var(--accent)] h-full w-full animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-[var(--surface-2)]/90 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <LoaderCircle size={13} className="animate-spin text-[var(--accent)]" />
                {label}
              </span>
              <span className="text-[10px] font-mono text-[var(--accent)] uppercase font-semibold">
                8K ULTRA HD
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="message-row w-full text-start"
      role="status"
      aria-live="polite"
    >
      <div className="message-avatar">
        <Bot size={17} className="text-[var(--accent)] animate-pulse" />
      </div>
      <div className="message-body">
        <div className="message-meta">
          <span className="font-bold text-[var(--text)] tracking-tight">ADEM</span>
          <span className="text-[10px] text-[var(--accent)] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent-subtle)] border border-[var(--border)] leading-tight select-none">
            AI
          </span>
          <span className="text-[11px] text-[var(--muted)] font-normal">
            {isAr ? 'يكتب الآن…' : 'Thinking…'}
          </span>
        </div>

        <div className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs w-fit">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" />
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            {label || (isAr ? 'ADEM يصيغ الإجابة بدقة…' : 'Formulating response…')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
