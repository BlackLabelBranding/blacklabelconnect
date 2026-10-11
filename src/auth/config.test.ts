import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BLACK_LABEL_AUTH_PROJECT_REF,
  validateSharedAuthUrl,
} from './config.ts';

test('accepts the shared Black Label Supabase Auth project', () => {
  assert.equal(
    validateSharedAuthUrl(`https://${BLACK_LABEL_AUTH_PROJECT_REF}.supabase.co`),
    null,
  );
});

test('rejects a different Supabase project', () => {
  assert.match(
    validateSharedAuthUrl('https://another-project.supabase.co'),
    /shared Black Label authentication project/,
  );
});

test('rejects missing and insecure auth URLs', () => {
  assert.match(validateSharedAuthUrl(undefined), /EXPO_PUBLIC_SUPABASE_URL/);
  assert.match(
    validateSharedAuthUrl(`http://${BLACK_LABEL_AUTH_PROJECT_REF}.supabase.co`),
    /shared Black Label authentication project/,
  );
});
