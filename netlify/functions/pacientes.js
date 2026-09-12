const { supabase } = require('./_supabase');
const { json, parseBody, corsHeaders } = require('./_helpers');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const id = parts[1]; // /pacientes or /pacientes/:id -> parts[0]=pacientes, parts[1]=id

  try {
    if (event.httpMethod === 'GET') {
      if (id) {
        const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return json(404, { error: 'Paciente no encontrado' });
        return json(200, data);
      }
      const { data, error } = await supabase.from('pacientes').select('*').order('id');
      if (error) throw error;
      return json(200, data);
    }

    if (event.httpMethod === 'POST') {
      const body = parseBody(event);
      if (!body.nombre || !body.curp) return json(400, { error: 'Nombre y CURP son obligatorios' });
      const curpUpper = body.curp.toUpperCase();
      const { data: exists } = await supabase.from('pacientes').select('id').eq('curp', curpUpper).maybeSingle();
      if (exists) return json(409, { error: 'Ya existe un paciente con esa CURP' });
      const payload = { ...body, curp: curpUpper };
      const { data, error } = await supabase.from('pacientes').insert(payload).select().single();
      if (error) throw error;
      return json(201, data);
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return json(400, { error: 'ID requerido' });
      const body = parseBody(event);
      const { data, error } = await supabase.from('pacientes').update(body).eq('id', id).select().single();
      if (error) throw error;
      return json(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return json(400, { error: 'ID requerido' });
      const { error } = await supabase.from('pacientes').delete().eq('id', id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method Not Allowed' });
  } catch (e) {
    return json(500, { error: 'Error pacientes', detalle: e.message });
  }
};
