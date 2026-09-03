import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { Onboarding } from './features/onboarding/Onboarding';
import { Chat } from './features/chat/Chat';
import { Tasks } from './features/tasks/Tasks';
import { Memory } from './features/memory/Memory';
import { Settings } from './features/settings/Settings';
import { loadPreferences, savePreferences } from './core/storage';
import type { AppPreferences, ViewId } from './core/domain';

const DEFAULT_PREFERENCES: AppPreferences = { agentName: 'Adam', language: 'ar', theme: 'system', glassEnabled: false, onboardingComplete: false };
const workspaceCopy = { ar: { eyebrow:'ADAM / WORKSPACE', title:'مساحتك الذكية', sub:'مكان واحد للمحادثات والمهام والذاكرة.', chat:'ابدأ محادثة', tasks:'المهام', memory:'الذاكرة', status:'Adam جاهز' }, en: { eyebrow:'ADAM / WORKSPACE', title:'Your intelligent workspace', sub:'One calm place for conversations, tasks and memory.', chat:'Start a chat', tasks:'Tasks', memory:'Memory', status:'Adam is ready' } };

export default function App() {
 const [preferences, setPreferences] = useState<AppPreferences>(() => loadPreferences(DEFAULT_PREFERENCES));
 const [view, setView] = useState<ViewId>('chat');
 useEffect(() => { document.documentElement.lang = preferences.language; document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr'; document.documentElement.dataset.theme = preferences.theme; document.documentElement.dataset.glass = String(preferences.glassEnabled); }, [preferences.language, preferences.theme, preferences.glassEnabled]);
 const updatePreferences = (patch: Partial<AppPreferences>) => setPreferences(current => { const next = { ...current, ...patch }; savePreferences(next); return next; });
 const copy = useMemo(() => preferences.language === 'ar' ? { title:`مرحباً، أنا ${preferences.agentName}`, subtitle:'مساعدك الذكي — اسأل مباشرة ودع Adam يتولى الباقي.' } : { title:`Hi, I'm ${preferences.agentName}`, subtitle:'Your AI assistant — ask naturally and let Adam handle the rest.' }, [preferences.agentName, preferences.language]);
 if (!preferences.onboardingComplete) return <Onboarding initial={preferences} onComplete={next => updatePreferences({ ...next, onboardingComplete: true })}/>;
 const t = workspaceCopy[preferences.language];
 let content;
 if (view === 'chat') content = <Chat language={preferences.language} agentName={preferences.agentName} copy={copy}/>;
 else if (view === 'tasks') content = <Tasks language={preferences.language}/>;
 else if (view === 'memory') content = <Memory language={preferences.language}/>;
 else if (view === 'settings') content = <Settings language={preferences.language} preferences={preferences} onChange={updatePreferences}/>;
 else content = <section className="feature-page workspace-page"><div className="feature-heading"><div><span className="eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.sub}</p></div><span className="status-pill"><i/> {t.status}</span></div><div className="workspace-grid"><button className="workspace-card workspace-card--primary" onClick={() => setView('chat')}><span className="workspace-card-icon">✦</span><strong>{t.chat}</strong><small>{copy.subtitle}</small></button><button className="workspace-card" onClick={() => setView('tasks')}><span className="workspace-card-icon">✓</span><strong>{t.tasks}</strong><small>{preferences.language === 'ar' ? 'نظم ما يجب إنجازه.' : 'Organize what needs to happen.'}</small></button><button className="workspace-card" onClick={() => setView('memory')}><span className="workspace-card-icon">◉</span><strong>{t.memory}</strong><small>{preferences.language === 'ar' ? 'احتفظ بما يهمك مع Adam.' : 'Keep what matters available to Adam.'}</small></button></div></section>;
 return <AppShell activeView={view} language={preferences.language} agentName={preferences.agentName} onViewChange={setView}>{content}</AppShell>;
}
