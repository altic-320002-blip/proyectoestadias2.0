const { supabase } = require('./_supabase');
const { json, parseBody, corsHeaders } = require('./_helpers');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  const path = event.path || '';
  const parts = path.split('/').filter(Boolean);
  const id = parts[1];
  const sub = parts[1]; // for disponibles-para-acceso we check path contains

  // Handle /medicos/disponibles-para-acceso
  if (parts[1] === 'disponibles-para-acceso') {
    if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
    const { data } = await supabase.from('medicos').select('id, nombre, email').not('email', 'is', null);
    const { data: admins } = await supabase.from('admins').select('medico_id');
    const adminIds = new Set((admins || []).map(a => a.medico_id));
    const filtered = (data || []).filter(m => !adminIds.has(m.id));
    return json(200, filtered);
  }

  try {
    if (event.httpMethod === 'GET') {
      if (id) {
        const { data, error } = await supabase.from('medicos').select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return json(404, { error: 'Médico no encontrado' });
        return json(200, data);
      }
      const { data, error } = await supabase.from('medicos').select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').order('nombre');
      if (error) throw error;
      return json(200, data);
    }

    if (event.httpMethod === 'POST') {
      const d = parseBody(event);
      if (!d.nombre) return json(400, { error: 'El nombre es obligatorio' });
      const diasTrabaja = d.dias_trabaja || 'L-V';
      if (diasTrabaja !== 'L-V' && diasTrabaja !== 'S-D') return json(400, { error: "dias_trabaja debe ser 'L-V' o 'S-D'" });
      const password = d.password || 'Doctor123';
      const password_hash = crypto.createHash('sha512').update(password).digest('hex');
      const payload = {
        nombre: d.nombre,
        area: d.area,
        telefono: d.telefono,
        email: d.email ? d.email.toLowerCase() : null,
        password_hash,
        dias_trabaja: diasTrabaja,
        hora_entrada: d.hora_entrada || '08:00:00',
        hora_salida: d.hora_salida || '18:00:00'
      };
      const { data, error } = await supabase.from('medicos').insert(payload).select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').single();
      if (error) throw error;
      return json(201, data);
    }

    if (event.httpMethod === 'PUT') {
      if (!id) return json(400, { error: 'ID requerido' });
      const d = parseBody(event);
      let updatePayload = { ...d };
      if (d.password) {
        updatePayload.password_hash = crypto.createHash('sha512').update(d.password).digest('hex');
        delete updatePayload.password;
      }
      const { data, error } = await supabase.from('medicos').update(updatePayload).eq('id', id).select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').single();
      if (error) throw error;
      return json(200, data);
    }

    if (event.httpMethod === 'DELETE') {
      if (!id) return json(400, { error: 'ID requerido' });
      const { error } = await supabase.from('medicos').delete().eq('id', id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method Not Allowed' });
  } catch (e) {
    return json(500, { error: 'Error medicos', detalle: e.message });
  }
};
