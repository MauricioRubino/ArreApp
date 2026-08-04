import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../services/checkoutService'
import { notifyOwnerOfOrder } from '../services/notificationService'
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

const REJECTION_MESSAGES = {
  'sin-stock': (n) =>
    `Estos platos se quedaron sin stock: ${n.items.join(', ')}. Quitalos del carrito para continuar.`,
  cerrado: () =>
    `El restaurante está cerrado en este momento. Atendemos de ${HORARIO_LABEL}: volvé ${nextOpeningLabel()}.`,
  'fuera-de-zona': () =>
    `Por ahora sólo entregamos en ${DELIVERY_AREA_LABEL}. Movés el pin del mapa dentro de la zona marcada para continuar.`,
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
      const result = await createOrder({
        ...fields,
        // El número exacto para WhatsApp: prefijo del país elegido + local.
        telefono: buildFullPhone(fields.codigoPais, fields.telefono),
        location,
        items,
        total: totalPrice,
      })

      const notification = await notifyOwnerOfOrder(result)

      if (notification.status === 'rejected') {
        setStatus('error')
        setErrorMessage(REJECTION_MESSAGES[notification.reason]?.(notification) ?? DEFAULT_REJECTION)
        return
      }

      hasSubmittedRef.current = true
      navigate('/delivery/confirmacion', {
        state: {
          order: {
            ...result,
            numero: notification.numero ?? null,
            notificationDelivered: notification.status === 'sent' && notification.delivered,
          },
        },
      })
      clearCart()
    } catch {
      setStatus('error')
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
