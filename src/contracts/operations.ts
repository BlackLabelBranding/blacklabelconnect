export type EventTone = 'event' | 'entertainment' | 'meeting' | 'travel' | 'deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  dayLabel: string;
  time: string;
  location: string;
  type: string;
  tone: EventTone;
  description: string;
}

export interface GigOpportunity {
  id: string;
  title: string;
  role: string;
  date: string;
  time: string;
  location: string;
  pay: string;
  status: 'Open' | 'Interested' | 'Accepted' | 'Declined';
  requirements: string;
  deliverables: string;
}

export interface TalentAssignment {
  id: string;
  title: string;
  role: string;
  date: string;
  callTime: string;
  location: string;
  pay: string;
  contractStatus: 'Signed' | 'Needs signature';
  paymentStatus: 'Paid' | 'Pending';
}
