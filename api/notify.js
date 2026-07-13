// Función serverless (Vercel) que arma el mensaje de WhatsApp para el
// dueño a partir de un pedido o una reserva, le asigna un número (para
// poder referenciarlo después, ej. "ok #3") y lo guarda para poder
// correlacionar la respuesta del dueño más adelante (ver webhook.js).
//
// Mientras no exista una cuenta de WhatsApp Business Platform conectada
// (faltan las variables de entorno de abajo), el mensaje sólo se deja
// registrado en los logs de la función — el pedido/reserva del cliente
// nunca se ve afectado por esto.
//
// Variables de entorno necesarias para el envío real (ver .env.example):
//   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, OWNER_WHATSAPP_NUMBER,
//   WHATSAPP_TEMPLATE_NAME (opcional), UPSTASH_REDIS_REST_URL,
//   UPSTASH_REDIS_REST_TOKEN

import { sendWhatsAppMessage } from './_lib/whatsapp.js'
import { getNextNumber, saveRecord } from './_lib/store.js'

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
  const itemLines = (order.items || [])
    .map((item) => {
      const guarnicion = item.guarnicion ? ` (${item.guarnicion})` : ''
      return `${item.quantity}x ${item.name}${guarnicion} - ${formatPrice(item.price * item.quantity)}`
    })
    .join('\n')

  const direccion = order.referenciaHogar ? `${order.calle} (${order.referenciaHogar})` : order.calle
  const metodoPago = METODOS_PAGO_LABELS[order.metodoPago] || order.metodoPago
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
    `*Pago:* ${metodoPago}`,
    '',
    `Respondé "ok #${numero}", "listo #${numero}" o "en camino #${numero}" para avisarle al cliente.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function buildReservationMessage(numero, reservation) {
  const zona = ZONA_LABELS[reservation.zona] || reservation.zona

  return [
    `📅 *Reserva #${numero} - Arrecife*`,
    '',
    `*Nombre:* ${reservation.nombre}`,
    `*Teléfono:* ${reservation.telefono}`,
    `*Fecha:* ${formatFecha(reservation.fecha)}`,
    `*Horario:* ${reservation.hora}`,
    `*Personas:* ${reservation.personas}`,
    `*Zona:* ${zona}`,
    reservation.comentario ? `*Comentarios:* ${reservation.comentario}` : null,
    '',
    `Respondé "confirmada #${numero}" o "cancelada #${numero}" para avisarle al cliente.`,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { type, payload } = req.body || {}
  if (type !== 'order' && type !== 'reservation') {
    res.status(400).json({ error: 'Tipo inválido, debe ser "order" o "reservation".' })
    return
  }

  const numero = await getNextNumber()

  await saveRecord(numero, {
    tipo: type,
    nombre: payload.nombre,
    telefono: payload.telefono,
    estado: 'nuevo',
    createdAt: Date.now(),
  })

  const message =
    type === 'order' ? buildOrderMessage(numero, payload) : buildReservationMessage(numero, payload)

  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER
  if (!ownerNumber) {
    console.log('[notify] OWNER_WHATSAPP_NUMBER no configurado. Mensaje simulado:\n' + message)
    res.status(200).json({ ok: true, simulated: true, numero })
    return
  }

  const result = await sendWhatsAppMessage(ownerNumber, message)
  res.status(result.ok ? 200 : 502).json({ ...result, numero })
}
