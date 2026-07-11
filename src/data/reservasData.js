function generateSlots(startHour, startMin, endHour, endMin, stepMin) {
  const slots = []
  let h = startHour
  let m = startMin
  while (h < endHour || (h === endHour && m <= endMin)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += stepMin
    if (m >= 60) {
      m -= 60
      h += 1
    }
  }
  return slots
}

export const TURNOS = [
  { id: 'almuerzo', label: 'Almuerzo', horarios: generateSlots(12, 30, 15, 30, 30) },
  { id: 'cena', label: 'Cena', horarios: generateSlots(20, 0, 23, 30, 30) },
]

export const ZONAS = [
  { id: 'sin-preferencia', label: 'Sin preferencia' },
  { id: 'interior', label: 'Interior' },
  { id: 'terraza', label: 'Terraza frente al puerto' },
]

export const PERSONAS_MAX_ONLINE = 10
