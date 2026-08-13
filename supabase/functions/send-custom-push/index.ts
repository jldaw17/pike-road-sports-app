import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  dedupeExpoPushTokens,
  resolvePushScope,
} from '../_shared/push-targets.mjs';

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ error: 'Missing record' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = record.id;
    const title = record.title;
    const body = record.body;
    const { schoolSlug, appName } = resolvePushScope(record);
    const sendNow = record.send_now ?? true;
    const alreadySent = record.sent ?? false;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing title or body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!sendNow || alreadySent) {
      return new Response(
        JSON.stringify({ message: 'Notification not eligible to send' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!schoolSlug && !appName) {
      return new Response(
        JSON.stringify({ error: 'Missing school scope for push delivery' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const headers = {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    };

    const tokenReads = await Promise.all([
      appName
        ? fetch(
            `${supabaseUrl}/rest/v1/push_tokens?select=expo_push_token&notifications_enabled=eq.true&app_name=eq.${encodeURIComponent(appName)}`,
            { headers }
          )
        : Promise.resolve(null),
      schoolSlug
        ? fetch(
            `${supabaseUrl}/rest/v1/app_push_tokens?select=expo_push_token&school_slug=eq.${encodeURIComponent(schoolSlug)}`,
            { headers }
          )
        : Promise.resolve(null),
    ]);

    const tokenPayloads = await Promise.all(
      tokenReads.map(async (response) => {
        if (!response) {
          return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      })
    );

    const tokens = dedupeExpoPushTokens(tokenPayloads.flat());

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = tokens.map((expoPushToken) => ({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: {
        type: 'custom',
        app_name: appName || schoolSlug,
        school_slug: schoolSlug || appName,
      },
    }));

    const expoResponse = await fetch(
      'https://exp.host/--/api/v2/push/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      }
    );

    const expoResult = await expoResponse.json();

    await fetch(`${supabaseUrl}/rest/v1/custom_notifications?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ sent: true }),
    });

    return new Response(JSON.stringify(expoResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
