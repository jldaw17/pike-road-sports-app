import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req) => {
  try {
    const payload = await req.json();

    const record = payload.record;
    const oldRecord = payload.old_record;

    if (!record) {
      return new Response(JSON.stringify({ error: 'Missing record' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const oldAudio = oldRecord?.audio_live ?? false;
    const oldVideo = oldRecord?.video_live ?? false;
    const newAudio = record?.audio_live ?? false;
    const newVideo = record?.video_live ?? false;

    const audioJustWentLive = !oldAudio && newAudio;
    const videoJustWentLive = !oldVideo && newVideo;

    if (!audioJustWentLive && !videoJustWentLive) {
      return new Response(
        JSON.stringify({ message: 'No live transition detected' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let title = 'Sylacauga Athletics';
    let body = 'The Aggies are live now.';

    if (audioJustWentLive && videoJustWentLive) {
      title = 'Live Now: Audio + Video';
      body = 'Aggie Sports Network is live now with audio and video.';
    } else if (videoJustWentLive) {
      title = 'Live Now: Video Broadcast';
      body = 'The Aggies are live. Watch Now!';
    } else if (audioJustWentLive) {
      title = 'Live Now: Audio Broadcast';
      body = 'The Aggies are live. Listen Now!';
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
      `${supabaseUrl}/rest/v1/push_tokens?select=expo_push_token&notifications_enabled=eq.true`,
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
          screen: 'asn',
          audio_live: newAudio,
          video_live: newVideo,
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