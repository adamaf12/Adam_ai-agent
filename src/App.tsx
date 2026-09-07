import { useEffect, useMemo, useState } from 'react';
import type { AppPreferences, Language, ViewId } from './core/domain';
import { createNewConversation, loadPreferences, normalizePreferences, savePreferences } from './core/storage';
import { AppShell } from './components/AppShell';
import { Chat } from './features/chat/Chat';
import { Tasks } from './features/tasks/Tasks';
import { Memory } from './features/memory/Memory';
import { Settings } from './features/settings/Settings';
import { Workspace } from './features/workspace/Workspace';
import { MediaStudio } from './features/media/MediaStudio';
import { Onboarding } from './features/onboarding/Onboarding';

const DEFAULT_PREFERENCES: AppPreferences = {
  agentName: 'Adam',
  language: 'ar',
  theme: 'system',
  onboardingComplete: true,
};

export default function App() {
  const [preferences, setPreferences] = useState<AppPreferences>(() =>
    loadPreferences(DEFAULT_PREFERENCES)
  );
  const [activeView, setActiveView] = useState<ViewId>('chat');
  const [chatSessionKey, setChatSessionKey] = useState(1);

  const handleNewChat = () => {
    createNewConversation('', preferences.language);
    setChatSessionKey((prev) => prev + 1);
    setActiveView('chat');
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);
    root.setAttribute('dir', preferences.language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', preferences.language);

    if (preferences.theme === 'dark' || preferences.theme === 'glass-dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light' || preferences.theme === 'glass') {
      root.classList.remove('dark');
    } else if (preferences.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [preferences.theme, preferences.language]);

  const updatePreferences = (partial: Partial<AppPreferences>) => {
    setPreferences((prev) => {
      const next = normalizePreferences({ ...prev, ...partial });
      savePreferences(next);
      return next;
    });
  };

  const handleOnboardingComplete = (updatedPrefs: AppPreferences) => {
    const next = normalizePreferences({ ...updatedPrefs, onboardingComplete: true });
    setPreferences(next);
    savePreferences(next);
  };

  const heroCopy = useMemo(() => {
    return preferences.language === 'ar'
      ? {
          title: 'أهلاً بك، كيف يمكنني مساعدتك اليوم؟',
          subtitle: 'اسأل عن أي شيء، أنجز مهامك، أو ابدأ فكرة جديدة.',
        }
      : {
          title: 'Welcome, how can I help you today?',
          subtitle: 'Ask anything, organize your day, or spark a new idea.',
        };
  }, [preferences.language]);

  if (!preferences.onboardingComplete) {
    return <Onboarding initial={preferences} onComplete={handleOnboardingComplete} />;
  }

  return (
    <AppShell
      activeView={activeView}
      language={preferences.language}
      agentName={preferences.agentName}
      onViewChange={setActiveView}
      onNewChat={handleNewChat}
      onToggleLanguage={() =>
        updatePreferences({ language: preferences.language === 'ar' ? 'en' : 'ar' })
      }
    >
      {activeView === 'chat' && (
        <Chat
          key={`${preferences.language}-${preferences.agentName}-${chatSessionKey}`}
          language={preferences.language}
          agentName={preferences.agentName}
          copy={heroCopy}
          onNewChat={handleNewChat}
        />
      )}
      {activeView === 'tasks' && <Tasks language={preferences.language} />}
      {activeView === 'memory' && <Memory language={preferences.language} />}
      {activeView === 'workspace' && (
        <Workspace
          language={preferences.language}
          onNavigate={setActiveView}
          onSelectAction={() => setActiveView('chat')}
        />
      )}
      {activeView === 'media' && (
        <MediaStudio
          language={preferences.language}
          onNavigate={setActiveView}
          onRunPromptInChat={() => setActiveView('chat')}
        />
      )}
      {activeView === 'settings' && (
        <Settings
          language={preferences.language}
          preferences={preferences}
          onChange={updatePreferences}
        />
      )}
    </AppShell>
  );
}
