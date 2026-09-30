import { adaptMobileBootstrap } from '../bootstrap';
import type { MobileBootstrap } from '../contracts/bootstrap';
import { supabase } from '../lib/supabase';

export async function fetchMobileBootstrap(): Promise<MobileBootstrap> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('mobile_bootstrap');
  if (error) {
    throw new Error(error.message);
  }

  return adaptMobileBootstrap(data);
}
