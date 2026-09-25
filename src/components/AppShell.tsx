import {
  PanelLeft,
  Settings2,
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

export function AppShell({
  activeView,
  language,
  agentName: _agentName,
  onViewChange,
  onNewChat,
  onToggleLanguage: _onToggleLanguage,
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
      {/* Top Navigation Bar - Ultra Minimalist & Clean */}
      <header className="navbar glass-panel shrink-0">
        {/* Left / Start: Sidebar Toggle Button + Brand */}
        <div className="navbar-start flex items-center gap-2">
          {/* Modern Sidebar Toggle Button */}
          <button
            type="button"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all border border-slate-700/60 cursor-pointer active:scale-95 shrink-0"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isAr ? 'الشريط الجانبي / المحادثات السابقة (Alt+B)' : 'Sidebar / Chat History (Alt+B)'}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft size={16} className={isAr ? 'rotate-180' : ''} />
          </button>

          {/* Brand Logo */}
          <button
            type="button"
            className="navbar-brand flex items-center"
            onClick={() => onViewChange('chat')}
            title="ADEM AI"
            aria-label="ADEM AI Home"
          >
            <BrandMark compact />
          </button>
        </div>

        {/* Center: Flexible Spacer */}
        <div className="navbar-center-wrapper flex-1" />

        {/* Right / End: ONLY the Settings option */}
        <div className="navbar-end flex items-center gap-2">
          <button
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 text-xs font-semibold ${
              activeView === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/70 hover:bg-slate-700 text-slate-200 border-slate-700/60 hover:border-slate-500'
            }`}
            onClick={() => onViewChange(activeView === 'settings' ? 'chat' : 'settings')}
            title={activeView === 'settings' ? (isAr ? 'الرجوع للمحادثة' : 'Back to Chat') : (isAr ? 'الإعدادات والخيارات' : 'Settings')}
            aria-label={t.nav.settings}
          >
            <Settings2 size={15} className={activeView === 'settings' ? 'text-cyan-400' : 'text-slate-300'} />
            <span>{activeView === 'settings' ? (isAr ? 'المحادثة' : 'Chat') : (isAr ? 'الإعدادات' : 'Settings')}</span>
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

        <main className="main-content flex-1 overflow-hidden relative">{children}</main>
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
