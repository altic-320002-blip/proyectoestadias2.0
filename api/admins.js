const { supabase } = require('./_lib/supabase');
const { corsHeaders, parseBody } = require('./_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

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
      return res.status(200).set(headers).json(transformed);
    }

    if (req.method === 'POST') {
      const a = parseBody(req.body);
      if (a.medico_id && a.password) {
        const { data: med, error: medErr } = await supabase.from('medicos').select('id, email').eq('id', a.medico_id).single();
        if (medErr) throw medErr;
        if (!med.email) return res.status(400).set(headers).json({ error: 'El médico no tiene correo registrado' });
        const { data: exists } = await supabase.from('admins').select('id').eq('medico_id', a.medico_id).maybeSingle();
        if (exists) return res.status(409).set(headers).json({ error: 'Este médico ya tiene una cuenta de acceso' });
        const { data: emailExists } = await supabase.from('admins').select('id').eq('email', med.email.toLowerCase()).maybeSingle();
        if (emailExists) return res.status(409).set(headers).json({ error: 'Ya existe un admin con ese correo' });
        const password_hash = crypto.createHash('sha512').update(a.password).digest('hex');
        const payload = {
          email: med.email.toLowerCase(),
          password_hash,
          role: a.role || 'admin',
          medico_id: a.medico_id
        };
        const { data, error } = await supabase.from('admins').insert(payload).select('id, email, role, medico_id').single();
        if (error) throw error;
        return res.status(201).set(headers).json(data);
      }
      if (!a.email || !a.password) return res.status(400).set(headers).json({ error: 'Email y contrasena obligatorios' });
      const { data: exists } = await supabase.from('admins').select('id').eq('email', a.email.toLowerCase()).maybeSingle();
      if (exists) return res.status(409).set(headers).json({ error: 'Ya existe un admin con ese correo' });
      const password_hash = crypto.createHash('sha512').update(a.password).digest('hex');
      const payload = { email: a.email.toLowerCase(), password_hash, role: a.role || 'admin' };
      const { data, error } = await supabase.from('admins').insert(payload).select('id, email, role').single();
      if (error) throw error;
      return res.status(201).set(headers).json(data);
    }

    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'No se pudieron obtener los admins', detalle: e.message });
  }
};
