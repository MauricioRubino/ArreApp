// Avisa al dueño por WhatsApp cuando hay un pedido o una reserva nueva.
// Es best-effort: si el backend todavía no existe (desarrollo local) o
// falla, no debe interrumpir el pedido/reserva del cliente.

const NOTIFY_ENDPOINT = '/api/notify'

async function notify(type, payload) {
  try {
    const response = await fetch(NOTIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    })
    if (!response.ok) {
      console.warn('[notificationService] El aviso por WhatsApp no se pudo enviar.')
    }
  } catch {
    console.warn('[notificationService] No se pudo contactar al backend de notificaciones.')
  }
}

export function notifyOwnerOfOrder(order) {
  return notify('order', order)
}

export function notifyOwnerOfReservation(reservation) {
  return notify('reservation', reservation)
}
