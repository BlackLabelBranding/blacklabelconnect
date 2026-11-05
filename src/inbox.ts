import type {
  EmployeeInbox,
  EmployeeInboxConversation,
  EmployeeInboxMessage,
  EmployeeInboxThread,
  EmployeeInboxThreadMessage,
  MobileEmployeeInboxResponse,
  MobileEmployeeInboxThreadResponse,
} from './contracts/inbox';

const INBOX_CONTRACT_NAME = 'black_label_connect.employee_inbox';
const INBOX_CONTRACT_VERSION = 2;
const THREAD_CONTRACT_NAME = 'black_label_connect.employee_inbox_thread';
const THREAD_CONTRACT_VERSION = 1;
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim() !== '';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function isIdentifier(value: unknown): value is string | number {
  return (
    (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
    isNonEmptyString(value)
  );
}

function isNullableIdentifier(value: unknown): value is string | number | null {
  return value === null || isIdentifier(value);
}

function isIsoDate(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isNullableIsoDate(value: unknown): value is string | null {
  return value === null || isIsoDate(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function adaptMessage(value: unknown): EmployeeInboxMessage | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !isIdentifier(value.id) ||
    !isNullableString(value.sender_type) ||
    !isNonEmptyString(value.direction) ||
    !isString(value.body) ||
    !isNullableString(value.status) ||
    !isNullableIsoDate(value.created_at)
  ) {
    throw new Error('The employee inbox response contains a malformed message.');
  }

  return {
    id: String(value.id),
    senderType: value.sender_type,
    direction: value.direction,
    body: value.body,
    status: value.status,
    createdAt: value.created_at,
  };
}

function adaptConversation(value: unknown): EmployeeInboxConversation {
  if (
    !isRecord(value) ||
    !isIdentifier(value.id) ||
    !isNullableIdentifier(value.client_id) ||
    !isNonEmptyString(value.client_name) ||
    !isNullableString(value.subject) ||
    !isNonEmptyString(value.status) ||
    !isNullableIsoDate(value.last_message_at) ||
    !isCount(value.unread_count)
  ) {
    throw new Error('The employee inbox response contains a malformed conversation.');
  }

  return {
    id: String(value.id),
    clientId: value.client_id === null ? null : String(value.client_id),
    clientName: value.client_name,
    subject: value.subject,
    status: value.status,
    lastMessageAt: value.last_message_at,
    unreadCount: value.unread_count,
    latestMessage: adaptMessage(value.latest_message),
  };
}

function adaptThreadMessage(value: unknown): EmployeeInboxThreadMessage {
  if (
    !isRecord(value) ||
    !isIdentifier(value.id) ||
    !isNonEmptyString(value.direction) ||
    !isNullableString(value.sender_type) ||
    !isNullableString(value.sender_name) ||
    !isString(value.body) ||
    !isNullableString(value.status) ||
    !isNullableIsoDate(value.created_at) ||
    !isCount(value.media_count)
  ) {
    throw new Error('The employee inbox thread contains a malformed message.');
  }

  return {
    id: String(value.id),
    direction: value.direction,
    senderType: value.sender_type,
    senderName: value.sender_name,
    body: value.body,
    status: value.status,
    createdAt: value.created_at,
    mediaCount: value.media_count,
  };
}

export function adaptEmployeeInbox(value: unknown): EmployeeInbox {
  if (!isRecord(value) || !isRecord(value.contract) || !Array.isArray(value.conversations)) {
    throw new Error('The employee inbox response is malformed.');
  }

  if (
    value.contract.name !== INBOX_CONTRACT_NAME ||
    value.contract.version !== INBOX_CONTRACT_VERSION
  ) {
    throw new Error('The employee inbox contract version is not supported.');
  }

  if (
    !isIsoDate(value.contract.generated_at) ||
    value.contract.unread_tracking !== true ||
    value.contract.source !== 'hub_sms' ||
    value.conversations.length > MAX_CONVERSATIONS
  ) {
    throw new Error('The employee inbox response is malformed.');
  }

  const response = value as unknown as MobileEmployeeInboxResponse;
  return {
    contractVersion: 2,
    generatedAt: response.contract.generated_at,
    unreadTracking: true,
    source: 'hub_sms',
    conversations: response.conversations.map(adaptConversation),
  };
}

export function adaptEmployeeInboxThread(value: unknown): EmployeeInboxThread {
  if (
    !isRecord(value) ||
    !isRecord(value.contract) ||
    !isRecord(value.conversation) ||
    !Array.isArray(value.messages)
  ) {
    throw new Error('The employee inbox thread response is malformed.');
  }

  if (
    value.contract.name !== THREAD_CONTRACT_NAME ||
    value.contract.version !== THREAD_CONTRACT_VERSION
  ) {
    throw new Error('The employee inbox thread contract version is not supported.');
  }

  if (
    !isIsoDate(value.contract.generated_at) ||
    value.contract.read_only !== true ||
    value.contract.source !== 'hub_sms' ||
    value.messages.length > MAX_MESSAGES ||
    !isIdentifier(value.conversation.id) ||
    !isNullableIdentifier(value.conversation.client_id) ||
    !isNonEmptyString(value.conversation.client_name) ||
    !isNonEmptyString(value.conversation.status) ||
    !isNullableIsoDate(value.conversation.last_message_at) ||
    !isCount(value.conversation.unread_count)
  ) {
    throw new Error('The employee inbox thread response is malformed.');
  }

  const response = value as unknown as MobileEmployeeInboxThreadResponse;
  return {
    contractVersion: 1,
    generatedAt: response.contract.generated_at,
    readOnly: true,
    source: 'hub_sms',
    conversation: {
      id: String(response.conversation.id),
      clientId:
        response.conversation.client_id === null
          ? null
          : String(response.conversation.client_id),
      clientName: response.conversation.client_name,
      status: response.conversation.status,
      lastMessageAt: response.conversation.last_message_at,
      unreadCount: response.conversation.unread_count,
    },
    messages: response.messages.map(adaptThreadMessage),
  };
}

export function titleForConversation(
  conversation: Pick<EmployeeInboxConversation, 'id' | 'clientName' | 'subject'>,
): string {
  return (
    conversation.subject?.trim() ||
    conversation.clientName.trim() ||
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

export function formatThreadTimestamp(timestamp: string | null): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isOutboundMessage(
  message: Pick<EmployeeInboxThreadMessage, 'direction'>,
): boolean {
  return message.direction.toLowerCase() === 'outbound';
}
