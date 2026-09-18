import { useEffect } from 'react';
import { autonomousSecurityEngine } from '../core/security/autonomousSecurityEngine';

/**
 * BackgroundSecuritySentinel
 * 
 * Runs silently 24/7 in the application background without rendering any UI elements.
 * Intercepts cyber threats, monitors runtime integrity, sanitizes link redirects,
 * and defends user information.
 */
export function BackgroundSecuritySentinel() {
  useEffect(() => {
    // 1. Global unhandled rejection and script error interceptor
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('Script error') ||
        msg.includes('eval') ||
        msg.includes('SecurityError') ||
        msg.includes('Content Security Policy')
      ) {
        autonomousSecurityEngine.inspectAndNeutralize(msg, 'runtime-error');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '');
      if (reason.includes('fetch') || reason.includes('NetworkError') || reason.includes('SecurityError')) {
        autonomousSecurityEngine.inspectAndNeutralize(reason, 'unhandled-promise');
      }
    };

    // 2. Intercept malicious link clicks and navigation hijacks
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (target) {
        const href = target.getAttribute('href') || '';
        if (href.toLowerCase().startsWith('javascript:') || href.toLowerCase().startsWith('data:text/html')) {
          e.preventDefault();
          e.stopPropagation();
          autonomousSecurityEngine.inspectAndNeutralize(href, 'anchor-click');
          console.warn('[ADEM Security Sentinel] Blocked malicious link execution:', href);
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Invisible component — executes purely in the background
  return null;
}
