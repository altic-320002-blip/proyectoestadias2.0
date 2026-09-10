const { supabase } = require('./_lib/supabase');
const { corsHeaders, parseBody } = require('./_lib/helpers');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const headers = corsHeaders();
  if (req.method === 'OPTIONS') return res.status(200).set(headers).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('medicos').select('id, nombre, area, telefono, email, dias_trabaja, hora_entrada, hora_salida').order('nombre');
      if (error) throw error;
      return res.status(200).set(headers).json(data);
    }

    if (req.method === 'POST') {
      const d = parseBody(req.body);
      if (!d.nombre) return res.status(400).set(headers).json({ error: 'El nombre es obligatorio' });
      const diasTrabaja = d.dias_trabaja || 'L-V';
      if (diasTrabaja !== 'L-V' && diasTrabaja !== 'S-D') {
        return res.status(400).set(headers).json({ error: "dias_trabaja debe ser 'L-V' o 'S-D'" });
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
      return res.status(201).set(headers).json(data);
    }

    return res.status(405).set(headers).json({ error: 'Method Not Allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).set(headers).json({ error: 'No se pudieron obtener medicos', detalle: e.message });
  }
};
