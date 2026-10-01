import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AppPreferences, Language, ViewId } from './core/domain';
import { createNewConversation, loadPreferences, normalizePreferences, savePreferences } from './core/storage';
import { AppShell } from './components/AppShell';
import { Chat } from './features/chat/Chat';
import { Settings } from './features/settings/Settings';
import { AppSandboxStudio } from './features/sandbox/AppSandboxStudio';
import { TranslatorStudio } from './features/translation/TranslatorStudio';
import { GoogleAdkStudio } from './features/adk/GoogleAdkStudio';
import { MediaStudio } from './features/media/MediaStudio';
import { BackgroundSecuritySentinel } from './components/BackgroundSecuritySentinel';
import { QuickLiquidRefraction } from './components/QuickLiquidRefraction';
import { NetworkSentinel } from './components/NetworkSentinel';
import { Onboarding } from './features/onboarding/Onboarding';
import { InAppBrowserModal } from './components/InAppBrowserModal';
import { AuthModal } from './components/AuthModal';
import { AgenticLogin } from './features/auth/AgenticLogin';
import { openSafeExternalUrl, setupAndroidBackGuard } from './core/utils/mobileWebHandler';

const DEFAULT_PREFERENCES: AppPreferences = {
  agentName: 'Adam',
  language: 'en',
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
  const [loginExperienceOpen, setLoginExperienceOpen] = useState(false);

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
    if ((activeView as string) === 'memory' || (activeView as string) === 'tasks') {
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
      'tokyo-night',
      'catppuccin-mocha',
      'monokai-pro',
      'gruvbox-dark',
      'sunset-miami',
      'deep-space',
      'emerald-luxury',
      'titanium-dark',
    ];
    if (darkThemes.includes(preferences.theme)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme, preferences.language]);

  const updatePreferences = (next: Partial<AppPreferences>) => {
    setPreferences((prev) => {
      const merged = normalizePreferences({ ...prev, ...next });
      savePreferences(merged);
      return merged;
    });
  };

  const handleOnboardingComplete = (next: AppPreferences) => {
    updatePreferences({ ...next, onboardingComplete: true });
  };

  const heroCopy = useMemo(() => {
    return preferences.language === 'ar'
      ? {
          title: `مرحباً، أنا ${preferences.agentName}`,
          subtitle: 'وكيلك الذكي الشخصي — يفهم، يخطط، ينفذ الأدوات، ويتحقق من النتيجة بدقة',
        }
      : {
          title: `Hello, I'm ${preferences.agentName}`,
          subtitle: 'Your autonomous personal agent — plans, executes tools, and verifies results',
        };
  }, [preferences.language, preferences.agentName]);

  useEffect(() => {
    const unguard = setupAndroidBackGuard(() => {
      if (activeView !== 'chat') {
        setActiveView('chat');
        return true;
      }
      return false;
    });

    const handleAppOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ appId: string; externalUrl?: string }>;
      const appId = customEvent.detail?.appId;
      const externalUrl = customEvent.detail?.externalUrl;

      if (externalUrl) {
        openSafeExternalUrl(externalUrl);
        return;
      }

      if (appId) {
        setSelectedSandboxAppId(appId);
        setActiveView('apps');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adam_open_app' as any, handleAppOpenEvent);
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
      onOpenAuth={() => setLoginExperienceOpen(true)}
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
          className="view-transition-wrapper h-full w-full flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {activeView === 'chat' && (
            <Chat
              key={`${preferences.language}-${preferences.agentName}-${chatSessionKey}`}
              language={preferences.language}
              agentName={preferences.agentName}
              copy={heroCopy}
              onNewChat={handleNewChat}
              onToggleLanguage={() =>
                updatePreferences({ language: preferences.language === 'ar' ? 'en' : 'ar' })
              }
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

          {activeView === 'settings' && (
            <Settings
              language={preferences.language}
              preferences={preferences}
              onChange={updatePreferences}
            />
          )}

          {activeView === 'apps' && (
            <AppSandboxStudio
              language={preferences.language}
              initialAppId={selectedSandboxAppId}
              onNavigateToChat={(_prompt) => {
                setActiveView('chat');
              }}
            />
          )}

          {activeView === 'translate' && (
            <TranslatorStudio
              language={preferences.language}
              onNavigateToChat={(_prompt) => {
                setActiveView('chat');
              }}
            />
          )}

          {activeView === 'adk' && (
            <GoogleAdkStudio
              language={preferences.language}
              onNavigateToChat={(_prompt) => {
                setActiveView('chat');
              }}
            />
          )}

          {activeView === 'media' && (
            <MediaStudio
              language={preferences.language}
              onNavigate={(view) => setActiveView(view)}
              onRunPromptInChat={(_prompt) => {
                setActiveView('chat');
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <BackgroundSecuritySentinel />
      <QuickLiquidRefraction />
      <NetworkSentinel language={preferences.language} />
      <InAppBrowserModal language={preferences.language} />
      <AuthModal language={preferences.language} />
      <AgenticLogin
        language={preferences.language}
        open={loginExperienceOpen}
        onClose={() => setLoginExperienceOpen(false)}
        onOpenFallbackAuth={() => { setLoginExperienceOpen(false); window.dispatchEvent(new CustomEvent('adam:open-auth-modal')); }}
      />
    </AppShell>
  );
}
