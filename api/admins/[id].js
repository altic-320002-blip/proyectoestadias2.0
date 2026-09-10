const { supabase } = require('../../_lib/supabase');
const { jsonResponse } = require('../../_lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('../../_lib/helpers').corsHeaders() };

  const id = req.query.id;
  if (!id) return jsonResponse(400, { error: 'ID requerido' });

  try {
    if (req.method === 'DELETE') {
      const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
      if ((count || 0) <= 1) {
        return jsonResponse(400, { error: 'Debe existir al menos un administrador' });
      }
      const { error } = await supabase.from('admins').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse(200, { ok: true });
    }
    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'Error admin', detalle: e.message });
  }
};
