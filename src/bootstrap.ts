export type Persona = 'employee' | 'contractor';

export type TabKey = 'home' | 'inbox' | 'calendar' | 'work' | 'more';

export type Capability =
  | 'mobile.access'
  | 'communications.view'
  | 'communications.send'
  | 'calendar.view'
  | 'tasks.view'
  | 'timeclock.punch'
  | 'work.accept'
  | 'work.complete'
  | 'notifications.receive';

export interface MobileBootstrap {
  contractVersion: 1;
  user: {
    id: string;
    displayName: string;
    initials: string;
    status: 'active';
  };
  activePersona: Persona;
  personas: Persona[];
  activeAccount: {
    id: string;
    name: string;
  };
  memberships: Array<{
    accountId: string;
    accountName: string;
    role: string;
  }>;
  capabilities: Capability[];
  navigation: Record<TabKey, boolean>;
  notifications: {
    unreadCount: number;
    deviceRegistered: boolean;
  };
}
