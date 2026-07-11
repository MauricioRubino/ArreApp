import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useReservaForm } from '../hooks/useReservaForm'
import ReservaForm from '../components/reservas/ReservaForm'
import ReservaConfirmation from '../components/reservas/ReservaConfirmation'

export default function ReservasPage() {
  const { fields, setField, errors, status, reservation, submit, reset, minDate, requiresPhoneCall } =
    useReservaForm()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-tinta-dim hover:text-title transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Inicio
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-tinta tracking-wide">Reservá tu mesa</h1>
        <p className="text-tinta-dim mt-3 max-w-lg mx-auto">
          Contanos cuándo venís y te confirmamos por WhatsApp apenas la mesa esté lista.
        </p>
      </div>

      {status === 'success' && reservation ? (
        <ReservaConfirmation reservation={reservation} onReset={reset} />
      ) : (
        <ReservaForm
          fields={fields}
          errors={errors}
          setField={setField}
          status={status}
          requiresPhoneCall={requiresPhoneCall}
          minDate={minDate}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
