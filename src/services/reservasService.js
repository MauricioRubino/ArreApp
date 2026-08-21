// Capa de servicio de la reserva: va al mismo backend que los pedidos y
// termina en la misma base de Notion, con Tipo = Reserva.

import { submitToApi } from './apiClient'

export function createReservation(payload) {
  return submitToApi('reservation', payload)
}
