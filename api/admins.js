const { supabase } = require('./_lib/supabase');
const { jsonResponse, parseBody } = require('./_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('./_lib/helpers').corsHeaders() };

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('admins').select('id, email, role, is_active, created_at, last_login, medico_id, medicos!admins_medico_id_fkey(nombre)').order('id');
      if (error) throw error;
      const transformed = (data || []).map(a => ({
        id: a.id,
        email: a.email,
        role: a.role,
        is_active: a.is_active,
        created_at: a.created_at,
        last_login: a.last_login,
        medico_id: a.medico_id,
        medico_nombre: a.medicos?.nombre || null
      }));
      return jsonResponse(200, transformed);
    }

    if (req.method === 'POST') {
      const a = parseBody(req.body);
      if (a.medico_id && a.password) {
        const { data: med, error: medErr } = await supabase.from('medicos').select('id, email').eq('id', a.medico_id).single();
        if (medErr) throw medErr;
        if (!med.email) return jsonResponse(400, { error: 'El médico no tiene correo registrado' });
        const { data: exists } = await supabase.from('admins').select('id').eq('medico_id', a.medico_id).maybeSingle();
        if (exists) return jsonResponse(409, { error: 'Este médico ya tiene una cuenta de acceso' });
        const { data: emailExists } = await supabase.from('admins').select('id').eq('email', med.email.toLowerCase()).maybeSingle();
        if (emailExists) return jsonResponse(409, { error: 'Ya existe un admin con ese correo' });
        const password_hash = crypto.createHash('sha512').update(a.password).digest('hex');
        const payload = {
          email: med.email.toLowerCase(),
          password_hash,
          role: a.role || 'admin',
          medico_id: a.medico_id
        };
        const { data, error } = await supabase.from('admins').insert(payload).select('id, email, role, medico_id').single();
        if (error) throw error;
        return jsonResponse(201, data);
      }
      if (!a.email || !a.password) return jsonResponse(400, { error: 'Email y contrasena obligatorios' });
      const { data: exists } = await supabase.from('admins').select('id').eq('email', a.email.toLowerCase()).maybeSingle();
      if (exists) return jsonResponse(409, { error: 'Ya existe un admin con ese correo' });
      const password_hash = crypto.createHash('sha512').update(a.password).digest('hex');
      const payload = { email: a.email.toLowerCase(), password_hash, role: a.role || 'admin' };
      const { data, error } = await supabase.from('admins').insert(payload).select('id, email, role').single();
      if (error) throw error;
      return jsonResponse(201, data);
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'No se pudieron obtener los admins', detalle: e.message });
  }
};
