import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adam.aiagent',
  appName: 'Adam AI Agent',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.google.com',
      '*.googleapis.com',
      '*.gstatic.com',
      '*.pollinations.ai',
      '*.firebaseapp.com',
      '*.cartocdn.com',
      '*.openstreetmap.org',
      '*.arcgisonline.com'
    ]
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;

