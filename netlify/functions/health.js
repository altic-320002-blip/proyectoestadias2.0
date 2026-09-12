const { json, corsHeaders } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  return json(200, { status: 'ok', source: 'netlify', db: true });
};
