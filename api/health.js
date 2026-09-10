const { corsHeaders, jsonResponse } = require('./_lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  return jsonResponse(200, { status: 'ok', source: 'vercel', db: true });
};
