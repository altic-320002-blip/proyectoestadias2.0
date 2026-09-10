const { supabase } = require('./_lib/supabase');
const { jsonResponse, parseBody } = require('./_lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('./_lib/helpers').corsHeaders() };

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('pacientes').select('*').order('id');
      if (error) throw error;
      return jsonResponse(200, data);
    }

    if (req.method === 'POST') {
      const body = parseBody(req.body);
      if (!body.nombre || !body.curp) {
        return jsonResponse(400, { error: 'Nombre y CURP son obligatorios' });
      }
      const curpUpper = body.curp.toUpperCase();
      const { data: exists } = await supabase.from('pacientes').select('id').eq('curp', curpUpper).maybeSingle();
      if (exists) {
        return jsonResponse(409, { error: 'Ya existe un paciente con esa CURP' });
      }
      const payload = { ...body, curp: curpUpper };
      const { data, error } = await supabase.from('pacientes').insert(payload).select().single();
      if (error) throw error;
      return jsonResponse(201, data);
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'No se pudieron obtener pacientes', detalle: e.message });
  }
};
