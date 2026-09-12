const { supabase } = require('./_supabase');
const { json, parseBody, corsHeaders } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const id = parts[1];

  try {
    if (event.httpMethod === 'GET') {
      if (id) {
        const { data, error } = await supabase.from('citas').select('*').eq('id', id).single();
        if (error) throw error;
        return json(200, data);
      }
      const { data, error } = await supabase.from('citas').select('id, paciente_id, medico_id, fecha, hora, motivo, estado, pacientes(nombre, curp), medicos(nombre, area)').order('fecha', { ascending: false });
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
      return json(200, mapped);
    }

    if (event.httpMethod === 'POST') {
      const c = parseBody(event);
      if (!c.paciente_id || !c.fecha || !c.hora) return json(400, { error: 'Faltan campos obligatorios' });
      const payload = { ...c, estado: c.estado || 'Agendada' };
      const { data, error } = await supabase.from('citas').insert(payload).select().single();
      if (error) throw error;
      return json(201, data);
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return json(400, { error: 'ID requerido' });
      const c = parseBody(event);
      const { data, error } = await supabase.from('citas').update(c).eq('id', id).select().single();
      if (error) throw error;
      return json(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return json(400, { error: 'ID requerido' });
      const { error } = await supabase.from('citas').delete().eq('id', id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method Not Allowed' });
  } catch (e) {
    return json(500, { error: 'Error citas', detalle: e.message });
  }
};
