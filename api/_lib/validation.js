// Validación server-side de pedidos y reservas: el navegador no es
// confiable, así que los precios y el total se recalculan siempre contra
// la carta real (menuData) antes de guardarlos en Notion.

import { MENU_ITEMS } from '../../src/data/menuData.js'
import { GUARNICIONES } from '../../src/data/guarnicionesData.js'
import { isWithinDeliveryArea } from '../../src/data/locationData.js'
import {
  isOpenAt,
  nowInMontevideo,
  todayInMontevideo,
  minutesFromHHMM,
} from '../../src/data/scheduleData.js'
import { METODOS_PAGO, calcularTotales } from '../../src/data/paymentData.js'
import { normalizePhone } from './phone.js'

const METODOS_PAGO_IDS = METODOS_PAGO.map((metodo) => metodo.id)
const ZONAS = ['sin-preferencia', 'interior', 'terraza']

function cleanText(value, maxLength) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function validateOrder(payload) {
  const errors = []

  const nombre = cleanText(payload?.nombre, 80)
  if (!nombre) errors.push('nombre')

  const telefono = normalizePhone(payload?.telefono)
  if (telefono.length < 9) errors.push('telefono')

  const calle = cleanText(payload?.calle, 120)
  if (!calle) errors.push('calle')

  const referenciaHogar = cleanText(payload?.referenciaHogar, 120)

  const metodoPago = METODOS_PAGO_IDS.includes(payload?.metodoPago) ? payload.metodoPago : null
  if (!metodoPago) errors.push('metodoPago')

  const location =
    payload?.location &&
    Number.isFinite(payload.location.lat) &&
    Number.isFinite(payload.location.lng)
      ? { lat: payload.location.lat, lng: payload.location.lng }
      : null
  if (!location) errors.push('location')

  const rawItems = Array.isArray(payload?.items) ? payload.items : []
  if (rawItems.length < 1 || rawItems.length > 40) errors.push('items')

  // Se reconstruye cada línea desde la carta real: nombre y precio salen
  // de menuData, nunca de lo que mandó el navegador.
  const items = []
  for (const line of rawItems.slice(0, 40)) {
    const menuItem = MENU_ITEMS.find((m) => m.id === line?.menuItemId)
    if (!menuItem) {
      errors.push(`plato desconocido: ${cleanText(line?.menuItemId ?? line?.name, 40)}`)
      continue
    }
    const quantity =
      Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 50
        ? line.quantity
        : null
    if (!quantity) {
      errors.push(`cantidad inválida en ${menuItem.name}`)
      continue
    }
    let guarnicion = null
    if (line.guarnicion != null && line.guarnicion !== '') {
      if (!GUARNICIONES.includes(line.guarnicion)) {
        errors.push(`guarnición inválida en ${menuItem.name}`)
        continue
      }
      guarnicion = line.guarnicion
    }
    items.push({ menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity, guarnicion })
  }

  if (errors.length > 0) return { ok: false, errors }

  if (!isOpenAt()) return { ok: false, cerrado: true }
  if (!isWithinDeliveryArea(location)) return { ok: false, fueraDeZona: true }

  // El descuento del método de pago también se recalcula acá: si el
  // navegador manda un total ya "descontado", se ignora igual que los
  // precios.
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const { descuento, total } = calcularTotales(subtotal, metodoPago)

  return {
    ok: true,
    order: {
      nombre,
      telefono,
      calle,
      referenciaHogar,
      metodoPago,
      location,
      items,
      subtotal,
      descuento,
      total,
    },
  }
}

export function validateReservation(payload) {
  const errors = []

  const nombre = cleanText(payload?.nombre, 80)
  if (!nombre) errors.push('nombre')

  const telefono = normalizePhone(payload?.telefono)
  if (telefono.length < 9) errors.push('telefono')

  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(payload?.fecha ?? '') ? payload.fecha : null
  if (!fecha) errors.push('fecha')

  const hora = /^\d{2}:\d{2}$/.test(payload?.hora ?? '') ? payload.hora : null
  if (!hora) errors.push('hora')

  const personas =
    Number.isInteger(payload?.personas) && payload.personas >= 1 && payload.personas <= 50
      ? payload.personas
      : null
  if (!personas) errors.push('personas')

  const zona = ZONAS.includes(payload?.zona) ? payload.zona : 'sin-preferencia'
  const comentario = cleanText(payload?.comentario, 300)

  if (errors.length > 0) return { ok: false, errors }

  // No se puede reservar para un momento que ya pasó (ni una fecha
  // anterior, ni un horario de hoy que ya quedó atrás).
  const ahora = nowInMontevideo()
  const hoy = todayInMontevideo()
  if (fecha < hoy) return { ok: false, enPasado: true }
  if (fecha === hoy && minutesFromHHMM(hora) <= ahora.minutos) {
    return { ok: false, enPasado: true }
  }

  return { ok: true, reservation: { nombre, telefono, fecha, hora, personas, zona, comentario } }
}
