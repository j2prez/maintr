export default async function handler(req, res) {
  try {
    const url = `https://riorzxpoxxtmrukvrqsy.supabase.co/rest/v1/assets?limit=1`;
    
    const response = await fetch(url, {
      headers: {
        apikey: process.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase returned ${response.status}`);
    }

    console.log('Keepalive ping successful:', new Date().toISOString());
    res.status(200).json({ ok: true, timestamp: new Date().toISOString() });

  } catch (err) {
    console.error('Keepalive ping failed:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}
