import { lazy, Suspense } from 'react'
import { Clock, Loader2, MapPin } from 'lucide-react'
import PhoneInput from '../forms/PhoneInput'
import { formatPrice } from '../../utils/format'
import { METODOS_PAGO } from '../../data/paymentData'
import { DELIVERY_AREA_LABEL } from '../../data/locationData'

// Leaflet pesa ~150 kB y sólo se usa acá: se carga al abrir el checkout,
// no al entrar a la carta.
const LocationMap = lazy(() => import('./LocationMap'))

const inputClass =
  'w-full rounded-lg border border-linea bg-crema-soft/40 px-3.5 py-2.5 text-sm text-tinta placeholder:text-tinta-dim/60 focus:outline-none focus:border-title transition-colors'

const labelClass = 'block text-xs uppercase tracking-wide text-tinta-dim mb-1.5'

function Field({ label, error, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className="text-xs text-title mt-1">{error}</p>}
    </div>
  )
}

export default function CheckoutForm({
  fields,
  errors,
  setField,
  location,
  setLocation,
  status,
  errorMessage,
  items,
  totalPrice,
  onSubmit,
  estaAbierto,
  proximaApertura,
  horarioLabel,
  ubicacionEnZona,
}) {
  const isSubmitting = status === 'submitting'
  const bloqueado = !estaAbierto || !ubicacionEnZona

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="max-w-xl mx-auto flex flex-col gap-5"
    >
      {!estaAbierto && (
        <div className="flex items-start gap-2 text-sm border border-title/30 bg-title/5 rounded-lg px-4 py-3">
          <Clock className="w-4 h-4 text-title shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-tinta">
            Ahora estamos cerrados. Atendemos de <strong>{horarioLabel}</strong>; podés hacer tu
            pedido {proximaApertura}.
          </p>
        </div>
      )}

      <div className="border border-linea rounded-lg px-5 py-4 bg-crema-soft/40">
        <p className="text-xs uppercase tracking-wide text-tinta-dim mb-2">Tu pedido</p>
        <ul className="text-sm text-tinta flex flex-col gap-1 mb-3">
          {items.map((item) => (
            <li key={item.cartItemId} className="flex justify-between gap-3">
              <span>
                {item.quantity}× {item.name}
                {item.guarnicion && <span className="text-tinta-dim"> ({item.guarnicion})</span>}
              </span>
              <span className="tabular-nums">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-linea pt-2 text-sm font-medium text-title">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(totalPrice)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nombre y apellido" error={errors.nombre}>
          <input
            type="text"
            value={fields.nombre}
            onChange={(e) => setField('nombre', e.target.value)}
            placeholder="Tu nombre"
            className={inputClass}
          />
        </Field>

        <Field label="Teléfono (WhatsApp)" error={errors.telefono}>
          <PhoneInput
            country={fields.codigoPais}
            onCountryChange={(value) => setField('codigoPais', value)}
            value={fields.telefono}
            onChange={(value) => setField('telefono', value)}
          />
        </Field>
      </div>

      <Field label="Calle y número" error={errors.calle}>
        <input
          type="text"
          value={fields.calle}
          onChange={(e) => setField('calle', e.target.value)}
          placeholder="Av. Solís y 25"
          className={inputClass}
        />
      </Field>

      <Field label="Referencia de tu hogar (opcional)">
        <input
          type="text"
          value={fields.referenciaHogar}
          onChange={(e) => setField('referenciaHogar', e.target.value)}
          placeholder='Ej. "Casa azul"'
          className={inputClass}
        />
      </Field>

      <div>
        <label className={labelClass}>Ubicación en el mapa</label>
        <Suspense
          fallback={
            <div className="h-[320px] rounded-lg border border-linea bg-crema-soft/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-tinta-dim animate-spin" strokeWidth={2} />
            </div>
          }
        >
          <LocationMap value={location} onChange={setLocation} />
        </Suspense>
        {ubicacionEnZona ? (
          <p className="text-xs text-tinta-dim mt-1.5">
            Tocá el mapa o arrastrá el pin para marcar exactamente dónde entregamos tu pedido.
          </p>
        ) : (
          <p className="flex items-start gap-1.5 text-xs text-title mt-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-px" strokeWidth={2} />
            Por ahora sólo entregamos en {DELIVERY_AREA_LABEL}. Movés el pin dentro del círculo para
            continuar.
          </p>
        )}
      </div>

      <Field label="Método de pago" error={errors.metodoPago}>
        <select
          value={fields.metodoPago}
          onChange={(e) => setField('metodoPago', e.target.value)}
          className={inputClass}
        >
          <option value="">Elija su método de pago</option>
          {METODOS_PAGO.map((metodo) => (
            <option key={metodo.id} value={metodo.id}>
              {metodo.label}
            </option>
          ))}
        </select>
      </Field>

      {status === 'error' && (
        <p className="text-xs text-title bg-title/5 border border-title/20 rounded-lg px-3.5 py-2.5">
          {errorMessage || 'Hubo un problema al enviar tu pedido. Probá de nuevo.'}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || bloqueado}
        className="flex items-center justify-center gap-2 bg-title hover:bg-title-soft disabled:opacity-40 disabled:cursor-not-allowed text-crema font-medium tracking-wide rounded-lg px-6 py-3 mt-2 transition-colors"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
        {isSubmitting ? 'Enviando pedido...' : 'Confirmar pedido'}
      </button>
    </form>
  )
}
