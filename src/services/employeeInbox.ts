import { adaptEmployeeInbox } from '../inbox';
import type { EmployeeInbox } from '../contracts/inbox';
import { supabase } from '../lib/supabase';

export async function fetchEmployeeInbox(limit = 50): Promise<EmployeeInbox> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 50));
  const { data, error } = await supabase.rpc('mobile_employee_inbox', {
    p_limit: boundedLimit,
  });

  if (error) {
    throw new Error(error.message);
  }

  return adaptEmployeeInbox(data);
}
