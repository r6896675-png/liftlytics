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
  var hevyKey = (body.hevy_api_key || '').trim();

  if (!username || !password || !hevyKey) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  var hash = hashPassword(password);

  var result = await supabase.from('users').insert({
    username: username,
    password_hash: hash,
    hevy_api_key: hevyKey,
    last_visit: new Date().toISOString()
  });

  if (result.error) {
    if (result.error.code === '23505') return res.status(400).json({ error: 'Username already taken' });
    return res.status(500).json({ error: 'Could not create account' });
  }

  return res.status(200).json({ success: true });
};
