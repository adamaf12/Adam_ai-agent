import { useState } from 'react';
import { 
  Check, 
  Code2, 
  Copy, 
  Download, 
  FileCode, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  ExternalLink,
  Cpu
} from 'lucide-react';
import type { AgentActionData } from '../../core/agent/ademDuoAutonomousAgent';
import { executeCodeInBrowser, executeTerminalCommand } from '../../core/agent/ademDuoAutonomousAgent';
import { loadTasks, saveTasks } from '../../core/storage/collections';
import type { ViewId } from '../../core/domain';
import { InteractiveAppCard } from './InteractiveAppCard';

interface AgentActionCardProps {
  action: AgentActionData;
  language: 'ar' | 'en';
  onNavigateView?: (view: ViewId, extraParam?: string) => void;
  onOpenSandbox?: (appId: string) => void;
}

export function AgentActionCard({
  action,
  language,
  onNavigateView,
  onOpenSandbox,
}: AgentActionCardProps) {
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);
  const [isReRunning, setIsReRunning] = useState(false);
  const [dynamicPayload, setDynamicPayload] = useState(action.payload);
  const [taskCompleted, setTaskCompleted] = useState(
    action.payload.type === 'task_created' ? action.payload.data.task.completed : false
  );

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Re-run code
  const handleReRunCode = () => {
    if (dynamicPayload.type !== 'code_exec') return;
    setIsReRunning(true);
    setTimeout(() => {
      const newResult = executeCodeInBrowser(dynamicPayload.data.code);
      setDynamicPayload({ type: 'code_exec', data: newResult });
      setIsReRunning(false);
    }, 200);
  };

  // Re-execute terminal command
  const handleReRunTerminal = () => {
    if (dynamicPayload.type !== 'terminal_command') return;
    setIsReRunning(true);
    setTimeout(() => {
      const newResult = executeTerminalCommand(dynamicPayload.data.command, dynamicPayload.data.cwd);
      setDynamicPayload({ type: 'terminal_command', data: newResult });
      setIsReRunning(false);
    }, 200);
  };

  // Toggle task completion
  const handleToggleTask = () => {
    if (dynamicPayload.type !== 'task_created') return;
    const currentTasks = loadTasks();
    const targetId = dynamicPayload.data.task.id;
    const nextCompleted = !taskCompleted;
    setTaskCompleted(nextCompleted);

    const updated = currentTasks.map((t) =>
      t.id === targetId ? { ...t, completed: nextCompleted, updatedAt: Date.now() } : t
    );
    saveTasks(updated);
  };

  // Trigger file download
  const handleDownloadFile = () => {
    if (dynamicPayload.type !== 'file_created') return;
    const a = document.createElement('a');
    a.href = dynamicPayload.data.downloadUrl;
    a.download = dynamicPayload.data.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="my-3 rounded-2xl border border-emerald-500/40 bg-slate-950/90 shadow-xl overflow-hidden backdrop-blur-md transition-all">
      {/* Header bar: ADEM Autonomous Execution Seal */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-b border-emerald-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Cpu size={14} className="animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>{action.title}</span>
            </span>
            <div className="text-[10px] text-emerald-400/90 flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>
                {isAr
                  ? 'صلاحيات تنفيذ كاملة (Root / Unrestricted) • نظام ADEM'
                  : 'Full Root Authority Granted • ADEM System'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] bg-slate-900/90 px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{isAr ? 'محرك التنفيذ المباشر' : 'Executive Engine'}</span>
        </div>
      </div>

      {/* Card Content based on action type */}
      <div className="p-4 space-y-3">
        {/* 1. CODE EXECUTION */}
        {dynamicPayload.type === 'code_exec' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-mono">
                <Code2 size={13} className="text-emerald-400" />
                <span>JavaScript / TypeScript Runtime</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {dynamicPayload.data.executionTimeMs}ms • {dynamicPayload.data.success ? (isAr ? 'تم بنجاح ✓' : 'Success ✓') : (isAr ? 'خطأ ✗' : 'Error ✗')}
              </span>
            </div>

            {/* Code container */}
            <div className="relative rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-xs text-slate-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => copyText(dynamicPayload.data.code)}
                className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title={isAr ? 'نسخ الكود' : 'Copy code'}
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
              <pre className="pr-8 rtl:pr-0 rtl:pl-8 whitespace-pre-wrap">{dynamicPayload.data.code}</pre>
            </div>

            {/* Output terminal */}
            <div className="rounded-xl bg-black/80 border border-slate-800/80 p-3 font-mono text-xs">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
                <span>{isAr ? '⚡ مخرجات التنفيذ المباشرة (Stdout & Return)' : '⚡ Live Console Output'}</span>
                <span className="text-emerald-400">Exit 0</span>
              </div>
              <div className="text-emerald-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {dynamicPayload.data.output || (isAr ? 'لا توجد مخرجات نصية.' : 'No textual output.')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleReRunCode}
                disabled={isReRunning}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw size={12} className={isReRunning ? 'animate-spin' : ''} />
                <span>{isAr ? 'إعادة التشغيل والتنفيذ' : 'Run Again'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. TERMINAL COMMAND */}
        {dynamicPayload.type === 'terminal_command' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-mono">
                <Terminal size={14} className="text-emerald-400" />
                <span>adem@system:{dynamicPayload.data.cwd}$</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                Exit {dynamicPayload.data.exitCode} ({dynamicPayload.data.executionTimeMs}ms)
              </span>
            </div>

            {/* Terminal Box */}
            <div className="rounded-xl bg-black border border-slate-800 p-3.5 font-mono text-xs text-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span className="text-[11px] text-slate-400 ml-2 font-mono">bash (Linux/Android)</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(dynamicPayload.data.command)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                  title={isAr ? 'نسخ الأمر' : 'Copy command'}
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>

              <div className="text-emerald-400 font-semibold mb-2">
                $ {dynamicPayload.data.command}
              </div>

              <div className="text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed border-t border-slate-900 pt-2 text-[11px]">
                {dynamicPayload.data.output}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px]">
                {isAr ? 'نظام التشغيل الهدف:' : 'Target:'} <strong className="text-slate-200 uppercase">{dynamicPayload.data.systemTarget}</strong>
              </span>
              <button
                type="button"
                onClick={handleReRunTerminal}
                disabled={isReRunning}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw size={12} className={isReRunning ? 'animate-spin' : ''} />
                <span>{isAr ? 'إعادة تنفيذ الأمر' : 'Re-execute'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. FILE CREATION */}
        {dynamicPayload.type === 'file_created' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FileCode size={22} />
                </div>
                <div>
                  <div className="font-mono text-sm font-bold text-slate-100">
                    {dynamicPayload.data.fileName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {(dynamicPayload.data.sizeBytes / 1024).toFixed(2)} KB • {dynamicPayload.data.fileType}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadFile}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Download size={14} />
                <span>{isAr ? 'تنزيل الملف 💾' : 'Download 💾'}</span>
              </button>
            </div>

            {/* Content Preview */}
            <div className="rounded-xl bg-black/60 border border-slate-800/80 p-3 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{dynamicPayload.data.content}</pre>
            </div>
          </div>
        )}

        {/* 4. TASK CREATION */}
        {dynamicPayload.type === 'task_created' && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleTask}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    taskCompleted
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-700 bg-slate-800 hover:border-emerald-500 text-transparent'
                  }`}
                >
                  <Check size={14} className={taskCompleted ? 'block' : 'opacity-0'} />
                </button>
                <div>
                  <div className={`text-xs font-bold text-slate-100 ${taskCompleted ? 'line-through text-slate-400' : ''}`}>
                    {dynamicPayload.data.task.title}
                  </div>
                  {dynamicPayload.data.task.notes && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {dynamicPayload.data.task.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {dynamicPayload.data.task.priority}
                </span>
                {onNavigateView && (
                  <button
                    type="button"
                    onClick={() => onNavigateView('tasks')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                    title={isAr ? 'فتح قائمة المهام' : 'Open Tasks'}
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. SANDBOX APP */}
        {dynamicPayload.type === 'sandbox_app' && (
          <InteractiveAppCard
            title={dynamicPayload.data.title}
            code={dynamicPayload.data.code}
            category={dynamicPayload.data.category}
            language={language}
            appId={dynamicPayload.data.appId}
            onOpenSandbox={onOpenSandbox}
            onNavigateView={onNavigateView}
          />
        )}
      </div>
    </div>
  );
}
