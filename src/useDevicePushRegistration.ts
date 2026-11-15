import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './lib/supabase';

export function useDevicePushRegistration(userId: string) {
  const [status, setStatus] = useState<'unsupported'|'checking'|'registered'|'denied'|'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web' || !supabase) { setStatus('unsupported'); return; }
    let active = true;
    let token: string | undefined;
    const register = async () => {
      try {
        const { data: preferences, error: prefError } = await supabase.from('notification_preferences').select('push_enabled').eq('user_id',userId).maybeSingle();
        if (prefError) throw prefError;
        if (preferences?.push_enabled === false) { if(active)setStatus('denied'); return; }
        const permission = await Notifications.getPermissionsAsync();
        const granted = permission.granted ? permission : await Notifications.requestPermissionsAsync();
        if (!granted.granted) { if(active)setStatus('denied'); return; }
        const expoToken = await Notifications.getExpoPushTokenAsync({projectId:'652840aa-94e0-484f-a4a5-d887c703de95'});
        token = expoToken.data;
        // Direct table writes are intentionally denied by RLS/grants. Use the
        // authenticated RPC, which checks active employee status and token ownership.
        const { error: saveError } = await supabase.rpc('connect_register_push_device', {
          p_platform: Platform.OS,
          p_token: token,
        });
        if(saveError)throw saveError;
        if(active)setStatus('registered');
      } catch(e) {
        if(active){setError(e instanceof Error?e.message:'Device registration failed');setStatus('error');}
      }
    };
    void register();
    return () => {active=false;};
  },[userId]);
  return {status,error};
}
