const { supabase } = require('../../_lib/supabase');
const { corsHeaders, parseBody } = require('../../_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

  const id = req.query.id;
  if (!id) return res.status(400).set(headers).json({ error: 'ID requerido' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('medicos').select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').eq('id', id).single();
      if (error) throw error;
      return res.status(200).set(headers).json(data);
    }

    if (req.method === 'PUT') {
      const d = parseBody(req.body);
      let updatePayload = { ...d };
      if (d.password) {
        updatePayload.password_hash = crypto.createHash('sha512').update(d.password).digest('hex');
        delete updatePayload.password;
      }
      const { data, error } = await supabase.from('medicos').update(updatePayload).eq('id', id).select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').single();
      if (error) throw error;
      return res.status(200).set(headers).json(data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('medicos').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).set(headers).json({ ok: true });
    }

    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'Error medico', detalle: e.message });
  }
};
