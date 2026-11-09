import type {
  CalendarTone,
  EmployeeCalendar,
  EmployeeCalendarEvent,
  MobileEmployeeCalendarResponse,
} from './contracts/calendar';

const CONTRACT_NAME = 'black_label_connect.employee_schedule';
const CONTRACT_VERSION = 1;
const MAX_EVENTS = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isIsoDate(value: unknown): value is string {
  return isString(value) && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function adaptEvent(value: unknown): EmployeeCalendarEvent {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.title) ||
    !isNullableString(value.description) ||
    !isString(value.event_type) ||
    !isString(value.category) ||
    !isString(value.status) ||
    !isString(value.priority) ||
    !isIsoDate(value.starts_at) ||
    !(value.ends_at === null || isIsoDate(value.ends_at)) ||
    typeof value.all_day !== 'boolean' ||
    !isNullableString(value.timezone) ||
    !isNullableString(value.location) ||
    !isNullableString(value.meeting_url)
  ) {
    throw new Error('The employee calendar response contains a malformed event.');
  }

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    eventType: value.event_type,
    category: value.category,
    status: value.status,
    priority: value.priority,
    startsAt: value.starts_at,
    endsAt: value.ends_at,
    allDay: value.all_day,
    timezone: value.timezone,
    location: value.location,
    meetingUrl: value.meeting_url,
  };
}

export function adaptEmployeeCalendar(value: unknown): EmployeeCalendar {
  if (!isRecord(value) || !isRecord(value.contract) || !isRecord(value.range)) {
    throw new Error('The employee calendar response is malformed.');
  }

  if (value.contract.name !== CONTRACT_NAME || value.contract.version !== CONTRACT_VERSION) {
    throw new Error('The employee calendar contract version is not supported.');
  }

  if (
    !isIsoDate(value.contract.generated_at) ||
    !isIsoDate(value.range.starts_at) ||
    !isIsoDate(value.range.ends_at) ||
    !Array.isArray(value.events) ||
    value.events.length > MAX_EVENTS
  ) {
    throw new Error('The employee calendar response is malformed.');
  }

  const response = value as unknown as MobileEmployeeCalendarResponse;
  const assignments = (value as Record<string, unknown>).assignments;
  if (!Array.isArray(assignments) || assignments.length > MAX_EVENTS) {
    throw new Error('The employee schedule assignments are malformed.');
  }
  const assignmentEvents = assignments.map((item): EmployeeCalendarEvent => {
    if (!isRecord(item) || !isString(item.id) || !isString(item.title) || !isIsoDate(item.starts_at) ||
        !(item.ends_at === null || isIsoDate(item.ends_at)) || !isNullableString(item.location)) {
      throw new Error('The employee schedule contains a malformed assignment.');
    }
    return {
      id: `assignment:${item.id}`, title: item.title, description: isNullableString(item.description) ? item.description : null,
      eventType: 'crew assignment', category: 'work', status: isString(item.assignment_status) ? item.assignment_status : 'assigned',
      priority: 'normal', startsAt: item.starts_at, endsAt: item.ends_at, allDay: false,
      timezone: isNullableString(item.timezone) ? item.timezone : null, location: item.location,
      meetingUrl: null,
    };
  });
  const events = [...response.events.map(adaptEvent), ...assignmentEvents]
    .filter((event, index, list) => list.findIndex((candidate) => candidate.id === event.id) === index)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt) || left.id.localeCompare(right.id));

  return {
    contractVersion: 1,
    generatedAt: response.contract.generated_at,
    range: {
      startsAt: response.range.starts_at,
      endsAt: response.range.ends_at,
    },
    events,
  };
}

export function getEmployeeCalendarWindow(now = new Date()): { startsAt: string; endsAt: string } {
  const startsAt = new Date(now.getFullYear(), now.getMonth(), 1);
  const endsAt = new Date(now.getFullYear(), now.getMonth() + 4, 1);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

export function toneForCalendarEvent(event: Pick<EmployeeCalendarEvent, 'eventType' | 'category'>): CalendarTone {
  const value = `${event.eventType} ${event.category}`.toLowerCase();
  if (value.includes('deadline') || value.includes('due')) return 'deadline';
  if (value.includes('travel') || value.includes('flight')) return 'travel';
  if (value.includes('meeting') || value.includes('call')) return 'meeting';
  if (value.includes('entertainment') || value.includes('performance')) return 'entertainment';
  return 'event';
}
