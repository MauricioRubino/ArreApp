import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../services/checkoutService'
import { notifyOwnerOfOrder } from '../services/notificationService'
import { useCartStore, selectTotalPrice } from '../store/cartStore'
import { DEFAULT_LOCATION } from '../data/locationData'

const INITIAL_FIELDS = {
  nombre: '',
  telefono: '',
  calle: '',
  referenciaHogar: '',
  metodoPago: '',
}

function validate(fields) {
  const errors = {}
  if (!fields.nombre.trim()) errors.nombre = 'Ingresá tu nombre.'
  if (!/^[\d\s+()-]{6,}$/.test(fields.telefono.trim())) {
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
    try {
      const result = await createOrder({
        ...fields,
        location,
        items,
        total: totalPrice,
      })
      hasSubmittedRef.current = true
      navigate('/delivery/confirmacion', { state: { order: result } })
      clearCart()
      notifyOwnerOfOrder(result)
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
    submit,
    items,
    totalPrice,
    hasSubmitted: hasSubmittedRef.current,
  }
}
