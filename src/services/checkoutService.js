// Capa de servicio del pedido: lo manda al backend, que lo valida, lo
// guarda en Notion y dispara la automatización de n8n.

import { submitToApi } from './apiClient'

export function createOrder(payload) {
  return submitToApi('order', payload)
}
