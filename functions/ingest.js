// Netlify Function: POST /.netlify/functions/ingest
import { createClient } from '@supabase/supabase-js';

export default async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // very simple auth via header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.INGEST_API_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    let payload;
    try { payload = await req.json(); }
    catch { return new Response('Bad JSON', { status: 400 }); }

    const row = {
      device_id: payload.device_id || 'unknown',
      ts_ms: Number(payload.ts ?? Date.now()),
      temperature: payload.temperature ?? null,
      humidity: payload.humidity ?? null,
      received_at: new Date().toISOString()
    };

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // server-side only
    );

    const { error } = await supabase.from('readings').insert(row);
    if (error) {
      return new Response(JSON.stringify({ status: 'error', error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'error', error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
