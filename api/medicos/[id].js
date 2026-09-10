const { supabase } = require('../../_lib/supabase');
const { jsonResponse, parseBody } = require('../../_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('../../_lib/helpers').corsHeaders() };

  const id = req.query.id;
  if (!id) return jsonResponse(400, { error: 'ID requerido' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('medicos').select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').eq('id', id).single();
      if (error) throw error;
      return jsonResponse(200, data);
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
      return jsonResponse(200, data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('medicos').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'Error medico', detalle: e.message });
  }
};
