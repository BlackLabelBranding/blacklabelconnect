import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './lib/supabase';
import { colors, spacing } from './theme';

// Explicit employee opt-in; never registers a device until the user taps Enable.
export function EmployeeNotificationOptIn() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Push notifications are optional.');
  const register = async () => {
    if (busy) return;
    if (!supabase) { setMessage('Connect backend is not configured.'); return; }
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setMessage('Sign in to enable notifications.'); return; }
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
    if (!projectId) { setMessage('Mobile push needs an EAS project ID before registration.'); return; }
    setBusy(true);
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('employee-announcements', {
          name: 'Employee announcements',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const current = await Notifications.getPermissionsAsync();
      const granted = current.granted ? current : await Notifications.requestPermissionsAsync();
      if (!granted.granted) { setMessage('Notifications were not allowed in device settings.'); return; }
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      const { error } = await supabase.rpc('connect_register_push_device', {
        p_platform: Platform.OS, p_token: token,
      });
      if (error) throw error;
      setMessage('This device is registered for employee notifications. Delivery is not yet enabled.');
    } catch (error) {
      setMessage('Could not register this device: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setBusy(false);
    }
  };
  return <View style={{ padding: spacing.sm, gap: spacing.sm, borderWidth: 1, borderColor: colors.line, borderRadius: 8 }}>
    <Text style={{ color: colors.text, fontWeight: '700' }}>Mobile notifications</Text>
    <Text style={{ color: colors.muted, fontSize: 12 }}>{message}</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void register()}>
      <Text style={{ color: colors.amber }}>{busy ? 'Registering…' : 'Enable notifications on this device'}</Text>
    </Pressable>
  </View>;
}
