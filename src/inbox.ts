import type {
  EmployeeInbox,
  EmployeeInboxConversation,
  EmployeeInboxMessage,
  MobileEmployeeInboxResponse,
} from './contracts/inbox';

const CONTRACT_NAME = 'black_label_connect.employee_inbox';
const CONTRACT_VERSION = 1;
const MAX_CONVERSATIONS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isIdentifier(value: unknown): value is string | number {
  return (
    (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
    (typeof value === 'string' && /^\d+$/.test(value))
  );
}

function isIsoDate(value: unknown): value is string {
  return isString(value) && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function adaptMessage(value: unknown): EmployeeInboxMessage | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !isIdentifier(value.id) ||
    !isNullableString(value.sender_type) ||
    !isString(value.body) ||
    !isIsoDate(value.created_at)
  ) {
    throw new Error('The employee inbox response contains a malformed message.');
  }

  return {
    id: String(value.id),
    senderType: value.sender_type,
    body: value.body,
    createdAt: value.created_at,
  };
}

function adaptConversation(value: unknown): EmployeeInboxConversation {
  if (
    !isRecord(value) ||
    !isIdentifier(value.id) ||
    !isIdentifier(value.client_id) ||
    !isNullableString(value.client_name) ||
    !isNullableString(value.subject) ||
    !isNullableString(value.status) ||
    !(value.last_message_at === null || isIsoDate(value.last_message_at)) ||
    !Number.isInteger(value.unread_count) ||
    (value.unread_count as number) < 0
  ) {
    throw new Error('The employee inbox response contains a malformed conversation.');
  }

  return {
    id: String(value.id),
    clientId: String(value.client_id),
    clientName: value.client_name,
    subject: value.subject,
    status: value.status,
    lastMessageAt: value.last_message_at,
    unreadCount: value.unread_count as number,
    latestMessage: adaptMessage(value.latest_message),
  };
}

export function adaptEmployeeInbox(value: unknown): EmployeeInbox {
  if (!isRecord(value) || !isRecord(value.contract) || !Array.isArray(value.conversations)) {
    throw new Error('The employee inbox response is malformed.');
  }

  if (value.contract.name !== CONTRACT_NAME || value.contract.version !== CONTRACT_VERSION) {
    throw new Error('The employee inbox contract version is not supported.');
  }

  if (
    !isIsoDate(value.contract.generated_at) ||
    value.contract.unread_tracking !== false ||
    value.conversations.length > MAX_CONVERSATIONS
  ) {
    throw new Error('The employee inbox response is malformed.');
  }

  const response = value as unknown as MobileEmployeeInboxResponse;
  return {
    contractVersion: 1,
    generatedAt: response.contract.generated_at,
    unreadTracking: false,
    conversations: response.conversations.map(adaptConversation),
  };
}

export function titleForConversation(
  conversation: Pick<EmployeeInboxConversation, 'id' | 'clientName' | 'subject'>,
): string {
  return (
    conversation.subject?.trim() ||
    conversation.clientName?.trim() ||
    'Conversation ' + conversation.id
  );
}

export function formatInboxTimestamp(timestamp: string | null, now = new Date()): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const elapsed = now.getTime() - date.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return String(minutes) + 'm';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return String(hours) + 'h';
  if (hours < 24 * 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
