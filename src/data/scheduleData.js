// Horarios de atención del restaurante y utilidades de fecha/hora.
//
// Todo se calcula SIEMPRE en horario de Montevideo, nunca en la hora local
// del dispositivo ni en UTC:
//  - un turista puede tener el celular en otra zona horaria;
//  - las funciones serverless de Vercel corren en UTC, y el turno de cena
//    llega hasta la medianoche: usar UTC adelantaría el cambio de día
//    (y el reinicio del contador de pedidos) al medio del servicio.

export const TIME_ZONE = 'America/Montevideo'

// Rangos en minutos desde la medianoche. 24:00 = 1440 (cierra a las 00:00).
export const TURNOS_ATENCION = [
  { id: 'almuerzo', label: 'Almuerzo', desde: 12 * 60, hasta: 16 * 60 },
  { id: 'cena', label: 'Cena', desde: 19 * 60 + 30, hasta: 24 * 60 },
]

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

// Fecha y hora actuales en Montevideo: { fecha: 'YYYY-MM-DD', minutos }
export function nowInMontevideo(date = new Date()) {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map((part) => [part.type, part.value])
  )
  // Algunos entornos devuelven "24" en vez de "00" a la medianoche.
  const hour = Number(parts.hour) % 24
  return {
    fecha: `${parts.year}-${parts.month}-${parts.day}`,
    minutos: hour * 60 + Number(parts.minute),
  }
}

export function todayInMontevideo() {
  return nowInMontevideo().fecha
}

export function minutesFromHHMM(hhmm) {
  const [hours, minutes] = String(hhmm).split(':').map(Number)
  return hours * 60 + minutes
}

function formatHHMM(totalMinutes) {
  const normalized = totalMinutes % (24 * 60)
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0')
  const minutes = String(normalized % 60).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function isOpenAt({ minutos } = nowInMontevideo()) {
  return TURNOS_ATENCION.some((turno) => minutos >= turno.desde && minutos < turno.hasta)
}

// Texto para avisarle al cliente cuándo volvemos a atender.
export function nextOpeningLabel({ minutos } = nowInMontevideo()) {
  const siguiente = TURNOS_ATENCION.find((turno) => minutos < turno.desde)
  if (siguiente) return `hoy a las ${formatHHMM(siguiente.desde)}`
  return `mañana a las ${formatHHMM(TURNOS_ATENCION[0].desde)}`
}

export const HORARIO_LABEL = TURNOS_ATENCION.map(
  (turno) => `${formatHHMM(turno.desde)} a ${formatHHMM(turno.hasta)}`
).join(' y ')
