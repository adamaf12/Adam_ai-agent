import React from 'react';
import {
  Calendar,
  Mail,
  Sparkles,
  Zap,
  HardDrive,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { Language, ViewId } from '../../core/domain';
import { useAuth } from '../../core/auth/AuthContext';
import { GoogleWorkspaceIntegration } from './GoogleWorkspaceIntegration';

interface WorkspaceProps {
  language: Language;
  onSelectAction?: (prompt: string) => void;
  onNavigate?: (view: ViewId) => void;
}

const c = {
  ar: {
    badge: 'مساحة العمل التنفيذية',
    title: 'Google Workspace',
    subtitle: 'بيئة موحدة لإدارة البريد، التقويم، الملفات، المستندات، والمهام بكل سهولة وسرعة.',
    quickShortcutsTitle: 'إجراءات سريعة:',
    quick1: 'فحص وتلخيص ملفات Drive',
    quick2: 'مراجعة جدول مواعيد اليوم',
    quick3: 'صياغة بريد تنفيذي عبر آدم',
    autoSyncBadge: 'مزامنة نشطة 100%',
  },
  en: {
    badge: 'Executive Workspace',
    title: 'Google Workspace',
    subtitle: 'Unified workspace to manage your email, calendar, files, documents, and tasks effortlessly.',
    quickShortcutsTitle: 'Quick Actions:',
    quick1: 'Inspect & summarize Drive files',
    quick2: 'Review today\'s schedule',
    quick3: 'Draft executive email with Adam',
    autoSyncBadge: '100% Synced',
  },
};

export function Workspace({ language, onSelectAction, onNavigate }: WorkspaceProps) {
  const t = c[language];
  const isAr = language === 'ar';
  const { user } = useAuth();

  const handleShortcut = (prompt: string) => {
    if (onSelectAction) {
      onSelectAction(prompt);
    } else if (onNavigate) {
      onNavigate('chat');
    }
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6 space-y-5 select-none h-full overflow-y-auto pb-24 md:pb-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[11px] font-bold font-mono border border-[var(--border)]">
              <Zap size={12} />
              {t.badge}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.autoSyncBadge}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* User Account Info Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] self-start sm:self-auto">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-7 h-7 rounded-xl object-cover border border-[var(--border)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-black flex items-center justify-center">
              {user?.displayName?.charAt(0) || 'M'}
            </div>
          )}
          <div className="min-w-0 pr-1">
            <span className="text-xs font-bold text-[var(--text)] block truncate max-w-[160px]">
              {user?.displayName || (isAr ? 'حساب المستخدم' : 'User Account')}
            </span>
            {user?.email && (
              <span className="text-[10px] text-[var(--muted)] font-mono block truncate max-w-[160px]">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Chips (Distraction-Free Minimalist Bar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-[var(--muted)] flex-shrink-0 flex items-center gap-1 pl-1">
          <Sparkles size={13} className="text-[var(--accent)]" />
          <span>{t.quickShortcutsTitle}</span>
        </span>
        <button
          type="button"
          onClick={() => handleShortcut(isAr ? 'افحص أحدث الملفات في Google Drive وأعطني تقريراً تحليلياً.' : 'Inspect recent Google Drive files and summarize them.')}
          className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <HardDrive size={13} className="text-amber-400" />
          <span>{t.quick1}</span>
        </button>

        <button
          type="button"
          onClick={() => handleShortcut(isAr ? 'لخص جدول أعمال اليوم والمواعيد القادمة في Google Calendar.' : 'Summarize today\'s schedule in Google Calendar.')}
          className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <Calendar size={13} className="text-blue-400" />
          <span>{t.quick2}</span>
        </button>

        <button
          type="button"
          onClick={() => handleShortcut(isAr ? 'ساعدني في صياغة وإرسال بريد إلكتروني تنفيذي عبر Gmail.' : 'Help me draft an executive email via Gmail.')}
          className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
        >
          <Mail size={13} className="text-rose-400" />
          <span>{t.quick3}</span>
        </button>
      </div>

      {/* Main Workspace Suite */}
      <div>
        <GoogleWorkspaceIntegration language={language} />
      </div>
    </section>
  );
}
