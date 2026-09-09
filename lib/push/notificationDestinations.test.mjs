import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findNotificationStory,
  getNotificationResponseKey,
  markNotificationResponseHandled,
  parseNotificationStoryPath,
  resolveNotificationDestination,
  resolvePendingNotificationStory,
} from './notificationDestinations.ts';

const storyId = '123e4567-e89b-12d3-a456-426614174000';
const story = { id: storyId, slug: 'season-opener', title: 'Season opener' };
const campbellOptions = {
  currentSchoolSlug: 'campbell',
  approvedStoryOrigins: [
    'https://campbellspartans.com',
    'https://athleticos.ai/campbell',
  ],
};

test('resolves StoryOS UUID and gives it priority over the slug', () => {
  assert.deepEqual(resolveNotificationDestination({
    source_type: 'StoryOS',
    source_id: storyId,
    target_url: '/sylacauga/news/different-story',
  }), {
    kind: 'story',
    storyId,
    storySlug: 'different-story',
    schoolId: undefined,
    schoolSlug: undefined,
    pathSchoolSlug: 'sylacauga',
  });
  assert.equal(findNotificationStory({
    kind: 'story',
    storyId,
    storySlug: 'different-story',
  }, [story, { id: 'other', slug: 'different-story' }]), story);
});

test('parses only strict school news paths', () => {
  assert.deepEqual(parseNotificationStoryPath('/sylacauga/news/season-opener'), {
    schoolSlug: 'sylacauga',
    storySlug: 'season-opener',
  });
  assert.equal(parseNotificationStoryPath('/sylacauga/news/../secret'), null);
  assert.equal(parseNotificationStoryPath('/sylacauga/sports/football'), null);
});

test('valid story UUID survives a malformed target URL', () => {
  const result = resolveNotificationDestination({
    source_type: 'story',
    source_id: storyId,
    target_url: 'not a URL',
  });
  assert.equal(result.kind, 'story');
  assert.equal(result.kind === 'story' ? result.storyId : null, storyId);
});

test('accepts safe external URLs and rejects unsupported or malformed targets', () => {
  assert.equal(resolveNotificationDestination({ target_url: 'https://example.com/story' }).kind, 'external');
  assert.equal(resolveNotificationDestination({ target_url: 'http://example.com/story' }).kind, 'external');
  for (const target_url of [
    'javascript:alert(1)',
    'data:text/plain,test',
    'file:///tmp/test',
    'intent://story',
    'https://',
  ]) {
    assert.equal(resolveNotificationDestination({ target_url }).kind, 'invalid');
  }
});

test('resolves approved same-school absolute story URLs before generic external URLs', () => {
  assert.deepEqual(resolveNotificationDestination({
    target_url:
      'https://www.campbellspartans.com/campbell/news/spartans-open-season-with-34-24-victory-over-wheeler',
  }, campbellOptions), {
    kind: 'story',
    storyId: undefined,
    storySlug: 'spartans-open-season-with-34-24-victory-over-wheeler',
    schoolId: undefined,
    schoolSlug: undefined,
    pathSchoolSlug: 'campbell',
  });
});

test('does not internalize absolute story paths for unapproved hosts or other schools', () => {
  assert.equal(resolveNotificationDestination({
    target_url: 'https://some-other-school.com/campbell/news/season-opener',
  }, campbellOptions).kind, 'external');
  assert.equal(resolveNotificationDestination({
    target_url: 'https://www.campbellspartans.com/prattville/news/season-opener',
  }, campbellOptions).kind, 'external');
  assert.equal(resolveNotificationDestination({
    target_url: 'https://www.campbellspartans.com/other/path',
  }, campbellOptions).kind, 'external');
});

test('keeps StoryOS UUID priority over absolute target URLs', () => {
  const result = resolveNotificationDestination({
    source_type: 'story',
    source_id: storyId,
    target_url: 'https://www.campbellspartans.com/campbell/news/different-story',
  }, campbellOptions);
  assert.equal(result.kind, 'story');
  assert.equal(result.kind === 'story' ? result.storyId : null, storyId);
  assert.equal(result.kind === 'story' ? result.storySlug : null, undefined);
});

test('returns none for empty and legacy payloads', () => {
  assert.deepEqual(resolveNotificationDestination(undefined), { kind: 'none' });
  assert.deepEqual(resolveNotificationDestination({ campaign: 'legacy' }), { kind: 'none' });
});

test('rejects wrong-school slugs and IDs, including same-slug stories', () => {
  const slugMismatch = resolvePendingNotificationStory({
    kind: 'story', storySlug: 'season-opener', pathSchoolSlug: 'prattville',
  }, {
    currentSchoolSlug: 'sylacauga', currentSchoolId: 'school-1', schoolReady: true,
    storiesReady: true, stories: [story],
  });
  assert.equal(slugMismatch.status, 'rejected');

  const idMismatch = resolvePendingNotificationStory({
    kind: 'story', storyId, schoolId: 'school-2',
  }, {
    currentSchoolSlug: 'sylacauga', currentSchoolId: 'school-1', schoolReady: true,
    storiesReady: true, stories: [story],
  });
  assert.equal(idMismatch.status, 'rejected');
  assert.equal(resolveNotificationDestination({
    source_type: 'story', source_id: storyId, schoolSlug: '../sylacauga',
  }).kind, 'invalid');
});

test('waits for readiness, opens after load, and fails safely when missing', () => {
  const destination = { kind: 'story', storyId };
  const base = { currentSchoolSlug: 'sylacauga', currentSchoolId: 'school-1' };
  assert.equal(resolvePendingNotificationStory(destination, {
    ...base, schoolReady: false, storiesReady: false, stories: [],
  }).status, 'wait');
  assert.equal(resolvePendingNotificationStory(destination, {
    ...base, schoolReady: true, storiesReady: false, stories: [],
  }).status, 'wait');
  assert.equal(resolvePendingNotificationStory(destination, {
    ...base, schoolReady: true, storiesReady: true, stories: [story],
  }).status, 'open');
  assert.equal(resolvePendingNotificationStory(destination, {
    ...base, schoolReady: true, storiesReady: true, stories: [],
  }).status, 'missing');
});

test('falls back to a school-scoped slug when UUID is unavailable', () => {
  const result = resolveNotificationDestination({
    target_url: '/sylacauga/news/season-opener',
  });
  assert.equal(result.kind, 'story');
  assert.equal(result.kind === 'story' ? findNotificationStory(result, [story]) : null, story);
});

test('deduplicates response identifiers and bounds retained history', () => {
  const handled = new Set();
  const key = getNotificationResponseKey({
    actionIdentifier: 'default',
    notification: { request: { identifier: 'notification-1' } },
  });
  assert.equal(markNotificationResponseHandled(handled, key, 2), true);
  assert.equal(markNotificationResponseHandled(handled, key, 2), false);
  assert.equal(markNotificationResponseHandled(handled, 'notification-2::default', 2), true);
  assert.equal(markNotificationResponseHandled(handled, 'notification-3::default', 2), true);
  assert.equal(handled.has(key), false);
});
