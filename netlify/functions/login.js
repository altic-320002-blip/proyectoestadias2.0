const { supabase } = require('./_supabase');
const { json, parseBody, corsHeaders } = require('./_helpers');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  try {
    const body = parseBody(event);
    const { email, password } = body || {};
    if (!email || !password) return json(400, { error: 'Faltan credenciales' });

    const emailNorm = email.trim().toLowerCase();
    const passwordHash = crypto.createHash('sha512').update(password).digest('hex');

    const { data: admins } = await supabase.from('admins').select('id, email, role').eq('email', emailNorm).eq('password_hash', passwordHash).maybeSingle();
    if (admins) return json(200, { role: 'admin', user: admins });

    const { data: docs } = await supabase.from('medicos').select('id, nombre, area, email').eq('email', emailNorm).eq('password_hash', passwordHash).maybeSingle();
    if (docs) return json(200, { role: 'doctor', user: docs });

    return json(401, { error: 'Correo o contraseña incorrectos' });
  } catch (e) {
    return json(500, { error: 'No se pudo iniciar sesión', detalle: e.message });
  }
};
