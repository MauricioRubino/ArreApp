import { useState } from 'react'
import { createReservation } from '../services/reservasService'
import { notifyOwnerOfReservation } from '../services/notificationService'
import { PERSONAS_MAX_ONLINE } from '../data/reservasData'

const INITIAL_FIELDS = {
  nombre: '',
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
  if (!/^[\d\s+()-]{6,}$/.test(fields.telefono.trim())) {
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
    try {
      const result = await createReservation({
        ...fields,
        personas: Number(fields.personas),
      })
      const numero = await notifyOwnerOfReservation(result)
      setReservation({ ...result, numero })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function reset() {
    setFields(INITIAL_FIELDS)
    setErrors({})
    setStatus('idle')
    setReservation(null)
  }

  return {
    fields,
    setField,
    errors,
    status,
    reservation,
    submit,
    reset,
    minDate: todayISO(),
    requiresPhoneCall: Number(fields.personas) > PERSONAS_MAX_ONLINE,
  }
}
