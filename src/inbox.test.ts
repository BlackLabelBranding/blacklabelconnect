import assert from 'node:assert/strict';
import test from 'node:test';

import { adaptEmployeeInbox, formatInboxTimestamp, titleForConversation } from './inbox';

const response = {
  contract: {
    name: 'black_label_connect.employee_inbox',
    version: 1,
    generated_at: '2026-11-05T09:45:00.000Z',
    unread_tracking: false,
  },
  conversations: [
    {
      id: 42,
      client_id: 7,
      client_name: 'Oak & Main',
      subject: 'Friday load-in',
      status: 'open',
      last_message_at: '2026-11-05T09:30:00.000Z',
      unread_count: 0,
      latest_message: {
        id: 101,
        sender_type: 'employee',
        body: 'The load-in moved to 3:30.',
        created_at: '2026-11-05T09:30:00.000Z',
      },
    },
  ],
};

test('adapts the employee inbox contract', () => {
  const inbox = adaptEmployeeInbox(response);
  assert.equal(inbox.contractVersion, 1);
  assert.equal(inbox.unreadTracking, false);
  assert.equal(inbox.conversations[0]?.id, '42');
  assert.equal(inbox.conversations[0]?.latestMessage?.body, 'The load-in moved to 3:30.');
});

test('accepts a valid empty inbox', () => {
  assert.deepEqual(adaptEmployeeInbox({ ...response, conversations: [] }).conversations, []);
});

test('rejects incompatible or unread-enabled contracts', () => {
  assert.throws(
    () => adaptEmployeeInbox({ ...response, contract: { ...response.contract, version: 2 } }),
    /not supported/,
  );
  assert.throws(
    () => adaptEmployeeInbox({ ...response, contract: { ...response.contract, unread_tracking: true } }),
    /malformed/,
  );
});

test('rejects malformed conversations and messages', () => {
  assert.throws(
    () => adaptEmployeeInbox({ ...response, conversations: [{ ...response.conversations[0], id: null }] }),
    /malformed conversation/,
  );
  assert.throws(
    () => adaptEmployeeInbox({
      ...response,
      conversations: [{
        ...response.conversations[0],
        latest_message: { ...response.conversations[0].latest_message, created_at: 'not-a-date' },
      }],
    }),
    /malformed message/,
  );
});

test('builds conversation titles with safe fallbacks', () => {
  assert.equal(titleForConversation({ id: '42', clientName: 'Oak & Main', subject: 'Friday load-in' }), 'Friday load-in');
  assert.equal(titleForConversation({ id: '42', clientName: 'Oak & Main', subject: null }), 'Oak & Main');
  assert.equal(titleForConversation({ id: '42', clientName: null, subject: null }), 'Conversation 42');
});

test('formats recent inbox timestamps', () => {
  const now = new Date('2026-11-05T10:00:00.000Z');
  assert.equal(formatInboxTimestamp('2026-11-05T09:45:00.000Z', now), '15m');
  assert.equal(formatInboxTimestamp('2026-11-05T08:00:00.000Z', now), '2h');
  assert.equal(formatInboxTimestamp(null, now), '');
});
