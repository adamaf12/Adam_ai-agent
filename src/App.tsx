import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { Onboarding } from './features/onboarding/Onboarding';
import { Chat } from './features/chat/Chat';
import { loadPreferences, savePreferences } from './core/storage';
import type { AppPreferences, Language, ViewId } from './core/domain';

const DEFAULT_PREFERENCES: AppPreferences = {
  agentName: 'Adam',
  language: 'ar',
  theme: 'system',
  onboardingComplete: false,
};

export default function App() {
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadPreferences(DEFAULT_PREFERENCES));
  const [view, setView] = useState<ViewId>('chat');

  useEffect(() => {
    document.documentElement.lang = preferences.language;
    document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = preferences.theme;
  }, [preferences.language, preferences.theme]);

  const updatePreferences = (patch: Partial<AppPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      savePreferences(next);
      return next;
    });
  };

  const copy = useMemo(() => preferences.language === 'ar' ? {
    title: `مرحباً، أنا ${preferences.agentName}`,
    subtitle: 'مساعدك الشخصي الذكي — سريع، هادئ، ويفهم السياق.',
  } : {
    title: `Hi, I'm ${preferences.agentName}`,
    subtitle: 'Your personal AI — fast, calm, and context-aware.',
  }, [preferences.agentName, preferences.language]);

  if (!preferences.onboardingComplete) {
    return <Onboarding initial={preferences} onComplete={(next) => updatePreferences({ ...next, onboardingComplete: true })} />;
  }

  const content = view === 'chat'
    ? <Chat language={preferences.language} agentName={preferences.agentName} copy={copy} />
    : <section className="placeholder-panel"><span className="eyebrow">{view.toUpperCase()}</span><h2>{preferences.language === 'ar' ? 'هذه المساحة قيد البناء بعناية.' : 'This space is being built carefully.'}</h2><p>{preferences.language === 'ar' ? 'لن نضع وظائف وهمية هنا. كل وحدة ستصل مكتملة ومترابطة.' : 'No fake functionality here. Each module will arrive complete and connected.'}</p></section>;

  return <AppShell activeView={view} language={preferences.language} agentName={preferences.agentName} onViewChange={setView}>{content}</AppShell>;
}
