import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, X, Globe, Radio, Sparkles, Film, Download, MoreHorizontal } from 'lucide-react';
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
  onSendMessage, isLoading, isArabic, agentName, webSearchEnabled,
  onToggleSearch, isContinuousListening, onToggleContinuousListening,
  onOpenVideoDownloader, onTriggerAutoHeal, onNewChat,
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment>();
  const [isRecording, setIsRecording] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = isArabic ? 'ar-DZ' : 'en-US';
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setInput(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, [isArabic]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) recognitionRef.current.stop();
    else { try { recognitionRef.current.start(); setIsRecording(true); } catch {} }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setAttachment({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result as string });
      reader.readAsDataURL(file);
    } else {
      setAttachment({ name: file.name, type: file.type || 'text/plain', size: file.size, textContent: await file.text() });
    }
    e.target.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;
    onSendMessage(input.trim(), attachment);
    setInput('');
    setAttachment(undefined);
    setShowTools(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const videoMatch = input.match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|vimeo\.com|dailymotion\.com|rumble\.com)[^\s]+)/i);

  return (
    <div className="sticky bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
      <div className="max-w-4xl mx-auto">
        {attachment && (
          <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200">
            <Paperclip className="h-4 w-4 text-emerald-400 shrink-0" /><span className="truncate">{attachment.name}</span>
            <button type="button" onClick={() => setAttachment(undefined)} className="rounded-lg p-1 hover:bg-slate-800"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        {videoMatch && onOpenVideoDownloader && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <span className="flex min-w-0 items-center gap-2 truncate"><Film className="h-4 w-4 shrink-0" />{isArabic ? 'رابط فيديو مكتشف' : 'Video link detected'}</span>
            <button type="button" onClick={() => onOpenVideoDownloader(videoMatch[0])} className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1.5 font-bold text-white"><Download className="inline h-3.5 w-3.5 mr-1" />{isArabic ? 'فتح' : 'Open'}</button>
          </div>
        )}
        <QuickTemplatesBar onSelectTemplate={(prompt) => setInput((v) => v ? `${v}\n\n${prompt}` : prompt)} isArabic={isArabic} />
        <form onSubmit={handleSubmit} className="mt-2 rounded-[1.6rem] border border-slate-700/80 bg-slate-900/95 p-2 shadow-xl backdrop-blur-xl focus-within:border-emerald-500/70">
          <div className="flex items-end gap-1.5">
            <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*,.pdf,.txt,.json,.md" className="hidden" />
            <button type="button" onClick={() => setShowTools(v => !v)} className={`rounded-2xl p-3 transition ${showTools ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title={isArabic ? 'المزيد من الأدوات' : 'More tools'}><MoreHorizontal className="h-5 w-5" /></button>
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder={isRecording ? (isArabic ? 'أستمع إليك…' : 'Listening…') : (isArabic ? `اكتب لـ ${agentName}…` : `Message ${agentName}…`)} className="min-h-12 max-h-36 flex-1 resize-none bg-transparent px-2 py-3 text-[15px] leading-6 text-white outline-none placeholder:text-slate-500" />
            <button type="button" onClick={toggleRecording} className={`rounded-2xl p-3 transition ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} title={isArabic ? 'إملاء صوتي' : 'Voice input'}>{isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
            <button type="submit" disabled={(!input.trim() && !attachment) || isLoading} className="rounded-2xl bg-emerald-500 p-3 text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-40" title={isArabic ? 'إرسال' : 'Send'}><Send className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''}`} /></button>
          </div>
          {showTools && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"><Paperclip className="inline h-4 w-4 mr-1.5" />{isArabic ? 'ملف' : 'File'}</button>
              <button type="button" onClick={onToggleSearch} className={`rounded-xl px-3 py-2 text-xs font-semibold ${webSearchEnabled ? 'bg-blue-500/15 text-blue-300' : 'text-slate-300 hover:bg-slate-800'}`}><Globe className="inline h-4 w-4 mr-1.5" />{isArabic ? 'بحث الويب' : 'Web search'}</button>
              <button type="button" onClick={onToggleContinuousListening} className={`rounded-xl px-3 py-2 text-xs font-semibold ${isContinuousListening ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}><Radio className="inline h-4 w-4 mr-1.5" />{isArabic ? 'استماع مستمر' : 'Continuous voice'}</button>
              {onTriggerAutoHeal && <button type="button" onClick={onTriggerAutoHeal} className="rounded-xl px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-slate-800"><Sparkles className="inline h-4 w-4 mr-1.5" />{isArabic ? 'إصلاح' : 'Heal'}</button>}
              {onNewChat && <button type="button" onClick={onNewChat} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">{isArabic ? 'محادثة جديدة' : 'New chat'}</button>}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
