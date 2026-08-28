import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  X,
  Sparkles,
  Globe,
  Radio,
  Zap,
  Download,
  Film,
  Wrench,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { FileAttachment } from '../types';
import { QuickTemplatesBar } from './QuickTemplatesBar';

interface InputBarProps {
  onSendMessage: (text: string, attachment?: FileAttachment) => void;
  isLoading: boolean;
  isArabic: boolean;
  agentName: string;
  webSearchEnabled: boolean;
  onToggleSearch: () => void;
  isContinuousListening: boolean;
  onToggleContinuousListening: () => void;
  onOpenVideoDownloader?: (url?: string) => void;
  onTriggerAutoHeal?: () => void;
  onNewChat?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  isLoading,
  isArabic,
  agentName,
  webSearchEnabled,
  onToggleSearch,
  isContinuousListening,
  onToggleContinuousListening,
  onOpenVideoDownloader,
  onTriggerAutoHeal,
  onNewChat,
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Speech Recognition if available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      const sysLang = typeof navigator !== 'undefined' ? navigator.language : (isArabic ? 'ar-SA' : 'en-US');
      recognition.lang = sysLang || (isArabic ? 'ar-SA' : 'en-US');

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [isArabic]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert(
        isArabic
          ? 'متصفحك لا يدعم خاصية التعرف الصوتي المباشر.'
          : 'Your browser does not support Speech Recognition.'
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Speech recognition error:', e);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachment({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const text = await file.text();
      setAttachment({
        name: file.name,
        type: file.type || 'text/plain',
        size: file.size,
        textContent: text,
      });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    onSendMessage(input, attachment);
    setInput('');
    setAttachment(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectTemplate = (templatePrompt: string) => {
    setInput((prev) => {
      if (!prev.trim()) {
        return templatePrompt;
      }
      return `${prev}\n\n${templatePrompt}`;
    });
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, 50);
  };

  return (
    <div className="sticky bottom-0 z-20 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 p-4 pt-2">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="font-semibold">{isArabic ? 'سيرفر فائق السرعة جاهز للرد الفوري' : 'Ultra-Fast Server Active & Ready'}</span>
          </div>
          {webSearchEnabled && (
            <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
              <Globe className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{isArabic ? 'البحث المباشر في الويب مفعل' : 'Live Search Enabled'}</span>
            </span>
          )}
        </div>

        {/* Quick Templates Bar */}
        <QuickTemplatesBar
          onSelectTemplate={handleSelectTemplate}
          isArabic={isArabic}
        />

        {/* File Attachment preview pill */}
        {attachment && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 animate-fade-in">
            <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
            <span className="truncate max-w-[200px]">{attachment.name}</span>
            <button
              onClick={() => setAttachment(undefined)}
              className="p-0.5 hover:text-rose-500 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Video Link Auto-Detector Banner */}
        {(() => {
          const videoMatch = input.match(
            /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|vimeo\.com|dailymotion\.com|rumble\.com)[^\s]+)/i
          );
          const url = videoMatch ? videoMatch[0] : null;
          if (url && onOpenVideoDownloader) {
            return (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-300 animate-fadeIn">
                <div className="flex items-center gap-2 truncate">
                  <Film className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate font-semibold">
                    {isArabic ? 'تم التعرف على رابط فيديو!' : 'Video URL Detected!'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenVideoDownloader(url)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'فتح محرك التحميل 📥' : 'Open Video Downloader 📥'}</span>
                </button>
              </div>
            );
          }
          return null;
        })()}

        {/* Input Box */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center gap-2 p-2 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-all"
        >
          {/* File input hidden */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.json,.md"
            className="hidden"
          />

          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:p-2.5 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
            title={isArabic ? 'إرفاق ملف أو صورة' : 'Attach File or Image'}
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Quick New Chat Button */}
          {onNewChat && (
            <button
              type="button"
              onClick={onNewChat}
              className="p-1.5 sm:p-2.5 rounded-2xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition shrink-0"
              title={isArabic ? 'بدء محادثة جديدة (Ctrl+N)' : 'Start New Chat (Ctrl+N)'}
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Web search toggle */}
          <button
            type="button"
            onClick={onToggleSearch}
            className={`p-1.5 sm:p-2.5 rounded-2xl transition shrink-0 ${
              webSearchEnabled
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={
              webSearchEnabled
                ? isArabic
                  ? 'بحث الويب مفعل'
                  : 'Web search active'
                : isArabic
                  ? 'تفعيل بحث الويب'
                  : 'Enable web search'
            }
          >
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Quick Auto-Healer & Error-Fix Tool Button */}
          {onTriggerAutoHeal && (
            <button
              type="button"
              onClick={onTriggerAutoHeal}
              className="p-1.5 sm:p-2.5 rounded-2xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500/30 transition shrink-0 group"
              title={
                isArabic
                  ? 'أداة الفحص والإصلاح الذاتي التلقائي للأخطاء 🛠️'
                  : 'Self-Heal & Auto-Fix All Errors 🛠️'
              }
            >
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-45 transition-transform" />
            </button>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isContinuousListening
                ? isArabic
                  ? 'وضع الاستماع المستمر نشط... اتكلم بأمرك تلقائياً دون لمس الشاشة'
                  : 'Continuous listening active... speak your command freely anytime'
                : isRecording
                ? isArabic
                  ? 'جاري الاستماع إليك الآن...'
                  : 'Listening to you now...'
                : isArabic
                  ? `اكتب أمرك أو سؤالك لـ ${agentName} هنا... (Shift + Enter لسطر جديد)`
                  : `Type your prompt for ${agentName}... (Shift + Enter for new line)`
            }
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none max-h-32 py-2 focus:outline-none"
          />

          {/* Continuous Voice Listening Mode Toggle */}
          <button
            type="button"
            onClick={onToggleContinuousListening}
            className={`p-1.5 sm:p-2.5 rounded-2xl transition shrink-0 ${
              isContinuousListening
                ? 'bg-emerald-600 text-white animate-pulse shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={
              isContinuousListening
                ? isArabic
                  ? 'إيقاف وضع الاستماع المستمر'
                  : 'Disable Continuous Listening'
                : isArabic
                ? 'تفعيل وضع الاستماع المستمر الأوتوماتيكي'
                : 'Enable Continuous Voice Command Listening'
            }
          >
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Single Mic Push-to-Talk Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-1.5 sm:p-2.5 rounded-2xl transition shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isArabic ? 'إدخال صوتي لمرة واحدة' : 'One-time Speech Input'}
          >
            {isRecording ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachment) || isLoading}
            className="p-2.5 sm:p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition shrink-0"
          >
            {isLoading ? (
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className={`w-4 h-4 sm:w-5 sm:h-5 ${isArabic ? 'rotate-180' : ''}`} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
