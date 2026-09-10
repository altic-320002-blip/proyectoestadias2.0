const { supabase } = require('./_lib/supabase');
const { corsHeaders, parseBody } = require('./_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') {
    return res.status(200).set(headers).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = parseBody(req.body);
    const { email, password } = body || {};
    if (!email || !password) {
      return res.status(400).set(headers).json({ error: 'Faltan credenciales' });
    }

    const emailNorm = email.trim().toLowerCase();
    const passwordHash = crypto.createHash('sha512').update(password).digest('hex');

    // 1. Buscar en admins
    const { data: admins, error: adminErr } = await supabase
      .from('admins')
      .select('id, email, role')
      .eq('email', emailNorm)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (adminErr) throw adminErr;
    if (admins) {
      return res.status(200).set(headers).json({ role: 'admin', user: admins });
    }

    // 2. Buscar en medicos
    const { data: docs, error: docErr } = await supabase
      .from('medicos')
      .select('id, nombre, area, email')
      .eq('email', emailNorm)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (docErr) throw docErr;
    if (docs) {
      return res.status(200).set(headers).json({ role: 'doctor', user: docs });
    }

    return res.status(401).set(headers).json({ error: 'Correo o contraseña incorrectos' });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).set(headers).json({ error: 'No se pudo iniciar sesión', detalle: e.message });
  }
};
