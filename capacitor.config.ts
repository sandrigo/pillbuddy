import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6102c8ad1d814c749aca58e710f1ec30',
  appName: 'Tabletten Tracker',
  webDir: 'dist',
  server: {
    url: 'https://6102c8ad-1d81-4c74-9aca-58e710f1ec30.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3B82F6',
      sound: 'beep.wav'
    }
  }
};

export default config;