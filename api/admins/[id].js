const { supabase } = require('../../_lib/supabase');
const { corsHeaders } = require('../../_lib/helpers');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

  const id = req.query.id;
  if (!id) return res.status(400).set(headers).json({ error: 'ID requerido' });

  try {
    if (req.method === 'DELETE') {
      const { data: count } = await supabase.from('admins').select('id', { count: 'exact', head: true });
      if ((count || 0) <= 1) {
        return res.status(400).set(headers).json({ error: 'Debe existir al menos un administrador' });
      }
      const { error } = await supabase.from('admins').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).set(headers).json({ ok: true });
    }
    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'Error admin', detalle: e.message });
  }
};
