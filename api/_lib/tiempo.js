// Uruguay está en UTC-3 todo el año (no tiene horario de verano desde
// 2015), así que el offset fijo es seguro. Va explícito en todo lo que
// sale hacia Notion o n8n: sin él, una fecha se interpreta como UTC y
// las reservas aparecen tres horas corridas.

export function montevideoISO(date = new Date()) {
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000)
  return `${shifted.toISOString().slice(0, 19)}-03:00`
}
