import assert from 'node:assert/strict';
import test from 'node:test';

import { bootstrapFixtures } from './fixtures/bootstrap.ts';
import { canOpenTab, getEnabledTabs } from './navigation.ts';

test('returns the five enabled tabs in stable order', () => {
  assert.deepEqual(getEnabledTabs(bootstrapFixtures.employee), [
    'home',
    'inbox',
    'calendar',
    'work',
    'more',
  ]);
});

test('denies all navigation when mobile access is absent', () => {
  const fixture = {
    ...bootstrapFixtures.employee,
    capabilities: bootstrapFixtures.employee.capabilities.filter(
      (capability) => capability !== 'mobile.access',
    ),
  };

  assert.deepEqual(getEnabledTabs(fixture), []);
  assert.equal(canOpenTab(fixture, 'home'), false);
});

test('honors server-controlled navigation flags', () => {
  const fixture = {
    ...bootstrapFixtures.contractor,
    navigation: { ...bootstrapFixtures.contractor.navigation, calendar: false },
  };

  assert.equal(canOpenTab(fixture, 'calendar'), false);
  assert.equal(canOpenTab(fixture, 'work'), true);
});
