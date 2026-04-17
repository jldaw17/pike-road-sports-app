import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

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
    const appName = record.app_name ?? 'sylacauga';
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

    const tokenResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_tokens?select=expo_push_token&notifications_enabled=eq.true&app_name=eq.${appName}`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const tokens = await tokenResponse.json();

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return new Response(JSON.stringify({ message: 'No tokens found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = tokens
      .filter((item) => item.expo_push_token)
      .map((item) => ({
        to: item.expo_push_token,
        sound: 'default',
        title,
        body,
        data: {
          type: 'custom',
          app_name: appName,
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