import { adaptEmployeeInbox, adaptEmployeeInboxThread } from '../inbox';
import type { EmployeeInbox, EmployeeInboxThread } from '../contracts/inbox';
import { supabase } from '../lib/supabase';

function boundedLimit(value: number, fallback: number, maximum: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(Math.trunc(value), maximum));
}

export async function fetchEmployeeInbox(limit = 50): Promise<EmployeeInbox> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('mobile_employee_inbox_v2', {
    p_limit: boundedLimit(limit, 50, 50),
  });

  if (error) {
    throw new Error(error.message);
  }

  return adaptEmployeeInbox(data);
}

export async function fetchEmployeeInboxThread(
  conversationId: string,
  limit = 100,
): Promise<EmployeeInboxThread> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('mobile_employee_inbox_thread', {
    p_conversation_id: conversationId,
    p_limit: boundedLimit(limit, 100, 200),
  });

  if (error) {
    throw new Error(error.message);
  }

  return adaptEmployeeInboxThread(data);
}
