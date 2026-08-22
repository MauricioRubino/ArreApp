// Función serverless (Vercel) que recibe un pedido o una reserva desde la
// web, lo valida y lo guarda.
//
// El orden importa:
//   1. Rate limit — el endpoint es público y escribe en una base real.
//   2. Validación server-side: los precios y el total se recalculan
//      contra la carta, nunca se confía en lo que mandó el navegador.
//   3. Número correlativo del día (Redis).
//   4. Notion, que es la FUENTE DE VERDAD. Si esto falla, el pedido no se
//      confirma: es preferible que el cliente reintente a que se vaya
//      contento con un pedido que nadie va a ver.
//   5. n8n, que dispara la automatización (avisarle al dueño, etc.). Va
//      último y a propósito no puede tumbar el pedido: si el server de
//      n8n está caído, el pedido ya quedó guardado en Notion.
//
// LAS RESERVAS VAN POR OTRO CAMINO: se validan y numeran igual, pero la
// escritura en Notion la hace el workflow de n8n, porque el Estado de la
// reserva depende del análisis de Claude y del chequeo de disponibilidad
// contra los turnos. Acá sólo se entregan.
//
// La app no manda ni recibe mensajes: todo eso vive ahora en n8n.

import { validateOrder, validateReservation } from './_lib/validation.js'
import { getNextNumber } from './_lib/counter.js'
import { createOrderPage } from './_lib/notion.js'
import { notifyN8n, enviarReservaAN8n } from './_lib/n8n.js'
import { checkNotifyRateLimit, getClientIp } from './_lib/rateLimit.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const allowed = await checkNotifyRateLimit(getClientIp(req))
  if (!allowed) {
    res.status(429).json({ error: 'rate-limited' })
    return
  }

  const { type, payload } = req.body || {}
  if (type !== 'order' && type !== 'reservation') {
    res.status(400).json({ error: 'invalido', details: ['type'] })
    return
  }

  const validation = type === 'order' ? validateOrder(payload) : validateReservation(payload)

  if (!validation.ok) {
    if (validation.cerrado) {
      res.status(409).json({ error: 'cerrado' })
    } else if (validation.fueraDeZona) {
      res.status(409).json({ error: 'fuera-de-zona' })
    } else if (validation.enPasado) {
      res.status(409).json({ error: 'en-pasado' })
    } else {
      res.status(400).json({ error: 'invalido', details: validation.errors })
    }
    return
  }

  const data = type === 'order' ? validation.order : validation.reservation

  // El número se pide antes de escribir en Notion porque va adentro de la
  // página. Si Notion falla, ese número queda salteado: es sólo una
  // etiqueta para que el dueño y el cliente hablen del mismo pedido, así
  // que un hueco no rompe nada.
  const { numero, fecha } = await getNextNumber()

  if (type === 'reservation') {
    const entregada = await enviarReservaAN8n(numero, fecha, data)
    if (!entregada.ok) {
      res.status(502).json({ error: 'no-guardado' })
      return
    }
    res.status(200).json({ ok: true, numero })
    return
  }

  const saved = await createOrderPage(numero, data)
  if (!saved.ok) {
    res.status(502).json({ error: 'no-guardado' })
    return
  }

  await notifyN8n(numero, fecha, data, saved)

  res.status(200).json({ ok: true, numero })
}
