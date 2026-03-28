const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + process.env.SALT).digest('hex');
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = req.body;
  var username = (body.username || '').trim().toLowerCase();
  var password = body.password || '';

  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  var hash = hashPassword(password);

  var result = await supabase.from('users')
    .select('id, username, hevy_api_key, last_visit')
    .eq('username', username)
    .eq('password_hash', hash)
    .single();

  if (result.error || !result.data) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  var user = result.data;
  var lastVisit = new Date(user.last_visit);
  var now = new Date();
  var daysSince = (now - lastVisit) / (1000 * 60 * 60 * 24);

  if (daysSince > 30) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  await supabase.from('users').update({ last_visit: now.toISOString() }).eq('id', user.id);

  return res.status(200).json({
    success: true,
    username: user.username,
    hevy_api_key: user.hevy_api_key
  });
};
