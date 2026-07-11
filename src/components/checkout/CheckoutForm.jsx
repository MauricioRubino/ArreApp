import { Loader2 } from 'lucide-react'
import LocationMap from './LocationMap'
import { formatPrice } from '../../utils/format'
import { METODOS_PAGO } from '../../data/paymentData'

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
  items,
  totalPrice,
  onSubmit,
}) {
  const isSubmitting = status === 'submitting'

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="max-w-xl mx-auto flex flex-col gap-5"
    >
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

        <Field label="Teléfono" error={errors.telefono}>
          <input
            type="tel"
            value={fields.telefono}
            onChange={(e) => setField('telefono', e.target.value)}
            placeholder="+598 9x xxx xxx"
            className={inputClass}
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
        <LocationMap value={location} onChange={setLocation} />
        <p className="text-xs text-tinta-dim mt-1.5">
          Tocá el mapa o arrastrá el pin para marcar exactamente dónde entregamos tu pedido.
        </p>
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
          Hubo un problema al enviar tu pedido. Probá de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 bg-title hover:bg-title-soft disabled:opacity-60 text-crema font-medium tracking-wide rounded-lg px-6 py-3 mt-2 transition-colors"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
        {isSubmitting ? 'Enviando pedido...' : 'Confirmar pedido'}
      </button>
    </form>
  )
}
