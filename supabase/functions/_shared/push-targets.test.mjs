import test from 'node:test';
import assert from 'node:assert/strict';

import {
  dedupeExpoPushTokens,
  resolvePushScope,
} from './push-targets.mjs';

test('resolvePushScope prefers explicit school_slug and preserves app_name fallback', () => {
  assert.deepEqual(
    resolvePushScope(
      { school_slug: 'Comer', app_name: 'legacy-comer' },
      {}
    ),
    {
      schoolSlug: 'comer',
      appName: 'legacy-comer',
    }
  );
});

test('resolvePushScope falls back to app_name when school_slug is missing', () => {
  assert.deepEqual(
    resolvePushScope(
      { app_name: 'wetumpka' },
      {}
    ),
    {
      schoolSlug: '',
      appName: 'wetumpka',
    }
  );
});

test('resolvePushScope can use old_record values for backwards compatibility', () => {
  assert.deepEqual(
    resolvePushScope(
      {},
      { school_slug: 'opelika', app_name: 'opelika' }
    ),
    {
      schoolSlug: 'opelika',
      appName: 'opelika',
    }
  );
});

test('dedupeExpoPushTokens keeps only unique valid Expo tokens', () => {
  assert.deepEqual(
    dedupeExpoPushTokens([
      { expo_push_token: 'ExpoPushToken[abc]' },
      { expo_push_token: 'ExpoPushToken[abc]' },
      { expo_push_token: 'ExponentPushToken[legacy]' },
      { expo_push_token: '  ' },
      { expo_push_token: 'not-a-push-token' },
    ]),
    ['ExpoPushToken[abc]', 'ExponentPushToken[legacy]']
  );
});
