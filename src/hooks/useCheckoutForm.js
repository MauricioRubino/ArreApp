import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../services/checkoutService'
import { useCartStore, selectTotalPrice } from '../store/cartStore'
import { DEFAULT_LOCATION, isWithinDeliveryArea, DELIVERY_AREA_LABEL } from '../data/locationData'
import { DEFAULT_COUNTRY, buildFullPhone } from '../data/countryCodes'
import { isOpenAt, nextOpeningLabel, HORARIO_LABEL } from '../data/scheduleData'

const INITIAL_FIELDS = {
  nombre: '',
  codigoPais: DEFAULT_COUNTRY,
  telefono: '',
  calle: '',
  referenciaHogar: '',
  metodoPago: '',
}

const DEFAULT_REJECTION = 'No pudimos procesar el pedido. Revisá los datos e intentá de nuevo.'

// Sin ningún canal de respaldo, un fallo de red significa que el pedido no
// quedó en ningún lado. Hay que decirlo claro para que el cliente
// reintente en vez de quedarse esperando comida que nadie va a cocinar.
const FAILURE_MESSAGE =
  'No pudimos guardar tu pedido y todavía no le llegó al restaurante. Revisá tu conexión y probá de nuevo.'

const REJECTION_MESSAGES = {
  cerrado: () =>
    `El restaurante está cerrado en este momento. Atendemos de ${HORARIO_LABEL}: volvé ${nextOpeningLabel()}.`,
  'fuera-de-zona': () =>
    `Por ahora sólo entregamos en ${DELIVERY_AREA_LABEL}. Movés el pin del mapa dentro de la zona marcada para continuar.`,
  'rate-limited': () =>
    'Recibimos varios pedidos desde este dispositivo. Esperá unos minutos y volvé a intentar.',
}

function validate(fields) {
  const errors = {}
  if (!fields.nombre.trim()) errors.nombre = 'Ingresá tu nombre.'
  if (fields.telefono.replace(/\D/g, '').length < 6) {
    errors.telefono = 'Ingresá un teléfono válido.'
  }
  if (!fields.calle.trim()) errors.calle = 'Ingresá tu calle y número.'
  if (!fields.metodoPago) errors.metodoPago = 'Elegí un método de pago.'
  return errors
}

export function useCheckoutForm() {
  const navigate = useNavigate()
  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [location, setLocation] = useState(DEFAULT_LOCATION)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | error
  const [errorMessage, setErrorMessage] = useState(null)
  // No es state: la navegación a la confirmación puede quedar pendiente
  // (React Router la trata como una transición) mientras el carrito ya
  // se vació, y no queremos que ese instante dispare el guard de "carrito
  // vacío" en CheckoutPage y redirija a /delivery en el medio.
  const hasSubmittedRef = useRef(false)

  const items = useCartStore((state) => state.items)
  const totalPrice = useCartStore(selectTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)

  function setField(name, value) {
    setFields((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function submit() {
    const validationErrors = validate(fields)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setStatus('submitting')
    setErrorMessage(null)
    try {
      const order = {
        ...fields,
        // Prefijo del país elegido + número local, en formato internacional.
        telefono: buildFullPhone(fields.codigoPais, fields.telefono),
        location,
        items,
        total: totalPrice,
      }

      const result = await createOrder(order)

      if (result.status !== 'created') {
        setStatus('error')
        setErrorMessage(
          result.status === 'rejected'
            ? (REJECTION_MESSAGES[result.reason]?.() ?? DEFAULT_REJECTION)
            : FAILURE_MESSAGE
        )
        return
      }

      hasSubmittedRef.current = true
      navigate('/delivery/confirmacion', {
        state: { order: { ...order, numero: result.numero } },
      })
      clearCart()
    } catch {
      setStatus('error')
      setErrorMessage(FAILURE_MESSAGE)
    }
  }

  return {
    fields,
    setField,
    location,
    setLocation,
    errors,
    status,
    errorMessage,
    submit,
    items,
    totalPrice,
    hasSubmitted: hasSubmittedRef.current,
    // Avisos inmediatos, sin esperar al envío. El backend los revalida
    // igual: esto es sólo para que el cliente no complete el formulario
    // entero antes de enterarse.
    estaAbierto: isOpenAt(),
    proximaApertura: nextOpeningLabel(),
    horarioLabel: HORARIO_LABEL,
    ubicacionEnZona: isWithinDeliveryArea(location),
  }
}
