const { supabase } = require('../../_lib/supabase');
const { jsonResponse, parseBody } = require('../../_lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('../../_lib/helpers').corsHeaders() };

  const id = req.query.id;
  if (!id) return jsonResponse(400, { error: 'ID requerido' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('citas').select('*').eq('id', id).single();
      if (error) throw error;
      return jsonResponse(200, data);
    }

    if (req.method === 'PUT') {
      const c = parseBody(req.body);
      const { data, error } = await supabase.from('citas').update(c).eq('id', id).select().single();
      if (error) throw error;
      return jsonResponse(200, data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('citas').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse(200, { ok: true });
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'Error cita', detalle: e.message });
  }
};
