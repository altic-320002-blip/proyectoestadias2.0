const { supabase } = require('./_lib/supabase');
const { jsonResponse, parseBody } = require('./_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return { statusCode: 200, headers: require('./_lib/helpers').corsHeaders() };

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('medicos').select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').order('nombre');
      if (error) throw error;
      return jsonResponse(200, data);
    }

    if (req.method === 'POST') {
      const d = parseBody(req.body);
      if (!d.nombre) return jsonResponse(400, { error: 'El nombre es obligatorio' });
      const diasTrabaja = d.dias_trabaja || 'L-V';
      if (diasTrabaja !== 'L-V' && diasTrabaja !== 'S-D') {
        return jsonResponse(400, { error: "dias_trabaja debe ser 'L-V' o 'S-D'" });
      }
      const horaEntrada = d.hora_entrada || '08:00:00';
      const horaSalida = d.hora_salida || '18:00:00';
      const password = d.password || 'Doctor123';
      const password_hash = crypto.createHash('sha512').update(password).digest('hex');
      const payload = {
        nombre: d.nombre,
        area: d.area,
        telefono: d.telefono,
        email: d.email ? d.email.toLowerCase() : null,
        password_hash,
        dias_trabaja: diasTrabaja,
        hora_entrada: horaEntrada,
        hora_salida: horaSalida
      };
      const { data, error } = await supabase.from('medicos').insert(payload).select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').single();
      if (error) throw error;
      return jsonResponse(201, data);
    }

    return jsonResponse(405, { error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return jsonResponse(500, { error: 'No se pudieron obtener medicos', detalle: e.message });
  }
};
