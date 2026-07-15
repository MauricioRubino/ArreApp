import { Loader2 } from 'lucide-react'
import { TURNOS, ZONAS, PERSONAS_MAX_ONLINE } from '../../data/reservasData'

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

export default function ReservaForm({
  fields,
  errors,
  setField,
  status,
  errorMessage,
  requiresPhoneCall,
  minDate,
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
          <input
            type="tel"
            value={fields.telefono}
            onChange={(e) => setField('telefono', e.target.value)}
            placeholder="+598 9x xxx xxx"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Fecha" error={errors.fecha}>
          <input
            type="date"
            min={minDate}
            value={fields.fecha}
            onChange={(e) => setField('fecha', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Horario" error={errors.hora}>
          <select
            value={fields.hora}
            onChange={(e) => setField('hora', e.target.value)}
            className={inputClass}
          >
            <option value="">Elegí un horario</option>
            {TURNOS.map((turno) => (
              <optgroup key={turno.id} label={turno.label}>
                {turno.horarios.map((hora) => (
                  <option key={hora} value={hora}>
                    {hora}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Personas" error={errors.personas}>
          <input
            type="number"
            min="1"
            max="30"
            value={fields.personas}
            onChange={(e) => setField('personas', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Zona preferida">
          <select
            value={fields.zona}
            onChange={(e) => setField('zona', e.target.value)}
            className={inputClass}
          >
            {ZONAS.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {requiresPhoneCall && (
        <p className="text-xs text-title bg-title/5 border border-title/20 rounded-lg px-3.5 py-2.5">
          Para grupos de más de {PERSONAS_MAX_ONLINE} personas coordinamos por teléfono para
          asegurarte el mejor lugar. Igual podés enviar la reserva y te contactamos.
        </p>
      )}

      <Field label="Comentarios (opcional)">
        <textarea
          value={fields.comentario}
          onChange={(e) => setField('comentario', e.target.value)}
          placeholder="Alergias, cumpleaños, silla para bebé..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {status === 'error' && (
        <p className="text-xs text-title bg-title/5 border border-title/20 rounded-lg px-3.5 py-2.5">
          {errorMessage || 'Hubo un problema al enviar tu reserva. Probá de nuevo.'}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 bg-title hover:bg-title-soft disabled:opacity-60 text-crema font-medium tracking-wide rounded-lg px-6 py-3 mt-2 transition-colors"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />}
        {isSubmitting ? 'Enviando reserva...' : 'Confirmar reserva'}
      </button>
    </form>
  )
}
