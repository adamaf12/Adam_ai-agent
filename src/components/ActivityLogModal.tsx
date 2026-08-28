import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trash2,
  X,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ActivityLogEntry } from '../types';
import { clearActivityLogs, loadActivityLogs, undoActivityLog } from '../lib/storage';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  onDataChanged?: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  onDataChanged,
}) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>(loadActivityLogs());
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUndo = (logId: string) => {
    const success = undoActivityLog(logId);
    if (success) {
      setLogs(loadActivityLogs());
      showToast(isArabic ? 'تم التراجع عن الإجراء بنجاح ✅' : 'Action undone successfully ✅');
      if (onDataChanged) onDataChanged();
    } else {
      showToast(isArabic ? 'تعذر التراجع عن هذا الإجراء' : 'Could not undo this action');
    }
  };

  const handleClearLogs = () => {
    if (confirm(isArabic ? 'هل انت مقتنع بتفريغ سجل النشاطات بالكامل؟' : 'Are you sure you want to clear the activity log?')) {
      clearActivityLogs();
      setLogs([]);
      showToast(isArabic ? 'تم تفريغ السجل بالكامل' : 'Activity log cleared');
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.displayNameAr.toLowerCase().includes(search.toLowerCase()) ||
      l.displayNameEn.toLowerCase().includes(search.toLowerCase()) ||
      l.actionSummaryAr.toLowerCase().includes(search.toLowerCase()) ||
      l.actionSummaryEn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{isArabic ? 'سجل النشاط والعمليات التلقائية' : 'Autonomous Activity & Action Log'}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {logs.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isArabic
                  ? 'سجل شفاف بكل الإجراءات المنفذة تلقائياً مع إمكانية التراجع'
                  : 'Transparent log of all executed tools with one-click undo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions toolbar */}
        <div className="px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isArabic ? 'البحث في السجل...' : 'Search activity logs...'}
              className="w-full pr-9 pl-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isArabic ? 'مسح السجل' : 'Clear Log'}</span>
            </button>
          )}
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 theme-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium">
                {isArabic ? 'لا توجد إجراءات مسجلة حالياً' : 'No activity logs recorded yet'}
              </p>
              <p className="text-xs mt-1">
                {isArabic
                  ? 'عندما ينفذ الوكيل أي عملية (مثل حفظ ملاحظة، موعد، تذكير) ستظهر هنا فوراً'
                  : 'Actions executed by Adam will appear here in real-time'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-2xl border transition-all ${
                  log.undone
                    ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {isArabic ? log.displayNameAr : log.displayNameEn}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {isArabic ? log.actionSummaryAr : log.actionSummaryEn}
                      </p>
                    </div>
                  </div>

                  {/* Undo Button */}
                  {log.isUndoable && (
                    <div>
                      {log.undone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-700/60 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {isArabic ? 'تم التراجع' : 'Undone'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUndo(log.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 rounded-xl transition shadow-2xs"
                          title={isArabic ? 'التراجع عن هذا الإجراء' : 'Undo action'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'تراجع' : 'Undo'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
