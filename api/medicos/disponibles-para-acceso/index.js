const { supabase } = require('../../../_lib/supabase');
const { jsonResponse } = require('../../../_lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('../../../_lib/helpers').corsHeaders() };
  if (req.method !== 'GET') return jsonResponse(405, { error: 'Method Not Allowed' });

  try {
    const { data, error } = await supabase.from('medicos').select('id, nombre, email').not('email', 'is', null);
    if (error) throw error;
    const { data: admins } = await supabase.from('admins').select('medico_id');
    const adminIds = new Set((admins || []).map(a => a.medico_id));
    const filtered = (data || []).filter(m => !adminIds.has(m.id));
    return jsonResponse(200, filtered);
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'No se pudieron obtener medicos disponibles', detalle: e.message });
  }
};
