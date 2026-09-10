const { supabase } = require('../../_lib/supabase');
const { corsHeaders, parseBody } = require('../../_lib/helpers');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

  const id = req.query.id;
  if (!id) return res.status(400).set(headers).json({ error: 'ID requerido' });

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single();
      if (error) throw error;
      if (!data) return res.status(404).set(headers).json({ error: 'Paciente no encontrado' });
      return res.status(200).set(headers).json(data);
    }

    if (req.method === 'PUT') {
      const body = parseBody(req.body);
      const { data, error } = await supabase.from('pacientes').update(body).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).set(headers).json(data);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).set(headers).json({ ok: true });
    }

    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'Error en paciente', detalle: e.message });
  }
};
