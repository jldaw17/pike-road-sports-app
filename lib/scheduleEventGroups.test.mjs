import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSchedulePresentationItems,
  collectScheduleEventGroupIds,
  fetchPublicScheduleEventGroups,
  parsePublicScheduleEventGroups,
} from './scheduleEventGroups.ts';

const group = {
  id: 'group-1',
  school_id: 'school-1',
  sport_id: 'sport-1',
  season_id: 'season-1',
  name: 'Orange Beach Invitational',
  group_type: 'invitational',
  start_date: '2027-03-12',
  end_date: '2027-03-14',
  location_name: 'Orange Beach Sportsplex',
  logo_url: 'https://example.com/event-logo.png',
  website_url: 'https://example.com/tournament',
  sort_order: 0,
};

const game = (id, overrides = {}) => ({
  id,
  schoolId: 'school-1',
  sportId: 'sport-1',
  seasonId: 'season-1',
  eventGroupId: null,
  opponentName: 'TBD',
  opponentLogoUrl: 'https://example.com/opponent-logo.png',
  teamScore: 0,
  opponentScore: 0,
  ...overrides,
});

test('flat schedules remain flat and preserve existing game object identity', () => {
  const games = [game('one'), game('two')];
  assert.deepEqual(collectScheduleEventGroupIds(games), []);
  const result = buildSchedulePresentationItems({ games, groups: [], currentSchoolId: 'school-1' });
  assert.deepEqual(result.map((item) => item.type), ['game', 'game']);
  assert.equal(result[0].type === 'game' ? result[0].game : null, games[0]);
  assert.equal(result[1].type === 'game' ? result[1].game : null, games[1]);
});

test('valid groups emit once at the earliest visible child and do not get split', () => {
  const early = game('early', { eventGroupId: group.id, eventDate: '2027-03-12' });
  const standalone = game('standalone', { eventDate: '2027-03-13' });
  const late = game('late', { eventGroupId: group.id, eventDate: '2027-03-14' });
  const result = buildSchedulePresentationItems({
    games: [early, standalone, late],
    groups: [group],
    currentSchoolId: 'school-1',
  });
  assert.deepEqual(result.map((item) => item.type), ['group', 'game']);
  assert.deepEqual(result[0].type === 'group' ? result[0].games : [], [early, late]);
  assert.equal(result[1].type === 'game' ? result[1].game : null, standalone);
});

test('two groups stay separate and retain the already-sorted child order', () => {
  const secondGroup = { ...group, id: 'group-2', name: 'Spring Classic' };
  const games = [
    game('g1-a', { eventGroupId: group.id }),
    game('g2-a', { eventGroupId: secondGroup.id }),
    game('g1-b', { eventGroupId: group.id }),
    game('g2-b', { eventGroupId: secondGroup.id }),
  ];
  const result = buildSchedulePresentationItems({
    games,
    groups: [group, secondGroup],
    currentSchoolId: 'school-1',
  });
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].type === 'group' ? result[0].games : [], [games[0], games[2]]);
  assert.deepEqual(result[1].type === 'group' ? result[1].games : [], [games[1], games[3]]);
});

test('missing, wrong-school, wrong-sport, and wrong-season metadata falls back to games', () => {
  for (const invalidGroup of [
    null,
    { ...group, school_id: 'school-2' },
    { ...group, sport_id: 'sport-2' },
    { ...group, season_id: 'season-2' },
  ]) {
    const child = game('child', { eventGroupId: group.id });
    const result = buildSchedulePresentationItems({
      games: [child],
      groups: invalidGroup ? [invalidGroup] : [],
      currentSchoolId: 'school-1',
    });
    assert.equal(result[0].type, 'game');
    assert.equal(result[0].type === 'game' ? result[0].game : null, child);
  }
});

test('grouping preserves TBD, completed scores, and distinct event/opponent logos', () => {
  const child = game('child', {
    eventGroupId: group.id,
    opponentName: 'TBD',
    teamScore: 7,
    opponentScore: 3,
    isFinal: true,
  });
  const result = buildSchedulePresentationItems({
    games: [child],
    groups: [group],
    currentSchoolId: 'school-1',
  });
  assert.equal(result[0].type, 'group');
  if (result[0].type === 'group') {
    assert.equal(result[0].games[0], child);
    assert.equal(result[0].games[0].opponentName, 'TBD');
    assert.equal(result[0].games[0].teamScore, 7);
    assert.notEqual(result[0].group.logo_url, result[0].games[0].opponentLogoUrl);
  }
});

test('the metadata request is skipped for zero IDs and batches distinct IDs once', async () => {
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    assert.match(url, /ids=group-1%2Cgroup-2$/);
    return { ok: true, json: async () => ({ success: true, data: { groups: [group] } }) };
  };
  assert.deepEqual(await fetchPublicScheduleEventGroups({
    schoolSlug: 'sylacauga', groupIds: [], fetchImpl,
  }), []);
  assert.equal(calls, 0);
  const groups = await fetchPublicScheduleEventGroups({
    schoolSlug: 'Sylacauga', groupIds: ['group-1', 'group-2', 'group-1'], fetchImpl,
  });
  assert.equal(calls, 1);
  assert.deepEqual(groups, [group]);
});

test('network failures, HTTP failures, and malformed payloads return flat-safe metadata', async () => {
  assert.deepEqual(await fetchPublicScheduleEventGroups({
    schoolSlug: 'sylacauga', groupIds: ['group-1'], fetchImpl: async () => { throw new Error('offline'); },
  }), []);
  assert.deepEqual(await fetchPublicScheduleEventGroups({
    schoolSlug: 'sylacauga', groupIds: ['group-1'], fetchImpl: async () => ({ ok: false, json: async () => ({}) }),
  }), []);
  assert.deepEqual(parsePublicScheduleEventGroups({ success: true, data: { groups: [{ id: 'incomplete' }] } }), []);
  assert.deepEqual(parsePublicScheduleEventGroups({ success: true, data: { groups: 'invalid' } }), []);
});

test('grouping cannot restore games removed by existing filtering', () => {
  const included = game('included', { eventGroupId: group.id });
  const excluded = game('excluded', { eventGroupId: group.id });
  const alreadyFilteredGames = [included];
  const result = buildSchedulePresentationItems({
    games: alreadyFilteredGames,
    groups: [group],
    currentSchoolId: 'school-1',
  });
  assert.deepEqual(result[0].type === 'group' ? result[0].games : [], [included]);
  assert.ok(!JSON.stringify(result).includes(excluded.id));
});
