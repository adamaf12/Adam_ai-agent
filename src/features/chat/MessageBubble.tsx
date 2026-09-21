import React, { useState, useEffect } from 'react';
import { Bot, Check, Code2, Copy, Gamepad2, Languages, Play, User, Volume2, VolumeX, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, ViewId } from '../../core/domain';
import { ImageCard } from './ImageCard';
import { ImageViewerModal } from './ImageViewerModal';
import { GroundingSources, type GroundingSource } from './GroundingSources';
import { AppLauncherCard, type AppLauncherData } from './AppLauncherCard';
import { AgentActionCard } from './AgentActionCard';
import { extractAgentActions } from '../../core/agent/ademDuoAutonomousAgent';
import { extractAppCode, saveSandboxApp } from '../../core/appSandboxStorage';
import { InteractiveAppCard } from './InteractiveAppCard';
import { AcademicCard, type AcademicCardPayload } from './AcademicCard';
import { MediaStudioCard, type MediaCardPayload } from './MediaStudioCard';
import { CognitiveIqCard, type CognitiveIqCardPayload } from './CognitiveIqCard';
import { GeospatialCard, type GeospatialCardPayload } from './GeospatialCard';
import { InteractiveTaskCard, type TaskCardPayload } from './InteractiveTaskCard';
import { TranslationCard, type TranslationCardPayload } from './TranslationCard';
import { requestTranslation } from '../translation/translationApi';

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
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
}

export function MessageBubble({
  message,
  language,
  userPrompt,
  onOpenSandbox,
  onNavigateView,
}: MessageBubbleProps) {
  const assistant = message.role === 'assistant';
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt?: string } | null>(null);

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

  // Check if message contains structured app-launcher payload
  const appLauncherMatch = message.content.match(/:::app-launcher\s*([\s\S]*?)\s*:::/i);
  let appLauncherData: AppLauncherData | null = null;
  if (appLauncherMatch) {
    try {
      appLauncherData = JSON.parse(appLauncherMatch[1]);
    } catch {}
  }

  // Check if message contains structured autonomous agent actions
  const agentActions = extractAgentActions(message.content);

  // Check if message contains structured academic card payload
  const academicMatch = message.content.match(/:::academic-card\s*([\s\S]*?)\s*:::/i);
  let academicData: AcademicCardPayload | null = null;
  if (academicMatch) {
    try {
      academicData = JSON.parse(academicMatch[1]);
    } catch {}
  }

  // Check if message contains structured media studio card payload
  const mediaMatch = message.content.match(/:::media-card\s*([\s\S]*?)\s*:::/i);
  let mediaData: MediaCardPayload | null = null;
  if (mediaMatch) {
    try {
      mediaData = JSON.parse(mediaMatch[1]);
    } catch {}
  }

  // Check if message contains structured cognitive IQ card payload
  const iqMatch = message.content.match(/:::iq-card\s*([\s\S]*?)\s*:::/i);
  let iqData: CognitiveIqCardPayload | null = null;
  if (iqMatch) {
    try {
      iqData = JSON.parse(iqMatch[1]);
    } catch {}
  }

  // Check if message contains structured geospatial card payload
  const geoMatch = message.content.match(/:::geo-card\s*([\s\S]*?)\s*:::/i);
  let geoData: GeospatialCardPayload | null = null;
  if (geoMatch) {
    try {
      geoData = JSON.parse(geoMatch[1]);
    } catch {}
  }

  // Check if message contains structured interactive task card payload
  const taskMatch = message.content.match(/:::task-card\s*([\s\S]*?)\s*:::/i);
  let taskData: TaskCardPayload | null = null;
  if (taskMatch) {
    try {
      taskData = JSON.parse(taskMatch[1]);
    } catch {}
  }

  // Check if message contains structured translation card payload
  const translationMatch = message.content.match(/:::translation-card\s*([\s\S]*?)\s*:::/i);
  let translationData: TranslationCardPayload | null = null;
  if (translationMatch) {
    try {
      translationData = JSON.parse(translationMatch[1]);
    } catch {}
  }

  // Check if message contains runnable app/game code
  const appData = assistant ? extractAppCode(message.content) : null;

  // Inline dynamic translation state
  const [inlineTranslation, setInlineTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showInlineTranslation, setShowInlineTranslation] = useState(false);

  // Clean raw image card or grounding or app launcher or agent action or academic card tags from display markdown
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
  if (appLauncherMatch) {
    displayMarkdown = displayMarkdown.replace(/:::app-launcher\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (agentActions.length > 0) {
    displayMarkdown = displayMarkdown.replace(/:::agent-action\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (academicMatch) {
    displayMarkdown = displayMarkdown.replace(/:::academic-card\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (mediaMatch) {
    displayMarkdown = displayMarkdown.replace(/:::media-card\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (iqMatch) {
    displayMarkdown = displayMarkdown.replace(/:::iq-card\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (geoMatch) {
    displayMarkdown = displayMarkdown.replace(/:::geo-card\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (taskMatch) {
    displayMarkdown = displayMarkdown.replace(/:::task-card\s*[\s\S]*?\s*:::/gi, '').trim();
  }
  if (translationMatch) {
    displayMarkdown = displayMarkdown.replace(/:::translation-card\s*[\s\S]*?\s*:::/gi, '').trim();
  }

  const copy = () => navigator.clipboard?.writeText(displayMarkdown || message.content);

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text from code blocks, markdown symbols, cards, and metadata
    const cleanText = (displayMarkdown || message.content)
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/:::[^:]+:::/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Smart multi-language and multi-dialect detection
    const isArabic = /[\u0600-\u06FF]/.test(cleanText);
    const isFrench = /[àâäéèêëîïôöùûüç]/i.test(cleanText) && !isArabic;
    const isSpanish = /[áéíóúüñ¿¡]/i.test(cleanText) && !isArabic;
    const isGerman = /[äöüß]/i.test(cleanText) && !isArabic;
    const isItalian = /[àèéìíîòóùú]/i.test(cleanText) && !isArabic && !isFrench && !isSpanish;
    const isJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(cleanText);
    const isChinese = /[\u4e00-\u9fff]/.test(cleanText) && !isJapanese;
    const isKorean = /[\uac00-\ud7af\u1100-\u11ff]/.test(cleanText);
    const isRussian = /[\u0400-\u04FF]/.test(cleanText);
    const isTurkish = /[ğüşöçıİĞÜŞÖÇ]/.test(cleanText) && !isArabic;
    const isHindi = /[\u0900-\u097F]/.test(cleanText);
    const isPersian = /[\u067E\u0686\u0698\u06AF]/.test(cleanText);
    const isUrdu = /[\u0679\u0688\u0691\u06BA\u06D2]/.test(cleanText);

    let targetLang = 'en-US';
    if (isPersian) targetLang = 'fa-IR';
    else if (isUrdu) targetLang = 'ur-PK';
    else if (isArabic) targetLang = 'ar-SA';
    else if (isFrench) targetLang = 'fr-FR';
    else if (isSpanish) targetLang = 'es-ES';
    else if (isGerman) targetLang = 'de-DE';
    else if (isItalian) targetLang = 'it-IT';
    else if (isJapanese) targetLang = 'ja-JP';
    else if (isChinese) targetLang = 'zh-CN';
    else if (isKorean) targetLang = 'ko-KR';
    else if (isRussian) targetLang = 'ru-RU';
    else if (isTurkish) targetLang = 'tr-TR';
    else if (isHindi) targetLang = 'hi-IN';
    else if (language === 'ar') targetLang = 'ar-SA';

    utterance.lang = targetLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const exactVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());
    const matchingVoice = exactVoice || voices.find(v => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

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
          {assistant ? 'ADEM' : language === 'ar' ? 'أنت' : 'You'}
          <span>
            {new Date(message.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* User Attached Images Gallery */}
        {message.images && message.images.length > 0 && (
          <div className="my-2 flex flex-wrap gap-2">
            {message.images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setSelectedImage({
                    url: imgUrl,
                    alt: language === 'ar' ? `صورة مرفقة ${idx + 1}` : `Attached Image ${idx + 1}`,
                  })
                }
                className="group relative block overflow-hidden rounded-xl border border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface-2)] shadow-sm transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                title={language === 'ar' ? 'انقر لعرض الصورة' : 'Click to view image'}
              >
                <img
                  src={imgUrl}
                  alt={language === 'ar' ? `صورة مرفقة ${idx + 1}` : `Attached Image ${idx + 1}`}
                  className="max-h-52 max-w-xs object-cover rounded-xl"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

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

        {/* Dedicated App Launcher Card when app command is triggered */}
        {appLauncherData && (
          <AppLauncherCard
            data={appLauncherData}
            language={language}
            onNavigateView={onNavigateView}
            onOpenSandbox={onOpenSandbox}
          />
        )}

        {/* Dedicated Autonomous Agent Action Cards (Code execution, Terminal runner, Files, Tasks) */}
        {agentActions.map((action, idx) => (
          <AgentActionCard
            key={idx}
            action={action}
            language={language}
            onNavigateView={onNavigateView}
            onOpenSandbox={onOpenSandbox}
          />
        ))}

        {/* Dedicated Interactive Live App / Game Runner */}
        {assistant && appData && (
          <InteractiveAppCard
            code={appData.code}
            category={appData.isGameOrApp ? 'game' : 'app'}
            language={language}
            onOpenSandbox={handleLaunchSandbox}
            onNavigateView={onNavigateView}
          />
        )}

        {/* Dedicated Academic Intelligence Card (Formulas, Mistakes, Study Plans, Quizzes, Sources) */}
        {academicData && (
          <AcademicCard
            data={academicData}
            language={language}
            onNavigateView={onNavigateView}
          />
        )}

        {/* Dedicated Media Studio Card (Palettes, SVG Vectors, Prompts, 3D specs) */}
        {mediaData && (
          <MediaStudioCard
            payload={mediaData}
            language={language}
            onNavigateView={onNavigateView}
          />
        )}

        {/* Dedicated Cognitive IQ & Logic Reasoning Card */}
        {iqData && (
          <CognitiveIqCard
            payload={iqData}
            language={language}
            onNavigateView={onNavigateView}
          />
        )}

        {/* Dedicated Geospatial Intelligence & Navigation Card */}
        {geoData && (
          <GeospatialCard
            payload={geoData}
            language={language}
          />
        )}

        {/* Dedicated Interactive Task Matrix Card */}
        {taskData && (
          <InteractiveTaskCard
            payload={taskData}
            language={language}
            onNavigateView={onNavigateView}
          />
        )}

        {/* Dedicated Universal Translation Card */}
        {translationData && (
          <TranslationCard
            data={translationData}
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

        {/* Inline Live Translation Container */}
        {showInlineTranslation && (
          <div className="mt-2.5 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-500/20 text-[11px] font-bold text-emerald-400">
              <span className="flex items-center gap-1">
                <Languages size={13} />
                <span>{language === 'ar' ? 'الترجمة الفورية المباشرة:' : 'Instant Translation:'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowInlineTranslation(false)}
                className="hover:text-slate-200 text-slate-400 text-xs"
              >
                ✕
              </button>
            </div>
            {isTranslating ? (
              <div className="flex items-center gap-2 text-slate-400 py-1">
                <Loader2 size={13} className="animate-spin text-emerald-400" />
                <span>{language === 'ar' ? 'جاري الترجمة...' : 'Translating message...'}</span>
              </div>
            ) : (
              <div className="leading-relaxed select-text whitespace-pre-wrap font-normal">
                {inlineTranslation}
              </div>
            )}
          </div>
        )}

        {assistant && message.content && (
          <div className="flex items-center gap-1.5 mt-2">
            <button
              type="button"
              className={`message-action ${isSpeaking ? 'text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/30' : ''}`}
              onClick={toggleSpeak}
              aria-label={isSpeaking ? (language === 'ar' ? 'إيقاف القراءة الصوتية' : 'Stop speaking') : (language === 'ar' ? 'استماع بصوت فائق الدقة' : 'Read aloud')}
              title={isSpeaking ? (language === 'ar' ? 'إيقاف القراءة الصوتية' : 'Stop speaking') : (language === 'ar' ? 'قراءة صوتية ذكية متقنة لكافة اللغات واللهجات' : 'Read aloud with native accent')}
            >
              {isSpeaking ? <VolumeX size={13} className="text-amber-400 animate-pulse" /> : <Volume2 size={13} />}
            </button>
            <button className="message-action" onClick={copy} aria-label="Copy" title={language === 'ar' ? 'نسخ النص' : 'Copy'}>
              <Copy size={13} />
            </button>
            <button
              type="button"
              className={`message-action ${showInlineTranslation ? 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/30' : ''}`}
              onClick={async () => {
                if (showInlineTranslation) {
                  setShowInlineTranslation(false);
                  return;
                }
                setShowInlineTranslation(true);
                if (!inlineTranslation) {
                  setIsTranslating(true);
                  try {
                    const cleanText = (displayMarkdown || message.content).replace(/```[\s\S]*?```/g, '').trim();
                    const targetLang = language === 'ar' ? 'en' : 'ar';
                    const res = await requestTranslation({
                      text: cleanText.slice(0, 3000),
                      sourceLang: 'auto',
                      targetLang,
                      tone: 'general',
                    });
                    setInlineTranslation(res.translatedText);
                  } catch {
                    setInlineTranslation(language === 'ar' ? 'تعذرت الترجمة مؤقتاً' : 'Translation failed temporarily');
                  } finally {
                    setIsTranslating(false);
                  }
                }
              }}
              aria-label="Translate"
              title={language === 'ar' ? 'ترجمة الرسالة فورياً' : 'Instant translate message'}
            >
              <Languages size={13} />
            </button>
          </div>
        )}
      </div>

      <ImageViewerModal
        imageUrl={selectedImage?.url || null}
        altText={selectedImage?.alt}
        onClose={() => setSelectedImage(null)}
        language={language}
      />
    </motion.article>
  );
}

