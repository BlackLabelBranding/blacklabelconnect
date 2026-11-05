import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adaptEmployeeInbox,
  adaptEmployeeInboxThread,
  formatInboxTimestamp,
  isOutboundMessage,
  titleForConversation,
} from './inbox';

const conversationId = 'e88a209b-b2f7-4d6d-9374-118ac593ce9e';

const response = {
  contract: {
    name: 'black_label_connect.employee_inbox',
    version: 2,
    generated_at: '2026-11-05T09:45:00.000Z',
    unread_tracking: true,
    source: 'hub_sms',
  },
  conversations: [
    {
      id: conversationId,
      client_id: null,
      client_name: 'Oak & Main',
      subject: null,
      status: 'active',
      last_message_at: '2026-11-05T09:30:00.000Z',
      unread_count: 2,
      latest_message: {
        id: '6408959c-2aae-4fc4-8c98-9461d3d28c9d',
        sender_type: 'contact',
        direction: 'inbound',
        body: 'The load-in moved to 3:30.',
        status: 'received',
        created_at: '2026-11-05T09:30:00.000Z',
      },
    },
  ],
};

const threadResponse = {
  contract: {
    name: 'black_label_connect.employee_inbox_thread',
    version: 1,
    generated_at: '2026-11-05T09:45:00.000Z',
    read_only: true,
    source: 'hub_sms',
  },
  conversation: {
    id: conversationId,
    client_id: null,
    client_name: 'Oak & Main',
    status: 'active',
    last_message_at: '2026-11-05T09:30:00.000Z',
    unread_count: 2,
  },
  messages: [
    {
      id: '6408959c-2aae-4fc4-8c98-9461d3d28c9d',
      direction: 'inbound',
      sender_type: 'contact',
      sender_name: 'Maya',
      body: 'The load-in moved to 3:30.',
      status: 'received',
      created_at: '2026-11-05T09:30:00.000Z',
      media_count: 0,
    },
    {
      id: 'af6b109d-ae9d-42c2-9e7f-6320df21102a',
      direction: 'outbound',
      sender_type: 'employee',
      sender_name: 'Lance',
      body: 'Confirmed.',
      status: 'delivered',
      created_at: '2026-11-05T09:32:00.000Z',
      media_count: 0,
    },
  ],
};

test('adapts the Hub-backed employee inbox contract', () => {
  const inbox = adaptEmployeeInbox(response);
  assert.equal(inbox.contractVersion, 2);
  assert.equal(inbox.unreadTracking, true);
  assert.equal(inbox.source, 'hub_sms');
  assert.equal(inbox.conversations[0]?.id, conversationId);
  assert.equal(inbox.conversations[0]?.unreadCount, 2);
});

test('accepts a valid empty inbox', () => {
  assert.deepEqual(adaptEmployeeInbox({ ...response, conversations: [] }).conversations, []);
});

test('rejects incompatible Inbox sources and versions', () => {
  assert.throws(
    () => adaptEmployeeInbox({ ...response, contract: { ...response.contract, version: 1 } }),
    /not supported/,
  );
  assert.throws(
    () => adaptEmployeeInbox({ ...response, contract: { ...response.contract, source: 'legacy' } }),
    /malformed/,
  );
});

test('adapts a bounded read-only thread', () => {
  const thread = adaptEmployeeInboxThread(threadResponse);
  assert.equal(thread.readOnly, true);
  assert.equal(thread.conversation.id, conversationId);
  assert.equal(thread.messages.length, 2);
  assert.equal(isOutboundMessage(thread.messages[0]!), false);
  assert.equal(isOutboundMessage(thread.messages[1]!), true);
});

test('rejects malformed thread messages', () => {
  assert.throws(
    () => adaptEmployeeInboxThread({
      ...threadResponse,
      messages: [{ ...threadResponse.messages[0], direction: '' }],
    }),
    /malformed message/,
  );
});

test('builds conversation titles with safe fallbacks', () => {
  assert.equal(titleForConversation({ id: conversationId, clientName: 'Oak & Main', subject: 'Friday load-in' }), 'Friday load-in');
  assert.equal(titleForConversation({ id: conversationId, clientName: 'Oak & Main', subject: null }), 'Oak & Main');
});

test('formats recent inbox timestamps', () => {
  const now = new Date('2026-11-05T10:00:00.000Z');
  assert.equal(formatInboxTimestamp('2026-11-05T09:45:00.000Z', now), '15m');
  assert.equal(formatInboxTimestamp('2026-11-05T08:00:00.000Z', now), '2h');
  assert.equal(formatInboxTimestamp(null, now), '');
});
