const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var username = (req.body.username || '').trim().toLowerCase();
  if (!username) return res.status(400).json({ error: 'Username required' });

  var result = await supabase.from('users')
    .select('id, username, hevy_api_key, last_visit')
    .eq('username', username)
    .single();

  if (result.error || !result.data) return res.status(404).json({ error: 'User not found' });

  var user = result.data;
  var daysSince = (new Date() - new Date(user.last_visit)) / (1000 * 60 * 60 * 24);
  if (daysSince > 30) return res.status(401).json({ error: 'Session expired' });

  await supabase.from('users').update({ last_visit: new Date().toISOString() }).eq('id', user.id);

  return res.status(200).json({
    success: true,
    username: user.username,
    hevy_api_key: user.hevy_api_key
  });
};
