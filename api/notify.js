// Función serverless (Vercel) que arma el mensaje de WhatsApp para el
// dueño a partir de un pedido o una reserva.
//
// Mientras no exista una cuenta de WhatsApp Business Platform conectada
// (faltan las variables de entorno de abajo), el mensaje sólo se deja
// registrado en los logs de la función — el pedido/reserva del cliente
// nunca se ve afectado por esto.
//
// Variables de entorno necesarias para el envío real (ver .env.example):
//   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, OWNER_WHATSAPP_NUMBER,
//   WHATSAPP_TEMPLATE_NAME (opcional)
//
// Supuesto sobre la plantilla: se espera una plantilla aprobada en Meta
// con un solo parámetro de cuerpo ({{1}}) que recibe todo el texto ya
// armado. Si la plantilla que aprueben tiene otra estructura, ajustar
// el array "components" de más abajo.

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

function buildOrderMessage(order) {
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
    '🍽️ *Nuevo pedido - Arrecife*',
    '',
    `*Cliente:* ${order.nombre}`,
    `*Teléfono:* ${order.telefono}`,
    `*Dirección:* ${direccion}`,
    ubicacion && `*Ubicación:* ${ubicacion}`,
    '',
    '*Pedido:*',
    itemLines,
    '',
    `*Total:* ${formatPrice(order.total)}`,
    `*Pago:* ${metodoPago}`,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildReservationMessage(reservation) {
  const zona = ZONA_LABELS[reservation.zona] || reservation.zona

  return [
    '📅 *Nueva reserva - Arrecife*',
    '',
    `*Nombre:* ${reservation.nombre}`,
    `*Teléfono:* ${reservation.telefono}`,
    `*Fecha:* ${formatFecha(reservation.fecha)}`,
    `*Horario:* ${reservation.hora}`,
    `*Personas:* ${reservation.personas}`,
    `*Zona:* ${zona}`,
    reservation.comentario && `*Comentarios:* ${reservation.comentario}`,
  ]
    .filter(Boolean)
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

  const message = type === 'order' ? buildOrderMessage(payload) : buildReservationMessage(payload)

  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME, OWNER_WHATSAPP_NUMBER } =
    process.env

  const isConfigured = WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID && OWNER_WHATSAPP_NUMBER

  if (!isConfigured) {
    console.log('[notify] WhatsApp Business todavía no está configurado. Mensaje simulado:\n' + message)
    res.status(200).json({ ok: true, simulated: true })
    return
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: OWNER_WHATSAPP_NUMBER,
        type: 'template',
        template: {
          name: WHATSAPP_TEMPLATE_NAME || 'notificacion_arrecife',
          language: { code: 'es_UY' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: message }] }],
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('[notify] Error de la API de WhatsApp:', data)
      res.status(502).json({ ok: false, error: data })
      return
    }

    res.status(200).json({ ok: true, simulated: false, data })
  } catch (error) {
    console.error('[notify] Error enviando WhatsApp:', error)
    res.status(500).json({ ok: false, error: String(error) })
  }
}
