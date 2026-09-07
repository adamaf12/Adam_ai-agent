import React from 'react';
import { Bot, Copy, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../core/domain';
import { LiveAppPreview } from './LiveAppPreview';
import { ImageCard } from './ImageCard';
import { GroundingSources, type GroundingSource } from './GroundingSources';

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

export function MessageBubble({ message, language }: { message: Message; language: 'ar' | 'en' }) {
  const assistant = message.role === 'assistant';

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

  // Check if message contains an interactive app / HTML / UI component
  const hasImage = Boolean(imageCardData) || /!\[.*?\]\(https?:\/\/[^\s\)]+\)/i.test(message.content);
  const hasRunnableApp = assistant && !hasImage && (
    /```(?:html|jsx|tsx|javascript|js)?\s*[\s\S]*?(?:<!DOCTYPE|<html|<button|<canvas|<form|<div)[\s\S]*?```/i.test(message.content) ||
    /(?:<!DOCTYPE html>|<html[\s\S]*<\/html>)/i.test(message.content)
  );

  // Clean the text above preview so we don't duplicate a massive raw code block or raw image payload
  let displayMarkdown = hasRunnableApp
    ? message.content.replace(/```(?:html|jsx|tsx|javascript|js)?\s*[\s\S]*?```/gi, '').trim()
    : message.content;

  if (imageCardMatch) {
    displayMarkdown = displayMarkdown.replace(/:::image-card\s*[\s\S]*?\s*:::/gi, '').trim();
    // Also remove duplicated markdown image tags that point to pollinations or image generators
    displayMarkdown = displayMarkdown.replace(/!\[.*?\]\((?:https?:\/\/[^\s\)]+pollinations[^\s\)]*)\)/gi, '').trim();
  }

  if (groundingMatch) {
    displayMarkdown = displayMarkdown.replace(/:::grounding-sources\s*[\s\S]*?\s*:::/gi, '').trim();
  }

  const copy = () => navigator.clipboard?.writeText(displayMarkdown || message.content);

  return (
    <article className={assistant ? 'message-row' : 'message-row message-row--user'}>
      <div className={assistant ? 'message-avatar' : 'message-avatar message-avatar--user'}>
        {assistant ? <Bot size={16} /> : <User size={16} />}
      </div>
      <div className="message-body">
        <div className="message-meta">
          {assistant ? 'Adam' : (language === 'ar' ? 'أنت' : 'You')}
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
                    const isVideoUrl = /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(src) || src.includes('video') || src.includes('mp4');
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
                            <span className="truncate max-w-[70%]">{alt || (language === 'ar' ? 'مشهد فيديو سينمائي' : 'Cinematic video')}</span>
                            <a href={src} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline text-[11px]">
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
        {assistant && groundingData && (groundingData.sources.length > 0 || (groundingData.queries && groundingData.queries.length > 0)) && (
          <GroundingSources
            sources={groundingData.sources}
            queries={groundingData.queries}
            language={language}
          />
        )}

        {assistant && message.content && (
          <>
            <LiveAppPreview content={message.content} language={language} />
            <button className="message-action" onClick={copy} aria-label="Copy">
              <Copy size={13} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}
