import assert from 'node:assert/strict';
import test from 'node:test';

import { adaptEmployeeCalendar, getEmployeeCalendarWindow, toneForCalendarEvent } from './calendar';

const response = {
  contract: {
    name: 'black_label_connect.employee_calendar',
    version: 1,
    generated_at: '2026-11-03T12:00:00.000Z',
  },
  range: {
    starts_at: '2026-11-01T00:00:00.000Z',
    ends_at: '2027-03-01T00:00:00.000Z',
  },
  events: [
    {
      id: 'event-2',
      title: 'Venue walkthrough',
      description: null,
      event_type: 'meeting',
      category: 'operations',
      status: 'scheduled',
      priority: 'normal',
      starts_at: '2026-11-04T20:00:00.000Z',
      ends_at: null,
      all_day: false,
      timezone: 'America/Chicago',
      location: 'Oak & Main',
      meeting_url: null,
    },
    {
      id: 'event-1',
      title: 'Team call',
      description: null,
      event_type: 'meeting',
      category: 'internal',
      status: 'scheduled',
      priority: 'normal',
      starts_at: '2026-11-04T15:30:00.000Z',
      ends_at: null,
      all_day: false,
      timezone: 'America/Chicago',
      location: null,
      meeting_url: 'https://meet.example.com/test',
    },
  ],
};

test('adapts and sorts the employee calendar contract', () => {
  const calendar = adaptEmployeeCalendar(response);
  assert.equal(calendar.events.length, 2);
  assert.equal(calendar.events[0]?.id, 'event-1');
  assert.equal(calendar.contractVersion, 1);
});

test('accepts a valid empty calendar', () => {
  const calendar = adaptEmployeeCalendar({ ...response, events: [] });
  assert.deepEqual(calendar.events, []);
});

test('rejects an incompatible contract version', () => {
  assert.throws(
    () => adaptEmployeeCalendar({ ...response, contract: { ...response.contract, version: 2 } }),
    /not supported/,
  );
});

test('rejects malformed events', () => {
  assert.throws(
    () => adaptEmployeeCalendar({ ...response, events: [{ ...response.events[0], starts_at: 'not-a-date' }] }),
    /malformed event/,
  );
});

test('builds a bounded four-month request window', () => {
  const window = getEmployeeCalendarWindow(new Date(2026, 10, 3, 12, 0, 0));
  assert.equal(new Date(window.startsAt).getMonth(), 10);
  assert.equal(new Date(window.endsAt).getMonth(), 2);
});

test('maps event types to display tones', () => {
  assert.equal(toneForCalendarEvent({ eventType: 'meeting', category: 'internal' }), 'meeting');
  assert.equal(toneForCalendarEvent({ eventType: 'performance', category: 'entertainment' }), 'entertainment');
  assert.equal(toneForCalendarEvent({ eventType: 'deadline', category: 'task due' }), 'deadline');
});
