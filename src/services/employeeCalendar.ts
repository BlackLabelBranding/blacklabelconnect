import { adaptEmployeeCalendar, getEmployeeCalendarWindow } from '../calendar';
import type { EmployeeCalendar } from '../contracts/calendar';
import { supabase } from '../lib/supabase';

export async function fetchEmployeeCalendar(now = new Date()): Promise<EmployeeCalendar> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const window = getEmployeeCalendarWindow(now);
  const { data, error } = await supabase.rpc('mobile_employee_calendar', {
    p_start_at: window.startsAt,
    p_end_at: window.endsAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return adaptEmployeeCalendar(data);
}
