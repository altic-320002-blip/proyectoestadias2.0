const { supabase } = require('./_lib/supabase');
const { jsonResponse, parseBody } = require('./_lib/helpers');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('./_lib/helpers').corsHeaders() };

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('citas')
        .select('id, paciente_id, medico_id, fecha, hora, motivo, estado, pacientes(nombre, curp), medicos(nombre, area)')
        .order('fecha', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map(c => ({
        id: c.id,
        paciente_id: c.paciente_id,
        medico_id: c.medico_id,
        fecha: c.fecha,
        hora: c.hora,
        motivo: c.motivo,
        estado: c.estado,
        paciente_nombre: c.pacientes?.nombre,
        paciente_curp: c.pacientes?.curp,
        medico_nombre: c.medicos?.nombre,
        medico_area: c.medicos?.area
      }));
      return jsonResponse(200, mapped);
    }

    if (req.method === 'POST') {
      const c = parseBody(req.body);
      if (!c.paciente_id || !c.fecha || !c.hora) {
        return jsonResponse(400, { error: 'Faltan campos obligatorios' });
      }
      const payload = { ...c, estado: c.estado || 'Agendada' };
      const { data, error } = await supabase.from('citas').insert(payload).select().single();
      if (error) throw error;
      return jsonResponse(201, data);
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'No se pudieron obtener las citas', detalle: e.message });
  }
};
