import assert from 'node:assert/strict';
import test from 'node:test';

import type { MobileBootstrap } from './contracts/bootstrap.ts';
import { canOpenTab, getEnabledTabs } from './navigation.ts';

const bootstrap: MobileBootstrap = {
  contractVersion: 1,
  user: { id: 'user-1', displayName: 'Test User', initials: 'TU', status: 'active' },
  activePersona: 'employee',
  personas: ['user', 'employee'],
  activeAccount: { id: '1', name: 'Black Label' },
  memberships: [],
  capabilities: [],
  navigation: { home: true, inbox: true, calendar: true, work: true, more: true },
  notifications: { unreadCount: 0, deviceRegistered: false },
};

test('returns the five enabled tabs in stable order', () => {
  assert.deepEqual(getEnabledTabs(bootstrap), [
    'home',
    'inbox',
    'calendar',
    'work',
    'more',
  ]);
});

test('denies all navigation when the server disables every tab', () => {
  const fixture: MobileBootstrap = {
    ...bootstrap,
    navigation: { home: false, inbox: false, calendar: false, work: false, more: false },
  };

  assert.deepEqual(getEnabledTabs(fixture), []);
  assert.equal(canOpenTab(fixture, 'home'), false);
});

test('honors server-controlled navigation flags', () => {
  const fixture = {
    ...bootstrap,
    navigation: { ...bootstrap.navigation, calendar: false },
  };

  assert.equal(canOpenTab(fixture, 'calendar'), false);
  assert.equal(canOpenTab(fixture, 'work'), true);
});
