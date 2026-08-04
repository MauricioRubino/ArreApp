import { useMemo, useState } from 'react'
import { createReservation } from '../services/reservasService'
import { notifyOwnerOfReservation } from '../services/notificationService'
import { PERSONAS_MAX_ONLINE, TURNOS } from '../data/reservasData'
import { DEFAULT_COUNTRY, buildFullPhone } from '../data/countryCodes'
import { nowInMontevideo, todayInMontevideo, minutesFromHHMM } from '../data/scheduleData'

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

function validate(fields) {
  const errors = {}
  if (!fields.nombre.trim()) errors.nombre = 'Ingresá tu nombre.'
  if (fields.telefono.replace(/\D/g, '').length < 6) {
    errors.telefono = 'Ingresá un teléfono válido (te escribimos por acá).'
  }
  if (!fields.fecha) errors.fecha = 'Elegí una fecha.'
  else if (fields.fecha < todayInMontevideo()) errors.fecha = 'La fecha no puede ser pasada.'
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

  // Si la reserva es para hoy, no tiene sentido ofrecer horarios que ya
  // pasaron. Para otros días se ofrecen todos.
  const turnosDisponibles = useMemo(() => {
    if (fields.fecha !== todayInMontevideo()) return TURNOS
    const { minutos } = nowInMontevideo()
    return TURNOS.map((turno) => ({
      ...turno,
      horarios: turno.horarios.filter((hora) => minutesFromHHMM(hora) > minutos),
    })).filter((turno) => turno.horarios.length > 0)
  }, [fields.fecha])

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
        setErrorMessage(
          notification.reason === 'en-pasado'
            ? 'Ese horario ya pasó. Elegí uno más adelante.'
            : 'No pudimos procesar la reserva. Revisá los datos e intentá de nuevo.'
        )
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
    minDate: todayInMontevideo(),
    turnosDisponibles,
    requiresPhoneCall: Number(fields.personas) > PERSONAS_MAX_ONLINE,
  }
}
