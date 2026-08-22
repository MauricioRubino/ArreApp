// Puente hacia n8n. Dos caminos, con reglas distintas:
//
// - PEDIDOS: la página de Notion ya existe cuando se llama, así que este
//   disparo no puede tumbar el pedido. Si n8n está caído sólo se pierde
//   la automatización, y el pedido se reprocesa mirando la base.
//
// - RESERVAS: acá n8n es el ÚNICO que escribe en Notion, porque el Estado
//   depende del análisis de Claude y del chequeo de disponibilidad que
//   pasan adentro del workflow. Si esto falla, la reserva no quedó en
//   ningún lado y hay que devolverle el error al cliente.
//
// Es deliberadamente el ÚLTIMO paso y no puede tumbar el pedido: para
// cuando se llama, la página de Notion ya existe. Si n8n está caído
// (self-hosted, se cae), el pedido igual quedó registrado y el dueño lo
// ve en la base — sólo se pierde la automatización, que se puede
// reprocesar a mano desde Notion.
//
// Se espera la respuesta en vez de dejarlo colgado en segundo plano
// porque Vercel congela la función serverless apenas se responde: un
// fetch sin await se cancelaría a mitad de camino.
//
// El payload va MASTICADO a propósito: además de los datos crudos lleva
// las etiquetas ya resueltas, los links armados y los subtotales
// calculados. Es para que el workflow de n8n sea un nodo que arma texto
// y no una cadena de nodos traduciendo IDs a nombres.

import { METODOS_PAGO } from '../../src/data/paymentData.js'
import { ZONAS } from '../../src/data/reservasData.js'
import { formatPrice } from '../../src/utils/format.js'
import { montevideoISO } from './tiempo.js'

const REQUEST_TIMEOUT_MS = 5000

export function isN8nConfigured() {
  return Boolean(process.env.N8N_WEBHOOK_URL)
}

export function isN8nReservasConfigured() {
  return Boolean(process.env.N8N_RESERVAS_WEBHOOK_URL)
}

async function postN8n(url, payload) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // El webhook de n8n es una URL pública: sin este header cualquiera
        // podría dispararle avisos falsos al dueño.
        ...(process.env.N8N_SECRET ? { 'X-Arrecife-Secret': process.env.N8N_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error('[n8n] El webhook respondió', response.status)
      return { ok: false }
    }
    return { ok: true }
  } catch (error) {
    console.error('[n8n] No se pudo disparar el webhook:', error)
    return { ok: false }
  }
}

function labelOf(collection, id, fallback = null) {
  return collection.find((entry) => entry.id === id)?.label ?? fallback
}

function formatFecha(iso) {
  const [year, month, day] = iso.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const text = date.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function buildOrderEvent(numero, fecha, order, notion) {
  const items = order.items.map((item) => {
    const subtotal = item.price * item.quantity
    const guarnicion = item.guarnicion ? ` (${item.guarnicion})` : ''
    return {
      ...item,
      subtotal,
      // Línea ya redactada: en n8n alcanza con un join para el mensaje.
      linea: `${item.quantity}x ${item.name}${guarnicion} - ${formatPrice(subtotal)}`,
    }
  })

  return {
    tipo: 'order',
    numero,
    fecha,
    recibido: notion.recibido,
    notion: { pageId: notion.pageId, url: notion.url },
    datos: {
      nombre: order.nombre,
      telefono: order.telefono,
      calle: order.calle,
      referenciaHogar: order.referenciaHogar,
      direccion: order.referenciaHogar
        ? `${order.calle} (${order.referenciaHogar})`
        : order.calle,
      location: order.location,
      mapsUrl: order.location
        ? `https://maps.google.com/?q=${order.location.lat},${order.location.lng}`
        : null,
      metodoPago: order.metodoPago,
      metodoPagoLabel: labelOf(METODOS_PAGO, order.metodoPago, 'Efectivo'),
      items,
      platos: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: order.subtotal,
      subtotalLabel: formatPrice(order.subtotal),
      descuento: order.descuento,
      descuentoLabel: order.descuento > 0 ? `-${formatPrice(order.descuento)}` : null,
      total: order.total,
      totalLabel: formatPrice(order.total),
    },
  }
}

function buildReservationEvent(numero, fecha, reservation) {
  return {
    tipo: 'reservation',
    numero,
    fecha,
    recibido: montevideoISO(),
    datos: {
      nombre: reservation.nombre,
      telefono: reservation.telefono,
      // Vacío si el cliente no lo dejó: el workflow salta el mail y la
      // confirmación queda por teléfono.
      email: reservation.email || null,
      fecha: reservation.fecha,
      fechaLabel: formatFecha(reservation.fecha),
      hora: reservation.hora,
      fechaHora: `${reservation.fecha}T${reservation.hora}:00-03:00`,
      personas: reservation.personas,
      zona: reservation.zona,
      zonaLabel: labelOf(ZONAS, reservation.zona, 'Sin preferencia'),
      comentario: reservation.comentario || null,
    },
  }
}

export async function notifyN8n(numero, fecha, order, notion) {
  if (!isN8nConfigured()) {
    console.log('[n8n] N8N_WEBHOOK_URL sin configurar. Disparo omitido.')
    return { ok: false, skipped: true }
  }
  return postN8n(process.env.N8N_WEBHOOK_URL, buildOrderEvent(numero, fecha, order, notion))
}

// La reserva no existe en ningún lado hasta que el workflow la escribe,
// así que quien llame tiene que tratar un ok:false como fallo del pedido.
export async function enviarReservaAN8n(numero, fecha, reservation) {
  if (!isN8nReservasConfigured()) {
    console.error('[n8n] N8N_RESERVAS_WEBHOOK_URL sin configurar: la reserva no se puede guardar.')
    return { ok: false }
  }
  return postN8n(
    process.env.N8N_RESERVAS_WEBHOOK_URL,
    buildReservationEvent(numero, fecha, reservation)
  )
}
