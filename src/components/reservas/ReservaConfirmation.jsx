import { CheckCircle2, MessageCircle, TriangleAlert } from 'lucide-react'
import { ZONAS } from '../../data/reservasData'
import { RESTAURANT_WHATSAPP } from '../../data/contactData'
import { buildReservationWhatsAppText, buildWaLink } from '../../utils/waLink'

function formatFecha(iso) {
  const [year, month, day] = iso.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ReservaConfirmation({ reservation, onReset }) {
  const zonaLabel = ZONAS.find((z) => z.id === reservation.zona)?.label
  const needsManualSend = reservation.notificationDelivered === false

  return (
    <div className="max-w-xl mx-auto text-center border border-linea rounded-lg px-6 sm:px-10 py-12 bg-crema-soft/60">
      <span className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-6 h-6 text-teal" strokeWidth={1.75} />
      </span>

      {reservation.numero && (
        <p className="text-xs uppercase tracking-[0.2em] text-teal font-semibold mb-2">
          Reserva #{reservation.numero}
        </p>
      )}
      <h2 className="font-display text-2xl text-tinta tracking-wide mb-2">¡Reserva enviada!</h2>
      <p className="text-sm text-tinta-dim mb-8">
        Hola {reservation.nombre}, anotamos tu solicitud. Te confirmamos la mesa por WhatsApp al{' '}
        <span className="text-tinta font-medium">{reservation.telefono}</span>.
      </p>

      {needsManualSend && (
        <div className="text-left text-sm border border-title/30 bg-title/5 rounded-lg px-4 py-3 mb-8">
          <p className="flex items-start gap-2 text-tinta mb-2">
            <TriangleAlert className="w-4 h-4 text-title shrink-0 mt-0.5" strokeWidth={2} />
            No pudimos avisarle automáticamente al restaurante.
          </p>
          {RESTAURANT_WHATSAPP ? (
            <a
              href={buildWaLink(RESTAURANT_WHATSAPP, buildReservationWhatsAppText(reservation))}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-title hover:bg-title-soft text-crema text-xs font-medium tracking-wide rounded-lg px-4 py-2 transition-colors"
            >
              Enviar la reserva por WhatsApp
            </a>
          ) : (
            <p className="text-tinta-dim">Comunicate con el restaurante para confirmar que la hayan recibido.</p>
          )}
        </div>
      )}

      <dl className="text-left text-sm border-t border-linea pt-6 flex flex-col gap-2.5 mb-8">
        <div className="flex justify-between gap-3">
          <dt className="text-tinta-dim">Fecha</dt>
          <dd className="text-tinta capitalize text-right">{formatFecha(reservation.fecha)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-tinta-dim">Horario</dt>
          <dd className="text-tinta">{reservation.hora}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-tinta-dim">Personas</dt>
          <dd className="text-tinta">{reservation.personas}</dd>
        </div>
        {zonaLabel && (
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-dim">Zona</dt>
            <dd className="text-tinta">{zonaLabel}</dd>
          </div>
        )}
      </dl>

      <p className="flex items-center justify-center gap-1.5 text-xs text-tinta-dim mb-8">
        <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
        Te avisamos apenas la mesa esté lista.
      </p>

      <button
        onClick={onReset}
        className="text-xs uppercase tracking-wide text-title hover:text-title-soft transition-colors"
      >
        Hacer otra reserva
      </button>
    </div>
  )
}
