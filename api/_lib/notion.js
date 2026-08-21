// Escritura de pedidos en la base de Notion.
//
// Notion es la fuente de verdad del pedido: si esta escritura falla, el
// pedido NO se le confirma al cliente (ver api/orders.js). Por eso acá no
// hay simulación silenciosa — un error se reporta hacia arriba.
//
// El esquema lo crea notion/crear-base.mjs; los nombres de abajo tienen
// que coincidir exactamente con los de la base o la API responde 400.
//
// Las reservas van a una base aparte (NOTION_RESERVATIONS_DATABASE_ID),
// porque la base de pedidos quedó dedicada. Si esa variable no está
// configurada, la reserva se rechaza en vez de guardarse en el lugar
// equivocado.

import { METODOS_PAGO } from '../../src/data/paymentData.js'
import { ZONAS } from '../../src/data/reservasData.js'

const NOTION_API = 'https://api.notion.com/v1/pages'
const REQUEST_TIMEOUT_MS = 8000

function getConfig() {
  return {
    token: process.env.NOTION_TOKEN,
    databaseId: process.env.NOTION_DATABASE_ID,
    reservationsDatabaseId: process.env.NOTION_RESERVATIONS_DATABASE_ID,
    // Pinneada a propósito: es la versión estable donde el parent de una
    // página se declara como database_id. Si algún día hay que subirla,
    // se cambia por variable de entorno sin tocar código.
    version: process.env.NOTION_VERSION || '2022-06-28',
  }
}

export function isNotionConfigured() {
  const { token, databaseId } = getConfig()
  return Boolean(token && databaseId)
}

// Uruguay está en UTC-3 todo el año (no tiene horario de verano desde
// 2015), así que el offset fijo es seguro. Va explícito para que Notion
// no interprete la fecha como UTC y corra todo tres horas.
export function montevideoISO(date = new Date()) {
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000)
  return `${shifted.toISOString().slice(0, 19)}-03:00`
}

function formatPrice(price) {
  return `$${Number(price).toLocaleString('es-UY')}`
}

function labelOf(collection, id, fallback = null) {
  return collection.find((entry) => entry.id === id)?.label ?? fallback
}

const title = (content) => ({ title: [{ text: { content } }] })
const richText = (content) => ({ rich_text: [{ text: { content: String(content) } }] })
const select = (name) => ({ select: { name } })

// Notion rechaza "" en url y phone_number: lo vacío se manda como null y
// las propiedades que no aplican directamente no se mandan.
function compact(properties) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined))
}

function buildOrderProperties(numero, order, recibido) {
  const detalle = order.items
    .map((item) => {
      const guarnicion = item.guarnicion ? ` (${item.guarnicion})` : ''
      return `${item.quantity}x ${item.name}${guarnicion} - ${formatPrice(item.price * item.quantity)}`
    })
    .join('\n')

  return compact({
    Pedido: title(`#${numero} · ${order.nombre}`),
    'Número': { number: numero },
    Estado: select('Nuevo'),
    Cliente: richText(order.nombre),
    'Teléfono': { phone_number: order.telefono || null },
    Recibido: { date: { start: recibido } },
    Detalle: richText(detalle),
    // Unidades totales, para saber de un vistazo el tamaño del pedido.
    Platos: { number: order.items.reduce((sum, item) => sum + item.quantity, 0) },
    Subtotal: { number: order.subtotal },
    Descuento: { number: order.descuento },
    Total: { number: order.total },
    Pago: select(labelOf(METODOS_PAGO, order.metodoPago, 'Efectivo')),
    'Dirección': richText(order.calle),
    Referencia: order.referenciaHogar ? richText(order.referenciaHogar) : undefined,
    'Ubicación': {
      url: order.location
        ? `https://maps.google.com/?q=${order.location.lat},${order.location.lng}`
        : null,
    },
  })
}

function buildReservationProperties(numero, reservation, recibido) {
  return compact({
    Reserva: title(`#${numero} · ${reservation.nombre}`),
    'Número': { number: numero },
    Estado: select('Nuevo'),
    Cliente: richText(reservation.nombre),
    'Teléfono': { phone_number: reservation.telefono || null },
    Recibido: { date: { start: recibido } },
    'Fecha reserva': { date: { start: `${reservation.fecha}T${reservation.hora}:00-03:00` } },
    Personas: { number: reservation.personas },
    Zona: select(labelOf(ZONAS, reservation.zona, 'Sin preferencia')),
    Comentario: reservation.comentario ? richText(reservation.comentario) : undefined,
  })
}

export async function createNotionPage(type, numero, data) {
  const { token, databaseId, reservationsDatabaseId, version } = getConfig()

  const target = type === 'order' ? databaseId : reservationsDatabaseId
  if (!token || !target) {
    console.error(
      type === 'order'
        ? '[notion] NOTION_TOKEN o NOTION_DATABASE_ID sin configurar.'
        : '[notion] NOTION_RESERVATIONS_DATABASE_ID sin configurar: la base de pedidos es sólo para pedidos.'
    )
    return { ok: false, error: 'no-configurado' }
  }

  const recibido = montevideoISO()
  const properties =
    type === 'order'
      ? buildOrderProperties(numero, data, recibido)
      : buildReservationProperties(numero, data, recibido)

  try {
    const response = await fetch(NOTION_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': version,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: target }, properties }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    const body = await response.json()
    if (!response.ok) {
      // 404 acá casi siempre significa que la integración no fue agregada
      // a la base desde Connections, no que el ID esté mal.
      console.error('[notion] Error de la API:', response.status, JSON.stringify(body))
      return { ok: false, error: body?.code ?? String(response.status) }
    }

    // La url va al payload de n8n: un link clickeable al pedido le sirve
    // mucho más al dueño que el id pelado.
    return { ok: true, pageId: body.id, url: body.url ?? null, recibido }
  } catch (error) {
    console.error('[notion] No se pudo escribir la página:', error)
    return { ok: false, error: String(error) }
  }
}
