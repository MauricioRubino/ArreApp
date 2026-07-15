// Avisa al dueño por WhatsApp cuando hay un pedido o una reserva nueva.
// El backend valida y recalcula todo server-side, así que la respuesta
// puede ser un rechazo (ej. platos sin stock) — en ese caso el pedido NO
// debe confirmarse. Si el backend no responde o el aviso no se entregó,
// el flujo del cliente sigue, pero con delivered:false para que la
// pantalla de confirmación ofrezca el respaldo por wa.me.
//
// Retorna siempre uno de:
//   { status: 'sent', numero, delivered }  → procesado (delivered indica
//     si el dueño recibió el aviso de verdad)
//   { status: 'rejected', reason, items? } → el backend rechazó el envío
//   { status: 'unreachable' }              → no hay backend (dev) o falló

const NOTIFY_ENDPOINT = '/api/notify'

async function notify(type, payload) {
  try {
    const response = await fetch(NOTIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      // Respuesta no-JSON (ej. 404 html del dev server): backend ausente.
    }

    if (response.status === 409 && data?.error === 'sin-stock') {
      return { status: 'rejected', reason: 'sin-stock', items: data.items ?? [] }
    }
    if (response.status === 400) {
      return { status: 'rejected', reason: 'invalido' }
    }
    if (!response.ok || !data?.ok) {
      return { status: 'unreachable' }
    }

    return { status: 'sent', numero: data.numero ?? null, delivered: Boolean(data.delivered) }
  } catch {
    console.warn('[notificationService] No se pudo contactar al backend de notificaciones.')
    return { status: 'unreachable' }
  }
}

export function notifyOwnerOfOrder(order) {
  return notify('order', order)
}

export function notifyOwnerOfReservation(reservation) {
  return notify('reservation', reservation)
}
