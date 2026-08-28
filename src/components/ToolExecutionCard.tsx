import React from 'react';
import {
  Globe,
  Calendar as CalendarIcon,
  Bell,
  Calculator,
  FileText,
  Brain,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Send,
  Mail,
  ShieldCheck,
  Radio,
  Sparkles,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { ToolExecution } from '../types';
import { downloadImageAsPng } from '../lib/imageUtils';

interface ToolExecutionCardProps {
  tool: ToolExecution;
  isArabic: boolean;
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({ tool, isArabic }) => {
  const getToolIcon = () => {
    switch (tool.toolName) {
      case 'web_search':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'calendar_tool':
        return <CalendarIcon className="w-4 h-4 text-emerald-500" />;
      case 'reminder_tool':
        return <Bell className="w-4 h-4 text-amber-500" />;
      case 'calculator_tool':
        return <Calculator className="w-4 h-4 text-purple-500" />;
      case 'note_tool':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'remember_fact':
        return <Brain className="w-4 h-4 text-pink-500" />;
      case 'open_app_or_url':
        return <ExternalLink className="w-4 h-4 text-cyan-500" />;
      case 'social_messaging_tool':
        return <Send className="w-4 h-4 text-teal-500" />;
      case 'email_monitor_tool':
        return <Radio className="w-4 h-4 text-red-500" />;
      case 'media_generator':
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-teal-500" />;
    }
  };

  const toolOutput = tool.output && typeof tool.output === 'object' ? tool.output : null;
  const appScheme = toolOutput?.appScheme || toolOutput?.appDeepLink;
  const webUrl =
    toolOutput?.webUrl ||
    toolOutput?.webFallbackUrl ||
    (toolOutput?.url && toolOutput.url.startsWith('http') ? toolOutput.url : null) ||
    tool.input?.url;
  const appNameAr = toolOutput?.appNameAr || toolOutput?.platform || 'التطبيق';
  const mediaUrl = toolOutput?.mediaUrl;

  return (
    <div className="my-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">{getToolIcon()}</div>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {tool.displayName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isArabic ? 'تم التنفيذ' : 'Executed'}</span>
        </div>
      </div>

      {tool.input && Object.keys(tool.input).length > 0 && (
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto">
          {Object.entries(tool.input).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-slate-400 font-semibold">{k}:</span>
              <span className="truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Render Generated / Edited Image or Grok Video if output from media_generator */}
      {mediaUrl && (
        <div className="p-2.5 rounded-2xl bg-slate-950 text-white space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-cyan-400 flex items-center gap-1">
              {toolOutput?.type === 'video' || tool.input?.mediaType === 'video' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>{isArabic ? 'فيديو جروك السينمائي ⚡' : 'Grok Video AI ⚡'}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isArabic ? 'نانو بنانة برو الأصلي 🍌⚡' : 'Nano Banana Pro AI 🍌⚡'}</span>
                </>
              )}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
              {toolOutput?.type === 'video' || tool.input?.mediaType === 'video' ? '8K 60FPS IMAX' : 'High Quality PNG'}
            </span>
          </div>

          <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-black/40">
            <img
              src={mediaUrl}
              alt={toolOutput?.prompt || tool.input?.prompt || 'Generated Media'}
              referrerPolicy="no-referrer"
              className="w-full max-h-80 object-contain rounded-xl transition duration-300 group-hover:scale-105"
            />
            {(toolOutput?.type === 'video' || tool.input?.mediaType === 'video') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition">
                <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400 line-clamp-1 italic">
              "{toolOutput?.prompt || tool.input?.prompt}"
            </p>
            <button
              onClick={() => downloadImageAsPng(mediaUrl, `adam_media_${Date.now()}`)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تحميل 📥' : 'Download 📥'}</span>
            </button>
          </div>
        </div>
      )}

      {(appScheme || webUrl) && (
        <div className="pt-1 flex flex-wrap gap-2">
          {appScheme && (
            <a
              href={appScheme}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-xs transition-all transform active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isArabic ? `📱 فتح تطبيق ${appNameAr} المباشر` : `📱 Open Installed ${appNameAr}`}</span>
            </a>
          )}
          {webUrl && (
            <a
              href={webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-xs transition-all transform active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isArabic ? `🌐 فتح الرابط / الموقع الإلكتروني` : `🌐 Open Website / Link`}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
