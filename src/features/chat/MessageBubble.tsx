import React, { useState } from 'react';
import { Bot, Check, Code2, Copy, Gamepad2, Play, User } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../core/domain';
import { ImageCard } from './ImageCard';
import { GroundingSources, type GroundingSource } from './GroundingSources';
import { extractAppCode, saveSandboxApp } from '../../core/appSandboxStorage';

function extractPromptFromUrl(src: string): string {
  try {
    const url = new URL(src);
    if (url.hostname.includes('pollinations.ai')) {
      const parts = url.pathname.split('/p/');
      if (parts.length > 1) return decodeURIComponent(parts[1]);
      const promptParts = url.pathname.split('/prompt/');
      if (promptParts.length > 1) return decodeURIComponent(promptParts[1]);
    }
  } catch {}
  return '';
}

interface MessageBubbleProps {
  message: Message;
  language: 'ar' | 'en';
  userPrompt?: string;
  onOpenSandbox?: (appId: string) => void;
}

export function MessageBubble({
  message,
  language,
  userPrompt,
  onOpenSandbox,
}: MessageBubbleProps) {
  const assistant = message.role === 'assistant';
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Check if message contains structured image card payload
  const imageCardMatch = message.content.match(/:::image-card\s*([\s\S]*?)\s*:::/i);
  let imageCardData: {
    imageUrl: string;
    enhancedPrompt: string;
    originalPrompt?: string;
    title?: string;
    aspectRatio?: string;
    engine?: string;
  } | null = null;
  if (imageCardMatch) {
    try {
      imageCardData = JSON.parse(imageCardMatch[1]);
    } catch {}
  }

  // Check if message contains structured grounding sources payload
  const groundingMatch = message.content.match(/:::grounding-sources\s*([\s\S]*?)\s*:::/i);
  let groundingData: { sources: GroundingSource[]; queries?: string[] } | null = null;
  if (groundingMatch) {
    try {
      groundingData = JSON.parse(groundingMatch[1]);
    } catch {}
  }

  // Check if message contains runnable app/game code
  const appData = assistant ? extractAppCode(message.content) : null;

  // Clean raw image card or grounding tags from display markdown
  let displayMarkdown = message.content;
  if (imageCardMatch) {
    displayMarkdown = displayMarkdown.replace(/:::image-card\s*[\s\S]*?\s*:::/gi, '').trim();
    displayMarkdown = displayMarkdown
      .replace(/!\[.*?\]\((?:https?:\/\/[^\s\)]+pollinations[^\s\)]*)\)/gi, '')
      .trim();
  }
  if (groundingMatch) {
    displayMarkdown = displayMarkdown.replace(/:::grounding-sources\s*[\s\S]*?\s*:::/gi, '').trim();
  }

  const copy = () => navigator.clipboard?.writeText(displayMarkdown || message.content);

  const handleLaunchSandbox = () => {
    if (!appData) return;
    const title =
      userPrompt
        ? userPrompt.slice(0, 40)
        : language === 'ar'
        ? 'لعبة / تطبيق تفاعلي جديد'
        : 'New Interactive App / Game';

    const saved = saveSandboxApp({
      title,
      prompt: userPrompt || '',
      code: appData.code,
      category: appData.isGameOrApp ? 'game' : 'app',
    });

    if (onOpenSandbox) {
      onOpenSandbox(saved.id);
    }
  };

  const isRtl = language === 'ar';
  // Slide in from user side for user message, or from assistant side for assistant message
  const slideX = assistant ? (isRtl ? 16 : -16) : (isRtl ? -16 : 16);

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
        x: slideX,
        scale: 0.985,
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={assistant ? 'message-row' : 'message-row message-row--user'}
    >
      <div className={assistant ? 'message-avatar' : 'message-avatar message-avatar--user'}>
        {assistant ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div className="message-body">
        <div className="message-meta">
          {assistant ? 'Adam' : language === 'ar' ? 'أنت' : 'You'}
          <span>
            {new Date(message.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Dedicated Image Card if Structured Function Call Payload exists */}
        {imageCardData && (
          <ImageCard
            imageUrl={imageCardData.imageUrl}
            enhancedPrompt={imageCardData.enhancedPrompt}
            originalPrompt={imageCardData.originalPrompt}
            title={imageCardData.title}
            aspectRatio={imageCardData.aspectRatio}
            engine={imageCardData.engine}
            language={language}
          />
        )}

        {/* Dedicated App / Game Launcher Banner when code is generated */}
        {assistant && appData && (
          <div className="my-2.5 p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {appData.isGameOrApp ? <Gamepad2 size={20} /> : <Code2 size={20} />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>
                    {language === 'ar'
                      ? '🎮 كود لعبة / تطبيق تفاعلي جاهز للتشغيل'
                      : '🎮 Interactive App / Game Code Ready'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'تم حفظ وتجهيز الكود في مشغل الألعاب والتطبيقات المستقل'
                    : 'Saved and ready to run in the dedicated Sandbox Player'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLaunchSandbox}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Play size={13} />
              {language === 'ar' ? 'فتح وتشغيل في مشغل الألعاب 🚀' : 'Launch in Sandbox 🚀'}
            </button>
          </div>
        )}

        {displayMarkdown ? (
          <div className="message-content">
            {assistant ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node: _node, children, ...props }) => {
                    return (
                      <div className="message-paragraph" {...props}>
                        {children}
                      </div>
                    );
                  },
                  code: ({ node: _node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <div className="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400">
                            <span className="font-mono uppercase font-bold text-emerald-400">
                              {match[1]}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(codeString);
                                setCopiedCodeIndex(Date.now());
                                setTimeout(() => setCopiedCodeIndex(null), 2000);
                              }}
                              className="hover:text-slate-200 flex items-center gap-1 font-sans"
                            >
                              {copiedCodeIndex ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                              <span>
                                {copiedCodeIndex
                                  ? language === 'ar'
                                    ? 'تم النسخ'
                                    : 'Copied'
                                  : language === 'ar'
                                  ? 'نسخ الكود'
                                  : 'Copy Code'}
                              </span>
                            </button>
                          </div>
                          <pre className="p-3.5 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed select-text">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  a: ({ node: _node, href, children, ...props }) => {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  },
                  img: ({ node: _node, src, alt }) => {
                    if (!src) return null;
                    const isVideoUrl =
                      /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src) ||
                      src.includes('video') ||
                      src.includes('mp4');
                    if (isVideoUrl) {
                      return (
                        <div className="my-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl group relative">
                          <video
                            src={src}
                            controls
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full max-h-[480px] object-cover rounded-2xl"
                          />
                          <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 font-medium flex items-center justify-between">
                            <span className="truncate max-w-[70%]">
                              {alt || (language === 'ar' ? 'مشهد فيديو سينمائي' : 'Cinematic video')}
                            </span>
                            <a
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 underline text-[11px]"
                            >
                              {language === 'ar' ? 'فتح الفيديو' : 'Open video'}
                            </a>
                          </div>
                        </div>
                      );
                    }

                    // For standard markdown image, use our rich ImageCard component
                    const decodedPrompt = extractPromptFromUrl(src) || alt || '';
                    return (
                      <ImageCard
                        imageUrl={src}
                        enhancedPrompt={decodedPrompt}
                        title={alt || (language === 'ar' ? 'صورة فائقة الدقة' : 'High-Res Image')}
                        language={language}
                      />
                    );
                  },
                }}
              >
                {displayMarkdown}
              </ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        ) : null}

        {/* Real-time Google Search Grounding Sources */}
        {assistant &&
          groundingData &&
          (groundingData.sources.length > 0 ||
            (groundingData.queries && groundingData.queries.length > 0)) && (
            <GroundingSources
              sources={groundingData.sources}
              queries={groundingData.queries}
              language={language}
            />
          )}

        {assistant && message.content && (
          <button className="message-action" onClick={copy} aria-label="Copy">
            <Copy size={13} />
          </button>
        )}
      </div>
    </motion.article>
  );
}

