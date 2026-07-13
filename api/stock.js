// Devuelve los IDs de los platos marcados sin stock por el dueño desde
// WhatsApp (ver webhook.js). Sin Upstash Redis conectado, siempre
// devuelve una lista vacía — todo se muestra disponible por defecto.

import { listOutOfStock } from './_lib/stockStore.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const outOfStockIds = await listOutOfStock()
  res.status(200).json({ outOfStockIds })
}
