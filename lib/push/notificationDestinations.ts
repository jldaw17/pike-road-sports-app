export type NotificationPayload = Record<string, unknown>;

export type NotificationStoryDestination = {
  kind: 'story';
  storyId?: string;
  storySlug?: string;
  schoolId?: string;
  schoolSlug?: string;
  pathSchoolSlug?: string;
};

export type NotificationDestination =
  | NotificationStoryDestination
  | { kind: 'external'; url: string }
  | { kind: 'none' }
  | { kind: 'invalid' };

type NotificationDestinationOptions = {
  currentSchoolSlug?: string;
  approvedStoryOrigins?: Array<string | null | undefined>;
};

export type NotificationStoryRecord = {
  id?: string;
  slug?: string;
};

export type PendingStoryResolution<T extends NotificationStoryRecord> =
  | { status: 'wait' }
  | { status: 'open'; story: T }
  | { status: 'missing' }
  | { status: 'rejected' };

const STORY_SOURCE_TYPES = new Set(['story', 'storyos']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

function readPayloadString(payload: NotificationPayload, key: string) {
  const value = payload[key];
  return typeof value === 'string' ? value.trim() : '';
}

function decodeSlug(value: string) {
  try {
    const decoded = decodeURIComponent(value).trim().toLowerCase();
    return SLUG_PATTERN.test(decoded) ? decoded : '';
  } catch {
    return '';
  }
}

export function parseNotificationStoryPath(value: string) {
  const match = value.trim().match(/^\/([^/?#]+)\/news\/([^/?#]+)\/?$/i);
  if (!match) {
    return null;
  }

  const schoolSlug = decodeSlug(match[1] ?? '');
  const storySlug = decodeSlug(match[2] ?? '');
  if (!schoolSlug || !storySlug) {
    return null;
  }

  return { schoolSlug, storySlug };
}

export function resolveSafeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, '');
}

function parseApprovedAbsoluteStoryPath(
  value: string,
  options?: NotificationDestinationOptions
) {
  const currentSchoolSlug = decodeSlug(options?.currentSchoolSlug ?? '');
  if (!currentSchoolSlug) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    const storyPath = parseNotificationStoryPath(parsed.pathname);
    if (!storyPath || storyPath.schoolSlug !== currentSchoolSlug) {
      return null;
    }

    const approvedHosts = new Set(
      (options?.approvedStoryOrigins ?? []).flatMap((origin) => {
        try {
          return origin ? [normalizeHostname(new URL(origin).hostname)] : [];
        } catch {
          return [];
        }
      })
    );

    return approvedHosts.has(normalizeHostname(parsed.hostname)) ? storyPath : null;
  } catch {
    return null;
  }
}

export function resolveNotificationDestination(
  payload: NotificationPayload | null | undefined,
  options?: NotificationDestinationOptions
): NotificationDestination {
  if (!payload) {
    return { kind: 'none' };
  }

  const sourceType = readPayloadString(payload, 'source_type').toLowerCase();
  const sourceId = readPayloadString(payload, 'source_id');
  const targetUrl = readPayloadString(payload, 'target_url');
  const payloadSchoolId = readPayloadString(payload, 'schoolId');
  const rawPayloadSchoolSlug = readPayloadString(payload, 'schoolSlug');
  const payloadSchoolSlug = decodeSlug(rawPayloadSchoolSlug);
  const relativeStoryPath = targetUrl.startsWith('/') && !targetUrl.startsWith('//')
    ? parseNotificationStoryPath(targetUrl)
    : null;
  const isStorySource = STORY_SOURCE_TYPES.has(sourceType);
  const storyId = UUID_PATTERN.test(sourceId) ? sourceId.toLowerCase() : '';
  const storyPath =
    relativeStoryPath ||
    (storyId ? null : parseApprovedAbsoluteStoryPath(targetUrl, options));

  if ((isStorySource && storyId) || storyPath) {
    if (rawPayloadSchoolSlug && !payloadSchoolSlug) {
      return { kind: 'invalid' };
    }
    return {
      kind: 'story',
      storyId: storyId || undefined,
      storySlug: storyPath?.storySlug,
      schoolId: payloadSchoolId || undefined,
      schoolSlug: payloadSchoolSlug || undefined,
      pathSchoolSlug: storyPath?.schoolSlug,
    };
  }

  if (targetUrl) {
    if (targetUrl.startsWith('/')) {
      return { kind: 'invalid' };
    }
    const externalUrl = resolveSafeExternalUrl(targetUrl);
    return externalUrl ? { kind: 'external', url: externalUrl } : { kind: 'invalid' };
  }

  return isStorySource || sourceId || sourceType ? { kind: 'invalid' } : { kind: 'none' };
}

function normalizeComparable(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value).trim().toLowerCase();
}

export function isNotificationStoryForSchool(
  destination: NotificationStoryDestination,
  currentSchoolSlug: string,
  currentSchoolId?: string | number | null
) {
  const expectedSlug = normalizeComparable(currentSchoolSlug);
  const payloadSlug = normalizeComparable(destination.schoolSlug);
  const pathSlug = normalizeComparable(destination.pathSchoolSlug);
  const expectedId = normalizeComparable(currentSchoolId);
  const payloadId = normalizeComparable(destination.schoolId);

  if ((payloadSlug && payloadSlug !== expectedSlug) || (pathSlug && pathSlug !== expectedSlug)) {
    return false;
  }
  if (payloadSlug && pathSlug && payloadSlug !== pathSlug) {
    return false;
  }
  return !(payloadId && expectedId && payloadId !== expectedId);
}

export function findNotificationStory<T extends NotificationStoryRecord>(
  destination: NotificationStoryDestination,
  stories: T[]
) {
  if (destination.storyId) {
    const storyId = destination.storyId.toLowerCase();
    const idMatch = stories.find((story) => story.id?.trim().toLowerCase() === storyId);
    if (idMatch) {
      return idMatch;
    }
  }

  if (destination.storySlug) {
    const storySlug = destination.storySlug.toLowerCase();
    return stories.find((story) => story.slug?.trim().toLowerCase() === storySlug) ?? null;
  }

  return null;
}

export function resolvePendingNotificationStory<T extends NotificationStoryRecord>(
  destination: NotificationStoryDestination,
  options: {
    currentSchoolSlug: string;
    currentSchoolId?: string | number | null;
    schoolReady: boolean;
    storiesReady: boolean;
    stories: T[];
  }
): PendingStoryResolution<T> {
  if (!options.schoolReady) {
    return { status: 'wait' };
  }
  if (!isNotificationStoryForSchool(
    destination,
    options.currentSchoolSlug,
    options.currentSchoolId
  )) {
    return { status: 'rejected' };
  }
  if (!options.storiesReady) {
    return { status: 'wait' };
  }

  const story = findNotificationStory(destination, options.stories);
  return story ? { status: 'open', story } : { status: 'missing' };
}

export function getNotificationResponseKey(response: {
  actionIdentifier: string;
  notification: { request: { identifier: string } };
}) {
  return `${response.notification.request.identifier}::${response.actionIdentifier}`;
}

export function markNotificationResponseHandled(
  handledKeys: Set<string>,
  responseKey: string,
  maxEntries = 32
) {
  if (!responseKey || handledKeys.has(responseKey)) {
    return false;
  }

  handledKeys.add(responseKey);
  while (handledKeys.size > maxEntries) {
    const oldestKey = handledKeys.values().next().value;
    if (typeof oldestKey !== 'string') {
      break;
    }
    handledKeys.delete(oldestKey);
  }
  return true;
}
