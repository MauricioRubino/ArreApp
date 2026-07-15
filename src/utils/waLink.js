// Arma links wa.me con el pedido/reserva ya redactado, como respaldo
// cuando el aviso automático al restaurante no se pudo entregar.

import { formatPrice } from './format'

export function buildOrderWhatsAppText(order) {
  const itemLines = order.items.map(
    (item) =>
      `${item.quantity}x ${item.name}${item.guarnicion ? ` (${item.guarnicion})` : ''} - ${formatPrice(item.price * item.quantity)}`
  )

  return [
    '¡Hola! Quiero hacer un pedido:',
    ...itemLines,
    `Total: ${formatPrice(order.total)}`,
    `Nombre: ${order.nombre}`,
    `Teléfono: ${order.telefono}`,
    `Dirección: ${order.calle}${order.referenciaHogar ? ` (${order.referenciaHogar})` : ''}`,
    order.location ? `Ubicación: https://maps.google.com/?q=${order.location.lat},${order.location.lng}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildReservationWhatsAppText(reservation) {
  return [
    '¡Hola! Quiero hacer una reserva:',
    `Nombre: ${reservation.nombre}`,
    `Teléfono: ${reservation.telefono}`,
    `Fecha: ${reservation.fecha}`,
    `Horario: ${reservation.hora}`,
    `Personas: ${reservation.personas}`,
    reservation.comentario ? `Comentarios: ${reservation.comentario}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildWaLink(phone, text) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
