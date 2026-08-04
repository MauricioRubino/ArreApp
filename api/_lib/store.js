// Guarda pedidos/reservas por número, para que el dueño pueda
// referenciarlos por WhatsApp ("ok #3") y para poder avisarle al cliente
// correcto cuando cambia el estado.
//
// La numeración se reinicia todos los días (#1, #2, #3…), así que tanto el
// contador como los registros van namespaced por fecha de Montevideo.

import { kv } from './kv.js'
import { todayInMontevideo } from '../../src/data/scheduleData.js'

const PENDING_DETAILS_KEY = 'pendientes:detalles'
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 3 // 3 días
const COUNTER_TTL_SECONDS = 60 * 60 * 36 // sobrevive al turno de cena y se cae solo

function counterKey(fecha) {
  return `contador:${fecha}`
}

function recordKey(fecha, numero) {
  return `pedido:${fecha}:${numero}`
}

function yesterdayOf(fecha) {
  const date = new Date(`${fecha}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export async function getNextNumber() {
  const fecha = todayInMontevideo()
  const key = counterKey(fecha)
  const numero = await kv.incr(key)
  if (numero === 1) await kv.expire(key, COUNTER_TTL_SECONDS)
  return { numero, fecha }
}

export async function saveRecord(fecha, numero, record) {
  await kv.set(recordKey(fecha, numero), record, { ex: RECORD_TTL_SECONDS })
}

// El dueño puede responder "en camino #12" pasada la medianoche, cuando el
// contador del día ya se reinició: si el número no existe hoy, se busca en
// el día anterior antes de darlo por inexistente.
export async function getRecord(numero) {
  const hoy = todayInMontevideo()
  const deHoy = await kv.get(recordKey(hoy, numero))
  if (deHoy) return { ...deHoy, fecha: hoy }

  const ayer = yesterdayOf(hoy)
  const deAyer = await kv.get(recordKey(ayer, numero))
  return deAyer ? { ...deAyer, fecha: ayer } : null
}

export async function updateRecordEstado(numero, estado) {
  const record = await getRecord(numero)
  if (!record) return null
  const updated = { ...record, estado }
  await saveRecord(record.fecha, numero, updated)
  return updated
}

// Cuando el aviso multilínea al dueño no se puede entregar (ventana de 24hs
// cerrada), el detalle queda en cola y se le manda apenas él escriba algo.
export async function queuePendingDetail(text) {
  await kv.rpush(PENDING_DETAILS_KEY, text)
}

export async function flushPendingDetails() {
  const details = await kv.lrange(PENDING_DETAILS_KEY, 0, -1)
  if (details.length > 0) await kv.del(PENDING_DETAILS_KEY)
  return details
}
