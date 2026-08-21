// El porcentaje de las promos bancarias NO es decorativo: se descuenta
// del subtotal. `descuento` es la fracción que se aplica.
//
// El cálculo vive acá y no en cada pantalla para que el frontend (que lo
// muestra en vivo mientras el cliente elige) y el backend (que es el que
// manda) usen exactamente la misma cuenta.

export const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo', descuento: 0 },
  { id: 'scotiabank-25', label: 'Scotiabank 25%', descuento: 0.25 },
  { id: 'scotiabank-15', label: 'Scotiabank 15%', descuento: 0.15 },
  { id: 'otras-tarjetas', label: 'Otras Tarjetas', descuento: 0 },
]

export function getMetodoPago(id) {
  return METODOS_PAGO.find((metodo) => metodo.id === id) ?? null
}

// Redondea a peso entero: en la caja no hay centésimos.
export function calcularTotales(subtotal, metodoPagoId) {
  const tasa = getMetodoPago(metodoPagoId)?.descuento ?? 0
  const descuento = Math.round(subtotal * tasa)
  return { subtotal, descuento, total: subtotal - descuento }
}
