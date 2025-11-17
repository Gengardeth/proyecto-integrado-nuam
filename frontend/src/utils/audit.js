// Utilidades para auditoría

// Agrupa logs por fecha (YYYY-MM-DD) y devuelve estructura ordenada desc
export function groupAuditLogsByDate(logs = []) {
  const mapa = new Map();
  for (const log of logs) {
    if (!log.creado_en) continue;
    const fechaIso = log.creado_en.split('T')[0];
    if (!mapa.has(fechaIso)) mapa.set(fechaIso, []);
    mapa.get(fechaIso).push(log);
  }
  const formateador = new Intl.DateTimeFormat('es-CL', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
  return Array.from(mapa.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([fecha, items]) => ({
      fecha,
      fecha_legible: formateador.format(new Date(fecha)),
      items: items.sort((x, y) => (x.creado_en < y.creado_en ? 1 : -1))
    }));
}

// Retorna top acciones por cantidad (para futuras métricas rápidas)
export function topAcciones(logs = [], limite = 5) {
  const conteo = {};
  for (const l of logs) conteo[l.accion] = (conteo[l.accion] || 0) + 1;
  return Object.entries(conteo)
    .map(([accion, count]) => ({ accion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limite);
}

export default { groupAuditLogsByDate, topAcciones };
