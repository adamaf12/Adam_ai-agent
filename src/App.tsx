import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppPreferences, Language, ViewId } from './core/domain';
import { createNewConversation, loadPreferences, normalizePreferences, savePreferences } from './core/storage';
import { AppShell } from './components/AppShell';
import { Chat } from './features/chat/Chat';
import { Tasks } from './features/tasks/Tasks';
import { Memory } from './features/memory/Memory';
import { Settings } from './features/settings/Settings';
import { Workspace } from './features/workspace/Workspace';
import { MediaStudio } from './features/media/MediaStudio';
import { AppSandboxStudio } from './features/sandbox/AppSandboxStudio';
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
  const [selectedSandboxAppId, setSelectedSandboxAppId] = useState<string | undefined>(undefined);
  const [sessionMeta, setSessionMeta] = useState<{ title?: string; count?: number }>({});

  const handleOpenSessionDrawer = useCallback(() => {
    window.dispatchEvent(new CustomEvent('adam:open-session-drawer'));
  }, []);

  const handleSessionMetaChange = useCallback((meta: { title: string; count: number }) => {
    setSessionMeta((prev) => {
      if (prev.title === meta.title && prev.count === meta.count) return prev;
      return meta;
    });
  }, []);

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
      sessionTitle={sessionMeta.title}
      conversationCount={sessionMeta.count}
      onOpenSessionDrawer={handleOpenSessionDrawer}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
          transition={{
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="view-transition-wrapper"
        >
          {activeView === 'chat' && (
            <Chat
              key={`${preferences.language}-${preferences.agentName}-${chatSessionKey}`}
              language={preferences.language}
              agentName={preferences.agentName}
              copy={heroCopy}
              onNewChat={handleNewChat}
              onOpenSandbox={(appId) => {
                setSelectedSandboxAppId(appId);
                setActiveView('apps');
              }}
              onSessionMetaChange={handleSessionMetaChange}
            />
          )}
          {activeView === 'tasks' && <Tasks language={preferences.language} />}
          {activeView === 'apps' && (
            <AppSandboxStudio
              language={preferences.language}
              initialAppId={selectedSandboxAppId}
              onNavigateToChat={(_prompt) => {
                setActiveView('chat');
              }}
            />
          )}
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
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
