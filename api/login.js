const { supabase } = require('./_lib/supabase');
const { corsHeaders, parseBody, jsonResponse, errorResponse } = require('./_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const body = parseBody(req.body);
    const { email, password } = body || {};
    if (!email || !password) {
      return jsonResponse(400, { error: 'Faltan credenciales' });
    }

    const emailNorm = email.trim().toLowerCase();
    const passwordHash = crypto.createHash('sha512').update(password).digest('hex');

    const { data: admins, error: adminErr } = await supabase
      .from('admins')
      .select('id, email, role')
      .eq('email', emailNorm)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (adminErr) throw adminErr;
    if (admins) {
      return jsonResponse(200, { role: 'admin', user: admins });
    }

    const { data: docs, error: docErr } = await supabase
      .from('medicos')
      .select('id, nombre, area, email')
      .eq('email', emailNorm)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (docErr) throw docErr;
    if (docs) {
      return jsonResponse(200, { role: 'doctor', user: docs });
    }

    return jsonResponse(401, { error: 'Correo o contraseña incorrectos' });
  } catch (e) {
    console.error('Login error:', e);
    return jsonResponse(500, { error: 'No se pudo iniciar sesión', detalle: e.message });
  }
};
