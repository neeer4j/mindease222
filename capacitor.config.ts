import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindease.app',
  appName: 'MindEase',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#00000000'
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    StatusBar: {
      backgroundColor: '#00000000',
      style: 'dark',
      overlaysWebView: true
    }
  }
};

export default config;
