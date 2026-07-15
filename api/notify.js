// Función serverless (Vercel) que procesa un pedido o una reserva:
// valida y recalcula los datos server-side, le asigna un número
// correlativo, guarda el registro (para "ok #3" del dueño) y le avisa
// al dueño por WhatsApp.
//
// Estrategia de envío al dueño (por las reglas de plantillas de Meta,
// que no permiten saltos de línea en los parámetros):
//   1. Se intenta un mensaje de texto libre multilínea — se entrega si
//      el dueño escribió en las últimas 24hs (gratis, dentro de la
//      ventana de servicio).
//   2. Si falla, se manda una plantilla de una línea ("Tenés un pedido
//      nuevo (#3)...") y el detalle queda en cola: se le envía apenas
//      el dueño responda cualquier cosa (ver webhook.js).
//
// Sin credenciales configuradas todo queda simulado en los logs y la
// respuesta lleva delivered:false — el frontend muestra entonces un
// fallback para que el cliente mande el pedido por wa.me él mismo.

import { sendWhatsAppText, sendWhatsAppTemplate, isWhatsAppConfigured } from './_lib/whatsapp.js'
import { getNextNumber, saveRecord, queuePendingDetail } from './_lib/store.js'
import { validateOrder, validateReservation } from './_lib/validation.js'
import { checkNotifyRateLimit, getClientIp } from './_lib/rateLimit.js'
import { normalizePhone } from './_lib/phone.js'

const METODOS_PAGO_LABELS = {
  efectivo: 'Efectivo',
  'scotiabank-25': 'Scotiabank 25%',
  'scotiabank-15': 'Scotiabank 15%',
  'otras-tarjetas': 'Otras Tarjetas',
}

const ZONA_LABELS = {
  'sin-preferencia': 'Sin preferencia',
  interior: 'Interior',
  terraza: 'Terraza frente al puerto',
}

function formatPrice(price) {
  return `$${Number(price).toLocaleString('es-UY')}`
}

function formatFecha(iso) {
  const [year, month, day] = iso.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const text = date.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function buildOrderMessage(numero, order) {
  const itemLines = order.items
    .map((item) => {
      const guarnicion = item.guarnicion ? ` (${item.guarnicion})` : ''
      return `${item.quantity}x ${item.name}${guarnicion} - ${formatPrice(item.price * item.quantity)}`
    })
    .join('\n')

  const direccion = order.referenciaHogar ? `${order.calle} (${order.referenciaHogar})` : order.calle
  const ubicacion = order.location
    ? `https://maps.google.com/?q=${order.location.lat},${order.location.lng}`
    : ''

  return [
    `🍽️ *Pedido #${numero} - Arrecife*`,
    '',
    `*Cliente:* ${order.nombre}`,
    `*Teléfono:* ${order.telefono}`,
    `*Dirección:* ${direccion}`,
    ubicacion ? `*Ubicación:* ${ubicacion}` : null,
    '',
    '*Pedido:*',
    itemLines,
    '',
    `*Total:* ${formatPrice(order.total)}`,
    `*Pago:* ${METODOS_PAGO_LABELS[order.metodoPago]}`,
    '',
    `Respondé "ok #${numero}", "listo #${numero}" o "en camino #${numero}" para avisarle al cliente.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function buildReservationMessage(numero, reservation) {
  return [
    `📅 *Reserva #${numero} - Arrecife*`,
    '',
    `*Nombre:* ${reservation.nombre}`,
    `*Teléfono:* ${reservation.telefono}`,
    `*Fecha:* ${formatFecha(reservation.fecha)}`,
    `*Horario:* ${reservation.hora}`,
    `*Personas:* ${reservation.personas}`,
    `*Zona:* ${ZONA_LABELS[reservation.zona]}`,
    reservation.comentario ? `*Comentarios:* ${reservation.comentario}` : null,
    '',
    `Respondé "confirmada #${numero}" o "cancelada #${numero}" para avisarle al cliente.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

async function notifyOwner(ownerNumber, numero, tipo, message) {
  const textResult = await sendWhatsAppText(ownerNumber, message)
  if (textResult.ok) {
    // Simulado (sin credenciales) cuenta como NO entregado de verdad.
    return !textResult.simulated
  }

  // Fuera de la ventana de 24hs (o el texto falló por otro motivo):
  // plantilla corta de una línea + detalle en cola para cuando responda.
  await queuePendingDetail(message)
  const etiqueta = tipo === 'order' ? 'un pedido nuevo' : 'una reserva nueva'
  const pingResult = await sendWhatsAppTemplate(
    ownerNumber,
    `Tenés ${etiqueta} (#${numero}). Respondé este mensaje y te paso el detalle.`
  )
  return pingResult.ok && !pingResult.simulated
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const allowed = await checkNotifyRateLimit(getClientIp(req))
  if (!allowed) {
    res.status(429).json({ error: 'rate-limited' })
    return
  }

  const { type, payload } = req.body || {}
  if (type !== 'order' && type !== 'reservation') {
    res.status(400).json({ error: 'invalido', details: ['type'] })
    return
  }

  const validation =
    type === 'order' ? await validateOrder(payload) : validateReservation(payload)

  if (!validation.ok) {
    if (validation.sinStock) {
      res.status(409).json({ error: 'sin-stock', items: validation.sinStock })
    } else {
      res.status(400).json({ error: 'invalido', details: validation.errors })
    }
    return
  }

  const data = type === 'order' ? validation.order : validation.reservation
  const numero = await getNextNumber()

  await saveRecord(numero, {
    tipo: type,
    nombre: data.nombre,
    telefono: data.telefono,
    estado: 'nuevo',
    createdAt: Date.now(),
  })

  const message =
    type === 'order' ? buildOrderMessage(numero, data) : buildReservationMessage(numero, data)

  const ownerNumber = normalizePhone(process.env.OWNER_WHATSAPP_NUMBER)
  let delivered = false
  if (ownerNumber) {
    delivered = await notifyOwner(ownerNumber, numero, type, message)
  } else {
    console.log('[notify] OWNER_WHATSAPP_NUMBER no configurado. Mensaje simulado:\n' + message)
  }

  res.status(200).json({
    ok: true,
    numero,
    delivered,
    simulated: !isWhatsAppConfigured() || !ownerNumber,
  })
}
