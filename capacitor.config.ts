import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adam.aiagent',
  appName: 'Adam AI Agent',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
