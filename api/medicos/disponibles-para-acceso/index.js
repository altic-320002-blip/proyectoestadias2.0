const { supabase } = require('../../../_lib/supabase');
const { corsHeaders } = require('../../../_lib/helpers');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();
  if (req.method !== 'GET') return res.status(405).set(headers).json({ error: 'Method Not Allowed' });

  try {
    const { data, error } = await supabase.from('medicos').select('id, nombre, email').not('email', 'is', null);
    if (error) throw error;
    // Filter out those already in admins via separate query
    const { data: admins } = await supabase.from('admins').select('medico_id');
    const adminIds = new Set((admins || []).map(a => a.medico_id));
    const filtered = (data || []).filter(m => !adminIds.has(m.id));
    return res.status(200).set(headers).json(filtered);
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'No se pudieron obtener medicos disponibles', detalle: e.message });
  }
};
