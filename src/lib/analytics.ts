import { getAnalytics, logEvent, isSupported, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { auth } from './workspaceAuth';
import { saveActivityLog } from './storage';

let analyticsInstance: any = null;

if (typeof window !== 'undefined') {
  if (navigator.onLine !== false) {
    isSupported().then((supported) => {
      if (supported) {
        try {
          const app = auth.app;
          if (app) {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
              try {
                const response = await originalFetch(...args);
                return response;
              } catch (err: any) {
                const arg0 = args[0];
                const url = typeof arg0 === 'string' ? arg0 : (arg0 instanceof Request ? arg0.url : (arg0 && typeof (arg0 as any).url === 'string' ? (arg0 as any).url : String(arg0 || '')));
                if (url && (url.includes('google-analytics.com') || url.includes('googletagmanager.com') || url.includes('firebase.googleapis.com'))) {
                  return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
                throw err;
              }
            };

            analyticsInstance = getAnalytics(app);
            try {
              setAnalyticsCollectionEnabled(analyticsInstance, true);
            } catch (e) {}

            setTimeout(() => {
              window.fetch = originalFetch;
            }, 6000);
          }
        } catch (e) {
          // Silently handle analytics init restrictions
        }
      }
    }).catch(() => {});
  }
}

/**
 * Global helper to track events across Firebase Analytics and Adam AI Activity Log.
 */
export function logAnalyticsEvent(eventName: string, params?: Record<string, any>): void {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventName, params);
    }
  } catch (err) {
    // Silently handle analytics logging errors when offline or blocked
  }

  // Record to Adam AI's Activity Log
  try {
    saveActivityLog({
      actionSummaryAr: `تتبع حدث التحليلات: ${eventName}`,
      actionSummaryEn: `Analytics event logged: ${eventName}`,
      toolName: 'firebase_analytics',
      displayNameAr: 'مُتتبع تحليلات أدم (Adam Analytics Tracker)',
      displayNameEn: 'Adam AI Firebase Analytics Tracker',
      details: {
        eventName,
        params: params || {},
        timestamp: new Date().toISOString(),
      },
      isUndoable: false,
    });
  } catch (logErr) {
    console.warn('[Analytics ActivityLog] Error:', logErr);
  }
}
