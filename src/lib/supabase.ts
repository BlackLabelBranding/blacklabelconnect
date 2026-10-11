import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { BLACK_LABEL_AUTH_STORAGE_KEY, validateSharedAuthUrl } from '../auth/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

export const supabaseConfigError =
  validateSharedAuthUrl(supabaseUrl) ??
  (!supabasePublishableKey
    ? 'Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY before starting the app.'
    : null);

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: AsyncStorage,
        storageKey: BLACK_LABEL_AUTH_STORAGE_KEY,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      global: {
        headers: { 'x-client-info': 'blacklabel-connect@0.1.0' },
      },
    });
