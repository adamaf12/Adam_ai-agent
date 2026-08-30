import { Menu, Plus, Settings2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Language, ViewId } from '../core/domain';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
import { copy } from '../core/i18n';

export function AppShell({ activeView, language, agentName, onViewChange, children }: { activeView: ViewId; language: Language; agentName: string; onViewChange: (view: ViewId) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const t = copy(language);
  const navigate = (view: ViewId) => { onViewChange(view); setOpen(false); };
  return <div className="app-shell">
    <header className="topbar glass-panel">
      <button className="icon-button mobile-only" onClick={() => setOpen(v => !v)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X size={20}/> : <Menu size={20}/>}</button>
      <button className="mobile-brand" onClick={() => navigate('chat')}><BrandMark compact /></button>
      <div className="topbar-spacer" />
      <span className="status-pill"><i /> {t.online}</span>
      <button className="icon-button" onClick={() => navigate('settings')} aria-label={t.nav.settings}><Settings2 size={18}/></button>
    </header>
    <aside className={open ? 'sidebar sidebar--open glass-panel' : 'sidebar glass-panel'}>
      <BrandMark />
      <button className="new-chat" onClick={() => navigate('chat')}><Plus size={17}/>{t.newChat}</button>
      <div className="sidebar-caption">{language === 'ar' ? 'مساحتك' : 'Your space'}</div>
      <button className="profile-card" onClick={() => navigate('chat')}><div className="avatar">{agentName.slice(0,1).toUpperCase()}</div><div><strong>{agentName}</strong><span>{language === 'ar' ? 'مساعدك الذكي' : 'Your AI assistant'}</span></div></button>
    </aside>
    <main className="main-content">{children}</main>
    <BottomNav active={activeView} language={language} onChange={navigate} />
  </div>;
}
