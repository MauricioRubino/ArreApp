// Capa de servicio: hoy simula la creación de la reserva con latencia de
// red; el día que haya backend, sólo cambia lo de adentro de esta función.

const SIMULATED_LATENCY_MS = 700

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function createReservation(payload) {
  await delay(SIMULATED_LATENCY_MS)
  return {
    id: `res-${Date.now()}`,
    estado: 'pendiente-confirmacion',
    ...payload,
  }
}
