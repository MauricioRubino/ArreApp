// Numeración correlativa de pedidos y reservas (#1, #2, #3…).
//
// El contador se reinicia todos los días y es compartido entre pedidos y
// reservas, así que el número identifica sin ambigüedad a cualquiera de
// los dos dentro de la jornada. Va namespaced por fecha de Montevideo, no
// por UTC: las funciones de Vercel corren en UTC y el turno de cena llega
// hasta la medianoche, así que con UTC el contador se reiniciaría en el
// medio del servicio.
//
// Es lo único que queda en Redis además del rate limit: el registro de
// cada pedido vive ahora en Notion.

import { kv } from './kv.js'
import { todayInMontevideo } from '../../src/data/scheduleData.js'

const COUNTER_TTL_SECONDS = 60 * 60 * 36 // sobrevive al turno de cena y se cae solo

export async function getNextNumber() {
  const fecha = todayInMontevideo()
  const key = `contador:${fecha}`
  const numero = await kv.incr(key)
  if (numero === 1) await kv.expire(key, COUNTER_TTL_SECONDS)
  return { numero, fecha }
}
