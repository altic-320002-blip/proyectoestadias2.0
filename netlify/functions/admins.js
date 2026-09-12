const { supabase } = require('./_supabase');
const { json, parseBody, corsHeaders } = require('./_helpers');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const id = parts[1];

  try {
    if (event.httpMethod === 'GET') {
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
      return json(200, transformed);
    }

    if (event.httpMethod === 'POST') {
      const a = parseBody(event);
      if (a.medico_id && a.password) {
        const { data: med } = await supabase.from('medicos').select('id, email').eq('id', a.medico_id).single();
        if (!med?.email) return json(400, { error: 'El médico no tiene correo registrado' });
        const { data: exists } = await supabase.from('admins').select('id').eq('medico_id', a.medico_id).maybeSingle();
        if (exists) return json(409, { error: 'Este médico ya tiene una cuenta de acceso' });
        const { data: emailExists } = await supabase.from('admins').select('id').eq('email', med.email.toLowerCase()).maybeSingle();
        if (emailExists) return json(409, { error: 'Ya existe un admin con ese correo' });
        const password_hash = crypto.createHash('sha512').update(a.password).digest('hex');
        const payload = { email: med.email.toLowerCase(), password_hash, role: a.role || 'admin', medico_id: a.medico_id };
        const { data, error } = await supabase.from('admins').insert(payload).select('id, email, role, medico_id').single();
        if (error) throw error;
        return json(201, data);
      }
      if (!a.email || !a.password) return json(400, { error: 'Email y contrasena obligatorios' });
      const { data: exists } = await supabase.from('admins').select('id').eq('email', a.email.toLowerCase()).maybeSingle();
      if (exists) return json(409, { error: 'Ya existe un admin con ese correo' });
      const password_hash = crypto.createHash('sha512').update(a.password).digest('hex');
      const payload = { email: a.email.toLowerCase(), password_hash, role: a.role || 'admin' };
      const { data, error } = await supabase.from('admins').insert(payload).select('id, email, role').single();
      if (error) throw error;
      return json(201, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return json(400, { error: 'ID requerido' });
      const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
      if ((count || 0) <= 1) return json(400, { error: 'Debe existir al menos un administrador' });
      const { error } = await supabase.from('admins').delete().eq('id', id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method Not Allowed' });
  } catch (e) {
    return json(500, { error: 'Error admins', detalle: e.message });
  }
};
