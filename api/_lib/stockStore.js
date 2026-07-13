// Guarda qué platos de la carta están marcados sin stock, y el estado de
// desambiguación pendiente cuando el mensaje del dueño coincide con más
// de un plato.

import { kv } from './kv.js'

const STOCK_SET_KEY = 'sin-stock'
const PENDING_KEY = 'pendiente:stock'
const PENDING_TTL_SECONDS = 60 * 10 // 10 minutos para responder la aclaración

export async function markOutOfStock(itemId) {
  await kv.sadd(STOCK_SET_KEY, itemId)
}

export async function markInStock(itemId) {
  await kv.srem(STOCK_SET_KEY, itemId)
}

export async function listOutOfStock() {
  return kv.smembers(STOCK_SET_KEY)
}

export async function savePendingDisambiguation(candidates, action) {
  await kv.set(PENDING_KEY, { candidates, action }, { ex: PENDING_TTL_SECONDS })
}

export async function getPendingDisambiguation() {
  return kv.get(PENDING_KEY)
}

export async function clearPendingDisambiguation() {
  await kv.del(PENDING_KEY)
}
