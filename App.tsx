import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { BootstrapGate } from './src/BootstrapGate';

// Display incoming employee notifications even when Connect is foregrounded.
// Web browsers use their own notification handling and do not register here.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <BootstrapGate />
    </>
  );
}
