const { supabase } = require('./_lib/supabase');
const { corsHeaders, parseBody } = require('./_lib/helpers');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('pacientes').select('*').order('id');
      if (error) throw error;
      return res.status(200).set(headers).json(data);
    }

    if (req.method === 'POST') {
      const body = parseBody(req.body);
      if (!body.nombre || !body.curp) {
        return res.status(400).set(headers).json({ error: 'Nombre y CURP son obligatorios' });
      }
      const curpUpper = body.curp.toUpperCase();
      const { data: exists } = await supabase.from('pacientes').select('id').eq('curp', curpUpper).maybeSingle();
      if (exists) {
        return res.status(409).set(headers).json({ error: 'Ya existe un paciente con esa CURP' });
      }
      const payload = { ...body, curp: curpUpper };
      const { data, error } = await supabase.from('pacientes').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).set(headers).json(data);
    }

    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'No se pudieron obtener pacientes', detalle: e.message });
  }
};
