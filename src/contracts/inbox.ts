export interface EmployeeInboxMessage {
  id: string;
  senderType: string | null;
  body: string;
  createdAt: string;
}

export interface EmployeeInboxConversation {
  id: string;
  clientId: string;
  clientName: string | null;
  subject: string | null;
  status: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  latestMessage: EmployeeInboxMessage | null;
}

export interface EmployeeInbox {
  contractVersion: 1;
  generatedAt: string;
  unreadTracking: false;
  conversations: EmployeeInboxConversation[];
}

export interface MobileEmployeeInboxResponse {
  contract: {
    name: string;
    version: number;
    generated_at: string;
    unread_tracking: boolean;
  };
  conversations: Array<{
    id: string | number;
    client_id: string | number;
    client_name: string | null;
    subject: string | null;
    status: string | null;
    last_message_at: string | null;
    unread_count: number;
    latest_message: {
      id: string | number;
      sender_type: string | null;
      body: string;
      created_at: string;
    } | null;
  }>;
}
