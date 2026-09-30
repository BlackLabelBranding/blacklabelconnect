import assert from 'node:assert/strict';
import test from 'node:test';

import { adaptMobileBootstrap } from './bootstrap.ts';

function response(overrides: Record<string, unknown> = {}) {
  return {
    contract: {
      name: 'black_label_connect.bootstrap',
      version: 1,
      generated_at: '2026-09-30T00:00:00Z',
      direct_tables: [],
      rpc_allowlist: ['mobile_bootstrap'],
    },
    identity: {
      id: 'user-1',
      email: 'lance@example.com',
      full_name: 'Lance Garza',
      avatar_url: null,
      team_member_id: 7,
    },
    authorization: {
      user_id: 'user-1',
      roles: ['employee'],
      capabilities: {
        communications: true,
        calendar: false,
        task_manager: true,
      },
      personas: ['user', 'employee'],
      is_super_admin: false,
    },
    accounts: [
      {
        id: 12,
        name: 'Black Label Branding',
        status: 'active',
        logo_url: null,
        access_role: 'employee',
      },
    ],
    active_account_id: 12,
    navigation: [
      { key: 'home', enabled: true },
      { key: 'communications', enabled: true },
      { key: 'calendar', enabled: false },
      { key: 'tasks', enabled: true },
      { key: 'talent', enabled: false },
    ],
    notifications: {
      unread_count: 3,
      preferences: {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        high_priority_only: false,
        quiet_hours: null,
      },
    },
    ...overrides,
  };
}

test('adapts the versioned RPC contract into the app model', () => {
  const bootstrap = adaptMobileBootstrap(response());

  assert.equal(bootstrap.user.displayName, 'Lance Garza');
  assert.equal(bootstrap.user.initials, 'LG');
  assert.equal(bootstrap.activeAccount.id, '12');
  assert.deepEqual(bootstrap.capabilities, ['communications', 'task_manager']);
  assert.deepEqual(bootstrap.navigation, {
    home: true,
    inbox: true,
    calendar: false,
    work: true,
    more: true,
  });
  assert.equal(bootstrap.notifications.unreadCount, 3);
});

test('maps contractor and talent authorization to the contractor experience', () => {
  const base = response();
  const bootstrap = adaptMobileBootstrap({
    ...base,
    authorization: {
      ...base.authorization,
      personas: ['user', 'talent'],
    },
    navigation: [
      { key: 'home', enabled: true },
      { key: 'tasks', enabled: false },
      { key: 'talent', enabled: true },
    ],
  });

  assert.equal(bootstrap.activePersona, 'contractor');
  assert.equal(bootstrap.navigation.work, true);
});

test('rejects incompatible contract versions', () => {
  const base = response();
  assert.throws(
    () =>
      adaptMobileBootstrap({
        ...base,
        contract: { ...base.contract, version: 2 },
      }),
    /not supported/,
  );
});
