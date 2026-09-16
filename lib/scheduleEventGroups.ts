export const PUBLIC_SCHEDULE_EVENT_GROUP_TYPES = [
  'tournament',
  'invitational',
  'classic',
  'showcase',
  'jamboree',
  'playoff',
  'meet',
  'other',
] as const;

export type PublicScheduleEventGroupType =
  (typeof PUBLIC_SCHEDULE_EVENT_GROUP_TYPES)[number];

export type PublicScheduleEventGroup = {
  id: string;
  school_id: string;
  sport_id: string;
  season_id: string;
  name: string;
  group_type: PublicScheduleEventGroupType;
  start_date: string | null;
  end_date: string | null;
  location_name: string | null;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
};

export type ScheduleGroupableGame = {
  id: string;
  schoolId?: string | number | null;
  sportId?: string | number | null;
  seasonId?: string | number | null;
  eventGroupId?: string | null;
};

export type SchedulePresentationItem<TGame extends ScheduleGroupableGame> =
  | { type: 'game'; game: TGame }
  | { type: 'group'; group: PublicScheduleEventGroup; games: TGame[] };

type PublicEventGroupsResponse = {
  success?: unknown;
  data?: {
    groups?: unknown;
  } | null;
};

type FetchLike = (
  input: string,
  init?: { method?: string; headers?: Record<string, string> }
) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

const ATHLETICOS_PUBLIC_API_BASE_URL = 'https://athleticos.ai';

function readRequiredString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNullableString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function parsePublicScheduleEventGroups(
  payload: unknown
): PublicScheduleEventGroup[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const response = payload as PublicEventGroupsResponse;
  const rows = response.success === true ? response.data?.groups : null;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') {
      return [];
    }

    const record = row as Record<string, unknown>;
    const id = readRequiredString(record, 'id');
    const schoolId = readRequiredString(record, 'school_id');
    const sportId = readRequiredString(record, 'sport_id');
    const seasonId = readRequiredString(record, 'season_id');
    const name = readRequiredString(record, 'name');
    const groupType = readRequiredString(record, 'group_type');

    if (
      !id ||
      !schoolId ||
      !sportId ||
      !seasonId ||
      !name ||
      !PUBLIC_SCHEDULE_EVENT_GROUP_TYPES.includes(
        groupType as PublicScheduleEventGroupType
      )
    ) {
      return [];
    }

    return [{
      id,
      school_id: schoolId,
      sport_id: sportId,
      season_id: seasonId,
      name,
      group_type: groupType as PublicScheduleEventGroupType,
      start_date: readNullableString(record, 'start_date'),
      end_date: readNullableString(record, 'end_date'),
      location_name: readNullableString(record, 'location_name'),
      logo_url: readNullableString(record, 'logo_url'),
      website_url: readNullableString(record, 'website_url'),
      sort_order:
        typeof record.sort_order === 'number' && Number.isFinite(record.sort_order)
          ? record.sort_order
          : 0,
    }];
  });
}

export function collectScheduleEventGroupIds(
  games: ScheduleGroupableGame[]
) {
  return Array.from(
    new Set(
      games
        .map((game) => game.eventGroupId?.trim() ?? '')
        .filter(Boolean)
    )
  );
}

export async function fetchPublicScheduleEventGroups({
  schoolSlug,
  groupIds,
  fetchImpl = fetch as FetchLike,
  baseUrl = ATHLETICOS_PUBLIC_API_BASE_URL,
}: {
  schoolSlug: string;
  groupIds: string[];
  fetchImpl?: FetchLike;
  baseUrl?: string;
}) {
  const normalizedSchoolSlug = schoolSlug.trim().toLowerCase();
  const distinctGroupIds = Array.from(
    new Set(groupIds.map((id) => id.trim()).filter(Boolean))
  );

  if (!normalizedSchoolSlug || distinctGroupIds.length === 0) {
    return [];
  }

  const endpoint =
    `${baseUrl.replace(/\/$/, '')}/api/appos/schedule-event-groups/` +
    `${encodeURIComponent(normalizedSchoolSlug)}?ids=${encodeURIComponent(
      distinctGroupIds.join(',')
    )}`;

  try {
    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return [];
    }

    return parsePublicScheduleEventGroups(await response.json());
  } catch {
    return [];
  }
}

function idsMatch(left: string | number | null | undefined, right: string) {
  if (left === undefined || left === null || left === '') {
    return true;
  }
  return String(left) === right;
}

export function eventGroupMatchesGameScope({
  group,
  game,
  currentSchoolId,
}: {
  group: PublicScheduleEventGroup;
  game: ScheduleGroupableGame;
  currentSchoolId?: string | number | null;
}) {
  return (
    idsMatch(currentSchoolId, group.school_id) &&
    idsMatch(game.schoolId, group.school_id) &&
    idsMatch(game.sportId, group.sport_id) &&
    idsMatch(game.seasonId, group.season_id)
  );
}

export function buildSchedulePresentationItems<
  TGame extends ScheduleGroupableGame,
>({
  games,
  groups,
  currentSchoolId,
}: {
  games: TGame[];
  groups: PublicScheduleEventGroup[];
  currentSchoolId?: string | number | null;
}): SchedulePresentationItem<TGame>[] {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const validGamesByGroup = new Map<string, TGame[]>();

  for (const game of games) {
    const groupId = game.eventGroupId?.trim() ?? '';
    const group = groupId ? groupsById.get(groupId) : null;
    if (!group || !eventGroupMatchesGameScope({ group, game, currentSchoolId })) {
      continue;
    }
    validGamesByGroup.set(groupId, [
      ...(validGamesByGroup.get(groupId) ?? []),
      game,
    ]);
  }

  const emittedGroupIds = new Set<string>();
  const items: SchedulePresentationItem<TGame>[] = [];

  for (const game of games) {
    const groupId = game.eventGroupId?.trim() ?? '';
    const group = groupId ? groupsById.get(groupId) : null;
    const groupedGames = groupId ? validGamesByGroup.get(groupId) : null;

    if (!group || !groupedGames?.includes(game)) {
      items.push({ type: 'game', game });
      continue;
    }
    if (emittedGroupIds.has(groupId)) {
      continue;
    }

    emittedGroupIds.add(groupId);
    items.push({ type: 'group', group, games: groupedGames });
  }

  return items;
}
