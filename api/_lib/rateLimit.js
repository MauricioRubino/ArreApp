// Límite de solicitudes para /api/notify: cada aviso cuesta un mensaje de
// WhatsApp, así que un script malicioso podría generar gasto real además
// de spamear al dueño. Límite por IP + tope global diario.
//
// Con el fallback en memoria (sin Upstash) el límite es por instancia de
// función, o sea aproximado — con Upstash conectado es exacto.

import { kv } from './kv.js'

const PER_IP_PER_HOUR = 20
const GLOBAL_PER_DAY = 500

export async function checkNotifyRateLimit(ip) {
  const ipKey = `rl:ip:${ip}`
  const ipCount = await kv.incr(ipKey)
  if (ipCount === 1) await kv.expire(ipKey, 60 * 60)

  const day = new Date().toISOString().slice(0, 10)
  const globalKey = `rl:global:${day}`
  const globalCount = await kv.incr(globalKey)
  if (globalCount === 1) await kv.expire(globalKey, 60 * 60 * 48)

  return ipCount <= PER_IP_PER_HOUR && globalCount <= GLOBAL_PER_DAY
}

export function getClientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] ?? '')
  return forwarded.split(',')[0].trim() || req.socket?.remoteAddress || 'desconocida'
}
