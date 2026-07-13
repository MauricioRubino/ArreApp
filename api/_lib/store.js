// Guarda pedidos/reservas por número, para que el dueño pueda
// referenciarlos por WhatsApp ("ok #3") y para poder avisarle al cliente
// correcto cuando cambia el estado.

import { kv } from './kv.js'

const COUNTER_KEY = 'contador:pedidos'
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 3 // 3 días

function recordKey(numero) {
  return `pedido:${numero}`
}

export async function getNextNumber() {
  return kv.incr(COUNTER_KEY)
}

export async function saveRecord(numero, record) {
  await kv.set(recordKey(numero), record, { ex: RECORD_TTL_SECONDS })
}

export async function getRecord(numero) {
  return kv.get(recordKey(numero))
}

export async function updateRecordEstado(numero, estado) {
  const record = await getRecord(numero)
  if (!record) return null
  const updated = { ...record, estado }
  await saveRecord(numero, updated)
  return updated
}
