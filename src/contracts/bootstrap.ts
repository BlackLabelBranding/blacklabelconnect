export type Persona = 'employee' | 'contractor';

export type TabKey = 'home' | 'inbox' | 'calendar' | 'work' | 'more';

export interface MobileBootstrap {
  contractVersion: 1;
  user: {
    id: string;
    displayName: string;
    initials: string;
    status: 'active';
  };
  activePersona: Persona;
  personas: string[];
  activeAccount: {
    id: string;
    name: string;
  };
  memberships: Array<{
    accountId: string;
    accountName: string;
    role: string;
  }>;
  capabilities: string[];
  navigation: Record<TabKey, boolean>;
  notifications: {
    unreadCount: number;
    deviceRegistered: boolean;
  };
}

export interface MobileBootstrapResponse {
  contract: {
    name: string;
    version: number;
    generated_at: string;
    direct_tables: unknown[];
    rpc_allowlist: string[];
  };
  identity: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    team_member_id: number | null;
  };
  authorization: {
    user_id: string;
    roles: string[];
    capabilities: Record<string, boolean>;
    personas: string[];
    is_super_admin: boolean;
  };
  accounts: Array<{
    id: number;
    name: string;
    status: string | null;
    logo_url: string | null;
    access_role: string;
  }>;
  active_account_id: number | null;
  navigation: Array<{
    key: string;
    enabled: boolean;
    shared_data_only?: boolean;
  }>;
  notifications: {
    unread_count: number;
    preferences: {
      email_enabled: boolean;
      sms_enabled: boolean;
      push_enabled: boolean;
      high_priority_only: boolean;
      quiet_hours: string | null;
    };
  };
}
