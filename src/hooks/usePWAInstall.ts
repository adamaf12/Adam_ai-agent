import { useState, useEffect } from 'react';
import { logAnalyticsEvent } from '../lib/analytics';

// Extend the Window interface to include beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      logAnalyticsEvent('pwa_install_available', { platform: navigator.platform });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Also check if already installed to not show it
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      logAnalyticsEvent('pwa_install_completed', { timestamp: new Date().toISOString() });
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    logAnalyticsEvent('pwa_install_button_clicked');
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      logAnalyticsEvent('pwa_install_prompt_accepted');
    } else {
      logAnalyticsEvent('pwa_install_prompt_dismissed');
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, promptInstall };
}
