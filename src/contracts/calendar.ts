export type CalendarTone = 'event' | 'entertainment' | 'meeting' | 'travel' | 'deadline';

export interface EmployeeCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  category: string;
  status: string;
  priority: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  timezone: string | null;
  location: string | null;
  meetingUrl: string | null;
}

export interface EmployeeCalendar {
  contractVersion: 1 | 2;
  generatedAt: string;
  range: {
    startsAt: string;
    endsAt: string;
  };
  events: EmployeeCalendarEvent[];
}

export interface MobileEmployeeCalendarResponse {
  contract: {
    name: string;
    version: number;
    generated_at: string;
  };
  range: {
    starts_at: string;
    ends_at: string;
  };
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    category: string;
    status: string;
    priority: string;
    starts_at: string;
    ends_at: string | null;
    all_day: boolean;
    timezone: string | null;
    location: string | null;
    meeting_url: string | null;
  }>;
}
