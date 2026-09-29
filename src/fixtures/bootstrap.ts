import type { MobileBootstrap, Persona } from '../contracts/bootstrap';

const common = {
  contractVersion: 1 as const,
  user: {
    id: 'fixture-user-001',
    displayName: 'Lance Garza',
    initials: 'LG',
    status: 'active' as const,
  },
  personas: ['employee', 'contractor'] as Persona[],
  activeAccount: {
    id: 'fixture-account-black-label',
    name: 'Black Label Branding',
  },
  memberships: [
    {
      accountId: 'fixture-account-black-label',
      accountName: 'Black Label Branding',
      role: 'Operations',
    },
  ],
  notifications: {
    unreadCount: 3,
    deviceRegistered: false,
  },
};

export const bootstrapFixtures: Record<Persona, MobileBootstrap> = {
  employee: {
    ...common,
    activePersona: 'employee',
    capabilities: [
      'mobile.access',
      'communications.view',
      'communications.send',
      'calendar.view',
      'tasks.view',
      'timeclock.punch',
      'notifications.receive',
    ],
    navigation: {
      home: true,
      inbox: true,
      calendar: true,
      work: true,
      more: true,
    },
  },
  contractor: {
    ...common,
    activePersona: 'contractor',
    capabilities: [
      'mobile.access',
      'communications.view',
      'communications.send',
      'calendar.view',
      'work.accept',
      'work.complete',
      'notifications.receive',
    ],
    navigation: {
      home: true,
      inbox: true,
      calendar: true,
      work: true,
      more: true,
    },
  },
};
