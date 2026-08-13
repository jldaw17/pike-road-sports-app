function normalizeScopeValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
}

function normalizePushTokenValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (
    !trimmed.startsWith('ExpoPushToken[') &&
    !trimmed.startsWith('ExponentPushToken[')
  ) {
    return '';
  }

  return trimmed;
}

export function resolvePushScope(record = {}, oldRecord = {}) {
  const schoolSlug =
    normalizeScopeValue(record.school_slug) ||
    normalizeScopeValue(record.schoolSlug) ||
    normalizeScopeValue(oldRecord.school_slug) ||
    normalizeScopeValue(oldRecord.schoolSlug);
  const appName =
    normalizeScopeValue(record.app_name) ||
    normalizeScopeValue(record.appName) ||
    normalizeScopeValue(oldRecord.app_name) ||
    normalizeScopeValue(oldRecord.appName) ||
    schoolSlug;

  return {
    schoolSlug,
    appName,
  };
}

export function dedupeExpoPushTokens(rows = []) {
  const unique = [];
  const seen = new Set();

  for (const row of rows) {
    const token = normalizePushTokenValue(row?.expo_push_token);
    if (!token || seen.has(token)) {
      continue;
    }

    seen.add(token);
    unique.push(token);
  }

  return unique;
}
