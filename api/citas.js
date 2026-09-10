const { supabase } = require('./_lib/supabase');
const { corsHeaders, parseBody } = require('./_lib/helpers');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

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
      return res.status(200).set(headers).json(mapped);
    }

    if (req.method === 'POST') {
      const c = parseBody(req.body);
      if (!c.paciente_id || !c.fecha || !c.hora) {
        return res.status(400).set(headers).json({ error: 'Faltan campos obligatorios' });
      }
      const payload = { ...c, estado: c.estado || 'Agendada' };
      const { data, error } = await supabase.from('citas').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).set(headers).json(data);
    }

    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'No se pudieron obtener las citas', detalle: e.message });
  }
};
