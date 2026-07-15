import { useState } from 'react'
import { createReservation } from '../services/reservasService'
import { notifyOwnerOfReservation } from '../services/notificationService'
import { PERSONAS_MAX_ONLINE } from '../data/reservasData'
import { DEFAULT_COUNTRY, buildFullPhone } from '../data/countryCodes'

const INITIAL_FIELDS = {
  nombre: '',
  codigoPais: DEFAULT_COUNTRY,
  telefono: '',
  fecha: '',
  hora: '',
  personas: '2',
  zona: 'sin-preferencia',
  comentario: '',
}

function todayISO() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

function validate(fields) {
  const errors = {}
  if (!fields.nombre.trim()) errors.nombre = 'Ingresá tu nombre.'
  if (fields.telefono.replace(/\D/g, '').length < 6) {
    errors.telefono = 'Ingresá un teléfono válido (te escribimos por acá).'
  }
  if (!fields.fecha) errors.fecha = 'Elegí una fecha.'
  else if (fields.fecha < todayISO()) errors.fecha = 'La fecha no puede ser pasada.'
  if (!fields.hora) errors.hora = 'Elegí un horario.'
  const personas = Number(fields.personas)
  if (!personas || personas < 1) errors.personas = 'Indicá cuántas personas son.'
  return errors
}

export function useReservaForm() {
  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMessage, setErrorMessage] = useState(null)
  const [reservation, setReservation] = useState(null)

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
      const result = await createReservation({
        ...fields,
        // El número exacto para WhatsApp: prefijo del país elegido + local.
        telefono: buildFullPhone(fields.codigoPais, fields.telefono),
        personas: Number(fields.personas),
      })

      const notification = await notifyOwnerOfReservation(result)

      if (notification.status === 'rejected') {
        setStatus('error')
        setErrorMessage('No pudimos procesar la reserva. Revisá los datos e intentá de nuevo.')
        return
      }

      setReservation({
        ...result,
        numero: notification.numero ?? null,
        notificationDelivered: notification.status === 'sent' && notification.delivered,
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function reset() {
    setFields(INITIAL_FIELDS)
    setErrors({})
    setStatus('idle')
    setErrorMessage(null)
    setReservation(null)
  }

  return {
    fields,
    setField,
    errors,
    status,
    errorMessage,
    reservation,
    submit,
    reset,
    minDate: todayISO(),
    requiresPhoneCall: Number(fields.personas) > PERSONAS_MAX_ONLINE,
  }
}
