import {
  Film,
  Gamepad2,
  Languages,
  MessageSquare,
  PanelLeft,
  Plus,
  Radio,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { type ReactNode, useEffect, useState, useCallback } from 'react';
import type { ChatConversation, Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { Sidebar } from './Sidebar';
import { copy } from '../core/i18n';
import { LiveVoiceModal } from '../features/live/LiveVoiceModal';
import {
  loadAllConversations,
  loadConversation,
  deleteConversation,
  renameConversation,
  createNewConversation,
  setActiveConversationId,
} from '../core/storage';
import { getInfiniteMemoryStats } from '../core/agent/infiniteMemory';

interface AppShellProps {
  activeView: ViewId;
  language: Language;
  agentName: string;
  onViewChange: (view: ViewId) => void;
  onNewChat?: () => void;
  onToggleLanguage?: () => void;
  children: ReactNode;
  sessionTitle?: string;
  conversationCount?: number;
  onOpenSessionDrawer?: () => void;
}

const STUDIO_TABS: { id: ViewId; icon: typeof MessageSquare; labelAr: string; labelEn: string }[] = [
  { id: 'chat', icon: MessageSquare, labelAr: 'المحادثة', labelEn: 'Chat' },
  { id: 'apps', icon: Gamepad2, labelAr: 'التطبيقات', labelEn: 'Apps' },
  { id: 'media', icon: Film, labelAr: 'الاستوديو 8K', labelEn: '8K Media' },
  { id: 'translate', icon: Languages, labelAr: 'المترجم', labelEn: 'Translator' },
];

export function AppShell({
  activeView,
  language,
  agentName: _agentName,
  onViewChange,
  onNewChat,
  onToggleLanguage,
  children,
  sessionTitle: _sessionTitle,
  conversationCount: _conversationCount,
  onOpenSessionDrawer: _onOpenSessionDrawer,
}: AppShellProps) {
  const t = copy(language);
  const isAr = language === 'ar';
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>(() => loadAllConversations());
  const [activeConvId, setActiveConvId] = useState<string>(() => loadConversation().id);
  const [memoryStats, setMemoryStats] = useState(() => getInfiniteMemoryStats());

  const refreshConversations = useCallback(() => {
    setConversations(loadAllConversations());
    setActiveConvId(loadConversation().id);
    setMemoryStats(getInfiniteMemoryStats());
  }, []);

  // Listen for custom events
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('live') === '1') {
        setIsLiveVoiceOpen(true);
      }
    } catch {}

    const handleOpenLiveVoice = () => setIsLiveVoiceOpen(true);
    const handleOpenSidebar = () => setIsSidebarOpen(true);
    const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const handleRefreshConversations = () => refreshConversations();

    window.addEventListener('adam:open-live-voice' as any, handleOpenLiveVoice);
    window.addEventListener('adam:open-session-drawer' as any, handleOpenSidebar);
    window.addEventListener('adam:toggle-sidebar' as any, handleToggleSidebar);
    window.addEventListener('adam:refresh-conversations' as any, handleRefreshConversations);

    return () => {
      window.removeEventListener('adam:open-live-voice' as any, handleOpenLiveVoice);
      window.removeEventListener('adam:open-session-drawer' as any, handleOpenSidebar);
      window.removeEventListener('adam:toggle-sidebar' as any, handleToggleSidebar);
      window.removeEventListener('adam:refresh-conversations' as any, handleRefreshConversations);
    };
  }, [refreshConversations]);

  const handleStartNewChat = () => {
    createNewConversation('', language);
    refreshConversations();
    onViewChange('chat');
    onNewChat?.();
    window.dispatchEvent(new CustomEvent('adam:new-chat-triggered'));
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setActiveConvId(id);
    refreshConversations();
    onViewChange('chat');
    window.dispatchEvent(new CustomEvent('adam:select-conversation', { detail: { id } }));
  };

  const handleDeleteConversation = (id: string) => {
    const { remaining, nextActiveId } = deleteConversation(id);
    setConversations(remaining);
    setActiveConvId(nextActiveId);
    window.dispatchEvent(new CustomEvent('adam:select-conversation', { detail: { id: nextActiveId } }));
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConversation(id, newTitle);
    refreshConversations();
  };

  // Keyboard shortcut listener: Alt+1 / Alt+2 for fast navigation, Alt+B for sidebar toggle, Alt+N for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === '1') {
          e.preventDefault();
          onViewChange('chat');
        } else if (key === '2') {
          e.preventDefault();
          onViewChange('settings');
        } else if (key === 'b') {
          e.preventDefault();
          setIsSidebarOpen((prev) => !prev);
        } else if (key === 'n') {
          e.preventDefault();
          handleStartNewChat();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewChange]);

  return (
    <div className="app-shell flex flex-col h-screen overflow-hidden">
      {/* Top Organized Shelf Navigation Bar (الرف العلوي المنظم المتجاوب) */}
      <header className="flex items-center justify-between w-full px-2.5 sm:px-4 py-2 bg-[var(--surface)]/95 backdrop-blur-2xl border-b border-[var(--border)] z-30 shrink-0 select-none shadow-sm gap-2">
        {/* Start Section: Sidebar Toggle Button + Brand Mark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-all border border-[var(--border)] cursor-pointer active:scale-95 shrink-0 shadow-sm"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isAr ? 'المحادثات السابقة والذاكرة (Alt+B)' : 'Chat History & Memory (Alt+B)'}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft size={16} className={isAr ? 'rotate-180' : ''} />
          </button>

          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onViewChange('chat')}
            title="ADEM AI"
            aria-label="ADEM AI Home"
          >
            <BrandMark compact />
            <div className="hidden sm:flex flex-col text-start leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-wider text-[var(--text)] font-mono">ADEM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              </div>
              <span className="text-[9px] text-[var(--muted)] font-medium">
                {isAr ? 'المنظومة التنفيذية' : 'Executive OS'}
              </span>
            </div>
          </button>
        </div>

        {/* Center Section: Organized Studio Tabs Shelf (الرف الأوسط لتبديل الأدوات والاستوديوهات) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]/70 max-w-full">
          {STUDIO_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onViewChange(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[var(--accent)] text-slate-950 shadow-md shadow-[var(--accent-glow)] scale-[1.02]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`}
                title={isAr ? tab.labelAr : tab.labelEn}
              >
                <Icon size={14} className={isActive ? 'text-slate-950' : 'text-[var(--muted)]'} />
                <span className={isActive ? 'inline' : 'hidden md:inline'}>
                  {isAr ? tab.labelAr : tab.labelEn}
                </span>
              </button>
            );
          })}
        </nav>

        {/* End Section: Live Voice + New Chat + Language + Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Voice Call Trigger */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-400/50 transition-all cursor-pointer active:scale-95 text-xs font-semibold shadow-sm"
            onClick={() => setIsLiveVoiceOpen(true)}
            title={isAr ? 'مكالمة صوتية تفاعلية حية' : 'Interactive Live Voice Call'}
            aria-label="Live Voice"
          >
            <Radio size={14} className="text-emerald-400 animate-pulse" />
            <span className="hidden lg:inline">{isAr ? 'صوت مباشر' : 'Live Voice'}</span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--accent-subtle)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-slate-950 border border-[var(--accent)]/30 hover:border-transparent transition-all cursor-pointer active:scale-95 text-xs font-bold shadow-sm group"
            onClick={handleStartNewChat}
            title={isAr ? 'محادثة جديدة (Alt+N)' : 'New Chat (Alt+N)'}
            aria-label={isAr ? 'محادثة جديدة' : 'New Chat'}
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline">{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
          </button>

          {/* Language Toggle Button */}
          {onToggleLanguage && (
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-all border border-[var(--border)] cursor-pointer active:scale-95 text-xs font-bold font-mono shadow-sm"
              onClick={onToggleLanguage}
              title={isAr ? 'Switch to English' : 'التحويل للعربية'}
              aria-label="Toggle Language"
            >
              {isAr ? 'EN' : 'ع'}
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm ${
              activeView === 'settings'
                ? 'bg-[var(--accent)] text-slate-950 border-[var(--accent)] shadow-md shadow-[var(--accent-glow)]'
                : 'bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] border-[var(--border)]'
            }`}
            onClick={() => onViewChange(activeView === 'settings' ? 'chat' : 'settings')}
            title={activeView === 'settings' ? (isAr ? 'الرجوع للمحادثة' : 'Back to Chat') : (isAr ? 'الإعدادات والخيارات' : 'Settings')}
            aria-label={t.nav.settings}
          >
            <Settings2 size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Area with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          onClose={() => setIsSidebarOpen(false)}
          language={language}
          conversations={conversations}
          activeId={activeConvId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleStartNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onOpenSettings={() => onViewChange('settings')}
          memoryCount={memoryStats.total}
        />

        <main className="main-content flex-1 flex flex-col h-full overflow-hidden relative min-h-0">{children}</main>
      </div>

      {/* Real-time Voice Stream Modal (gemini-3.8-live) */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        language={language}
      />
    </div>
  );
}
