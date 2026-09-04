import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  X,
  Sparkles,
  FileText,
} from 'lucide-react';
import { FileAttachment } from '../types';

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
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
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

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    }
  }, [isArabic]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
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

  return (
    <div className="sticky bottom-0 z-20 pb-4 pt-2 px-3 sm:px-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        {/* Apple iOS Floating Glass Dock */}
        <div className="ios-glass-dock rounded-[32px] p-2 sm:p-2.5 shadow-xl transition-all duration-300 flex flex-col gap-1.5">
          {/* Attachment Preview (if any) */}
          {attachment && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/5 dark:bg-white/10 w-fit text-xs font-medium text-slate-700 dark:text-slate-200 animate-fadeIn">
              {attachment.dataUrl ? (
                <img
                  src={attachment.dataUrl}
                  alt="Attachment"
                  className="w-5 h-5 rounded-md object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-blue-500" />
              )}
              <span className="truncate max-w-[180px] sm:max-w-[260px]">{attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(undefined)}
                className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Input Row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1 sm:gap-2">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.txt,.json,.md"
              className="hidden"
            />

            {/* Apple iOS + Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0 ios-btn"
              title={isArabic ? 'إرفاق صورة أو مستند' : 'Attach File or Image'}
            >
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Web Search Globe Toggle */}
            <button
              type="button"
              onClick={onToggleSearch}
              className={`p-2 sm:p-2.5 rounded-full transition shrink-0 ios-btn ${
                webSearchEnabled
                  ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={
                webSearchEnabled
                  ? isArabic ? 'البحث في الويب مفعل' : 'Web search enabled'
                  : isArabic ? 'تفعيل البحث في الويب' : 'Enable web search'
              }
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Textarea Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isRecording
                  ? isArabic ? 'جاري الاستماع...' : 'Listening...'
                  : isArabic ? `اكتب أو اطلب أي شيء من ${agentName}...` : `Message ${agentName}...`
              }
              rows={1}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none max-h-32 py-1.5 px-2 focus:outline-none leading-relaxed"
            />

            {/* Voice Dictation (Mic) */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 sm:p-2.5 rounded-full transition shrink-0 ios-btn ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={isArabic ? 'إملاء صوتي' : 'Voice Dictation'}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Apple iOS Blue Upward Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || isLoading}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center transition shadow-xs shrink-0 ios-btn"
              title={isArabic ? 'إرسال' : 'Send'}
            >
              {isLoading ? (
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
