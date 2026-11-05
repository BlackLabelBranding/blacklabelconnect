export interface EmployeeInboxMessage {
  id: string;
  senderType: string | null;
  direction: string;
  body: string;
  status: string | null;
  createdAt: string | null;
}

export interface EmployeeInboxConversation {
  id: string;
  clientId: string | null;
  clientName: string;
  subject: string | null;
  status: string;
  lastMessageAt: string | null;
  unreadCount: number;
  latestMessage: EmployeeInboxMessage | null;
}

export interface EmployeeInbox {
  contractVersion: 2;
  generatedAt: string;
  unreadTracking: true;
  source: 'hub_sms';
  conversations: EmployeeInboxConversation[];
}

export interface EmployeeInboxThreadMessage {
  id: string;
  direction: string;
  senderType: string | null;
  senderName: string | null;
  body: string;
  status: string | null;
  createdAt: string | null;
  mediaCount: number;
}

export interface EmployeeInboxThread {
  contractVersion: 1;
  generatedAt: string;
  readOnly: true;
  source: 'hub_sms';
  conversation: {
    id: string;
    clientId: string | null;
    clientName: string;
    status: string;
    lastMessageAt: string | null;
    unreadCount: number;
  };
  messages: EmployeeInboxThreadMessage[];
}

export interface MobileEmployeeInboxResponse {
  contract: {
    name: string;
    version: number;
    generated_at: string;
    unread_tracking: boolean;
    source: string;
  };
  conversations: Array<{
    id: string | number;
    client_id: string | number | null;
    client_name: string;
    subject: string | null;
    status: string;
    last_message_at: string | null;
    unread_count: number;
    latest_message: {
      id: string | number;
      sender_type: string | null;
      direction: string;
      body: string;
      status: string | null;
      created_at: string | null;
    } | null;
  }>;
}

export interface MobileEmployeeInboxThreadResponse {
  contract: {
    name: string;
    version: number;
    generated_at: string;
    read_only: boolean;
    source: string;
  };
  conversation: {
    id: string | number;
    client_id: string | number | null;
    client_name: string;
    status: string;
    last_message_at: string | null;
    unread_count: number;
  };
  messages: Array<{
    id: string | number;
    direction: string;
    sender_type: string | null;
    sender_name: string | null;
    body: string;
    status: string | null;
    created_at: string | null;
    media_count: number;
  }>;
}
