function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(data)
  };
}

function errorResponse(statusCode, message) {
  return jsonResponse(statusCode, { error: message });
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try { return JSON.parse(body); } catch { return {}; }
}

module.exports = { corsHeaders, jsonResponse, errorResponse, parseBody };
