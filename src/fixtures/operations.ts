import type { CalendarEvent, GigOpportunity, TalentAssignment } from '../contracts/operations';

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'event-001',
    title: 'Brand Calendar Review',
    date: '2026-09-28',
    dayLabel: 'Today',
    time: '12:00 PM',
    location: 'Black Label HQ',
    type: 'Meeting',
    tone: 'meeting',
    description: 'Review upcoming campaigns, staffing needs, and production dates.',
  },
  {
    id: 'event-002',
    title: 'Josh Holland Band',
    date: '2026-09-29',
    dayLabel: 'Tomorrow',
    time: '6:30 PM',
    location: 'Effingham, IL',
    type: 'Entertainment',
    tone: 'entertainment',
    description: 'Performance schedule, venue access, and event operations.',
  },
  {
    id: 'event-003',
    title: 'Campaign Assets Due',
    date: '2026-10-01',
    dayLabel: 'Thursday',
    time: '5:00 PM',
    location: 'Promo Proof',
    type: 'Deadline',
    tone: 'deadline',
    description: 'Final approved images and proof-of-performance materials are due.',
  },
  {
    id: 'event-004',
    title: 'Sturgis Motorcycle Rally',
    date: '2026-10-03',
    dayLabel: 'Saturday',
    time: 'All day',
    location: 'Sturgis, SD',
    type: 'Event',
    tone: 'event',
    description: 'Event operations and talent schedule.',
  },
];

export const gigOpportunities: GigOpportunity[] = [
  {
    id: 'gig-001',
    title: 'Oak & Main launch night',
    role: 'Brand Ambassador',
    date: 'Friday, October 2',
    time: '6:00-10:00 PM',
    location: 'Oak & Main',
    pay: '$180 flat',
    status: 'Open',
    requirements: 'Guest engagement, polished black attire, and reliable transportation.',
    deliverables: 'Check in, two approved event photos, and shift completion confirmation.',
  },
  {
    id: 'gig-002',
    title: 'Fall campaign content shoot',
    role: 'Model',
    date: 'Monday, October 5',
    time: '9:00 AM-1:00 PM',
    location: 'Black Label Studio',
    pay: '$250 flat',
    status: 'Open',
    requirements: 'Camera-ready arrival and wardrobe options listed in the call sheet.',
    deliverables: 'Four-hour shoot and standard campaign usage release.',
  },
];

export const talentAssignments: TalentAssignment[] = [
  {
    id: 'assignment-001',
    title: 'Launch photo capture',
    role: 'Content Creator',
    date: 'Thursday, October 1',
    callTime: '4:30 PM',
    location: 'Black Label Entertainment',
    pay: '$225 flat',
    contractStatus: 'Signed',
    paymentStatus: 'Pending',
  },
  {
    id: 'assignment-002',
    title: 'Venue ambassador shift',
    role: 'Brand Ambassador',
    date: 'Saturday, October 10',
    callTime: '5:30 PM',
    location: 'Market Street Hall',
    pay: '$180 flat',
    contractStatus: 'Needs signature',
    paymentStatus: 'Pending',
  },
];

export const talentSummary = {
  nextGig: 'October 1',
  pendingPay: '$405',
  profileStatus: 'Active',
  availability: 'Open through October 8',
};
