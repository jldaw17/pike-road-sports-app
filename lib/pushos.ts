import { Platform } from 'react-native';

import { supabase } from './supabase';

function normalizeId(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function isMissingRelationError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? error.code : undefined;
  const message = 'message' in error && typeof error.message === 'string'
    ? error.message.toLowerCase()
    : '';

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('relation') && message.includes('does not exist')
  );
}

export async function registerDeviceToken(
  schoolId: string | number | null | undefined,
  token: string
) {
  const normalizedSchoolId = normalizeId(schoolId);
  const normalizedToken = token.trim();

  if (!normalizedSchoolId || !normalizedToken) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('device_push_tokens')
      .upsert(
        [
          {
            school_id: normalizedSchoolId,
            device_token: normalizedToken,
            platform: Platform.OS,
          },
        ],
        {
          onConflict: 'school_id,device_token',
        }
      );

    if (error) {
      if (isMissingRelationError(error)) {
        return null;
      }

      console.log('registerDeviceToken error:', error);
    }
  } catch (error) {
    console.log('registerDeviceToken unexpected error:', error);
  }

  return normalizedToken;
}

export async function subscribeToTeam(
  token: string,
  teamId: string,
  schoolId: string | number | null | undefined
) {
  const normalizedSchoolId = normalizeId(schoolId);
  const normalizedToken = token.trim();
  const normalizedTeamId = teamId.trim();

  if (!normalizedSchoolId || !normalizedToken || !normalizedTeamId) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('device_team_subscriptions')
      .upsert(
        [
          {
            device_token: normalizedToken,
            team_id: normalizedTeamId,
            school_id: normalizedSchoolId,
          },
        ],
        {
          onConflict: 'device_token,team_id,school_id',
        }
      );

    if (error) {
      if (isMissingRelationError(error)) {
        return null;
      }

      console.log('subscribeToTeam error:', error);
    }
  } catch (error) {
    console.log('subscribeToTeam unexpected error:', error);
  }

  return normalizedTeamId;
}

export async function unsubscribeFromTeam(token: string, teamId: string) {
  const normalizedToken = token.trim();
  const normalizedTeamId = teamId.trim();

  if (!normalizedToken || !normalizedTeamId) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('device_team_subscriptions')
      .delete()
      .eq('device_token', normalizedToken)
      .eq('team_id', normalizedTeamId);

    if (error) {
      if (isMissingRelationError(error)) {
        return null;
      }

      console.log('unsubscribeFromTeam error:', error);
    }
  } catch (error) {
    console.log('unsubscribeFromTeam unexpected error:', error);
  }

  return normalizedTeamId;
}

export async function getUserSubscriptions(token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return [] as string[];
  }

  try {
    const { data, error } = await supabase
      .from('device_team_subscriptions')
      .select('team_id')
      .eq('device_token', normalizedToken);

    if (error) {
      if (isMissingRelationError(error)) {
        return [];
      }

      console.log('getUserSubscriptions error:', error);
      return [];
    }

    return (data ?? [])
      .map((row) => {
        const value =
          row && typeof row === 'object' && 'team_id' in row ? row.team_id : '';
        return typeof value === 'string' ? value.trim() : '';
      })
      .filter(Boolean);
  } catch (error) {
    console.log('getUserSubscriptions unexpected error:', error);
    return [];
  }
}
