import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppPreferences, Language, ViewId } from './core/domain';
import { createNewConversation, loadPreferences, normalizePreferences, savePreferences } from './core/storage';
import { AppShell } from './components/AppShell';
import { Chat } from './features/chat/Chat';
import { Tasks } from './features/tasks/Tasks';
import { Settings } from './features/settings/Settings';
import { Workspace } from './features/workspace/Workspace';
import { MediaStudio } from './features/media/MediaStudio';
import { AppSandboxStudio } from './features/sandbox/AppSandboxStudio';
import { BackgroundSecuritySentinel } from './components/BackgroundSecuritySentinel';
import { Onboarding } from './features/onboarding/Onboarding';
import { IqTestStudio } from './features/iq/IqTestStudio';
import { InAppBrowserModal } from './components/InAppBrowserModal';
import { AuthModal } from './components/AuthModal';
import { openSafeExternalUrl, setupAndroidBackGuard } from './core/utils/mobileWebHandler';

const DEFAULT_PREFERENCES: AppPreferences = {
  agentName: 'Adam',
  language: 'ar',
  theme: 'glass-dark',
  onboardingComplete: true,
};

export default function App() {
  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const loaded = loadPreferences(DEFAULT_PREFERENCES);
    if (loaded.theme === 'system' || loaded.theme === 'dark') {
      const updated = { ...loaded, theme: 'glass-dark' as const };
      savePreferences(updated);
      return updated;
    }
    return loaded;
  });
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
    if ((activeView as string) === 'memory') {
      setActiveView('chat');
    }
  }, [activeView]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);
    root.setAttribute('dir', preferences.language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', preferences.language);

    const darkThemes = [
      'dark',
      'midnight',
      'glass-dark',
      'aurora',
      'ocean',
      'cyberpunk',
      'coffee',
      'royal',
      'crimson',
      'matrix',
      'dracula',
      'nord',
      'synthwave',
      'forest',
      'gold',
      'solar',
      'stranger-things',
      'outer-banks',
      'game-of-thrones',
    ];

    const applyThemeClasses = () => {
      if (preferences.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
        root.setAttribute('data-resolved-theme', prefersDark ? 'dark' : 'light');
      } else if (darkThemes.includes(preferences.theme)) {
        root.classList.add('dark');
        root.setAttribute('data-resolved-theme', preferences.theme);
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-resolved-theme', preferences.theme);
      }
    };

    applyThemeClasses();

    if (preferences.theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyThemeClasses();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
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

  useEffect(() => {
    const handleAppOpenEvent = (e: CustomEvent<{ view?: ViewId; sandboxAppId?: string; url?: string; title?: string }>) => {
      const { view, sandboxAppId, url, title } = e.detail || {};
      if (url) {
        openSafeExternalUrl(url, { title });
        return;
      }
      if (sandboxAppId) {
        setSelectedSandboxAppId(sandboxAppId);
        setActiveView('apps');
        return;
      }
      if (view) {
        if ((view as string) === 'academic') {
          setActiveView('chat');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('adam_open_academic_modal'));
          }, 100);
        } else {
          setActiveView(view);
        }
      }
    };

    window.addEventListener('adam_open_app' as any, handleAppOpenEvent);

    // Setup hardware back guard for APK & Mobile
    const unguard = setupAndroidBackGuard(() => {
      if (activeView !== 'chat') {
        setActiveView('chat');
        return true;
      }
      return false;
    });

    // Auto-prompt Android permissions on launch
    if (typeof window !== 'undefined' && (window as any).AndroidApp) {
      try {
        (window as any).AndroidApp.requestAllPermissions();
      } catch {}
    }

    return () => {
      window.removeEventListener('adam_open_app' as any, handleAppOpenEvent);
      unguard();
    };
  }, [activeView]);

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
              onNavigateView={(view, extraParam) => {
                if (extraParam) {
                  setSelectedSandboxAppId(extraParam);
                }
                setActiveView(view);
              }}
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
          {activeView === 'iq' && <IqTestStudio language={preferences.language} />}
          {activeView === 'settings' && (
            <Settings
              language={preferences.language}
              preferences={preferences}
              onChange={updatePreferences}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Autonomous Background Security Sentinel (حارس الأمان النشط في الخلفية لحماية المستخدم) */}
      <BackgroundSecuritySentinel />

      {/* Safe In-App Browser for Mobile and APK WebView environments */}
      <InAppBrowserModal language={preferences.language} />

      {/* Authentication Dialog with Instant Mobile Login & Storage Partitioning Protection */}
      <AuthModal language={preferences.language} />
    </AppShell>
  );
}
