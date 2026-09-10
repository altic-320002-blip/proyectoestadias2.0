// Realtime Supabase para actualizar la UI sin polling
document.addEventListener('DOMContentLoaded', () => {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || window.SUPABASE_URL.includes('TU_PROYECTO')) {
    console.info('Supabase no configurado, realtime desactivado');
    return;
  }
  try {
    const { createClient } = window.supabase;
    const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    const tables = ['pacientes', 'medicos', 'citas', 'admins'];
    tables.forEach(table => {
      supabase.channel(`realtime:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
          console.log(`Cambio en ${table}`, payload);
          // Disparar sincronización existente
          if (typeof window.syncFromApi === 'function') {
            window.syncFromApi();
          } else {
            // fallback: recargar listas si existen
            if (typeof window.renderAgenda === 'function') window.renderAgenda();
            if (typeof window.renderPatients === 'function') window.renderPatients();
            if (typeof window.renderDoctors === 'function') window.renderDoctors();
          }
        })
        .subscribe();
    });
    console.info('Supabase Realtime activo');
  } catch (e) {
    console.warn('Error iniciando Realtime', e);
  }
});
