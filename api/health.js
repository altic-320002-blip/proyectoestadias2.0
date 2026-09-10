const { corsHeaders } = require('./_lib/helpers');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();
  return res.status(200).set(headers).json({ status: 'ok', source: 'vercel', db: true });
};
