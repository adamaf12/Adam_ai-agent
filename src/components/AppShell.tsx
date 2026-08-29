import { PanelLeft, Plus, SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
import { copy } from '../core/i18n';

export function AppShell({ activeView, language, agentName, onViewChange, children }: { activeView: ViewId; language: Language; agentName: string; onViewChange: (view: ViewId) => void; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = copy(language);
  return <div className="app-shell">
    <header className="topbar"><button className="icon-button mobile-only" onClick={() => setSidebarOpen((v) => !v)} aria-label="Open navigation"><PanelLeft size={20} /></button><BrandMark compact /><div className="topbar-spacer" /><span className="status-pill"><i /> {t.online}</span><button className="icon-button" onClick={() => onViewChange('settings')} aria-label={t.nav.settings}><SlidersHorizontal size={19} /></button></header>
    <aside className={sidebarOpen ? 'sidebar sidebar--open' : 'sidebar'}><BrandMark /><button className="new-chat" onClick={() => onViewChange('chat')}><Plus size={17} />{t.newChat}</button><div className="sidebar-caption">{language === 'ar' ? 'المساحة الشخصية' : 'Personal workspace'}</div><div className="profile-card"><div className="avatar">{agentName.slice(0, 1).toUpperCase()}</div><div><strong>{agentName}</strong><span>{language === 'ar' ? 'وكيلك الذكي' : 'Your AI agent'}</span></div></div></aside>
    <main className="main-content">{children}</main>
    <BottomNav active={activeView} language={language} onChange={onViewChange} />
  </div>;
}
