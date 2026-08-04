// La extensión va explícita porque src/data/ también lo consumen las
// funciones de api/ corriendo en Node (Vite lo resuelve igual).
import { TURNOS_ATENCION } from './scheduleData.js'

// La última mesa se toma media hora antes del cierre, para que alcancen a
// comer tranquilos.
const ULTIMO_SLOT_ANTES_DEL_CIERRE = 30
const PASO_MINUTOS = 30

function generateSlots(desde, hasta) {
  const slots = []
  for (let m = desde; m <= hasta - ULTIMO_SLOT_ANTES_DEL_CIERRE; m += PASO_MINUTOS) {
    const hh = String(Math.floor(m / 60) % 24).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

// Los turnos de reserva salen del horario de atención real del restaurante.
export const TURNOS = TURNOS_ATENCION.map((turno) => ({
  id: turno.id,
  label: turno.label,
  horarios: generateSlots(turno.desde, turno.hasta),
}))

export const ZONAS = [
  { id: 'sin-preferencia', label: 'Sin preferencia' },
  { id: 'interior', label: 'Interior' },
  { id: 'terraza', label: 'Terraza frente al puerto' },
]

export const PERSONAS_MAX_ONLINE = 10
