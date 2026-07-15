import { ChevronDown } from 'lucide-react'
import { COUNTRY_CODES } from '../../data/countryCodes'

const inputClass =
  'w-full rounded-lg border border-linea bg-crema-soft/40 px-3.5 py-2.5 text-sm text-tinta placeholder:text-tinta-dim/60 focus:outline-none focus:border-title transition-colors'

// Selector de país (bandera + prefijo) + número local. El <select> nativo
// va invisible encima de la etiqueta compacta: el desplegable muestra los
// nombres completos de los países, pero cerrado ocupa poco ancho (clave
// en celular).
export default function PhoneInput({ country, onCountryChange, value, onChange }) {
  const selected = COUNTRY_CODES.find((c) => c.id === country) ?? COUNTRY_CODES[0]

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <span className="flex items-center gap-1.5 h-full rounded-lg border border-linea bg-crema-soft/40 px-3 py-2.5 text-sm text-tinta">
          <span aria-hidden="true">{selected.flag}</span>
          <span className="tabular-nums">+{selected.prefix}</span>
          <ChevronDown className="w-3.5 h-3.5 text-tinta-dim" strokeWidth={2} />
        </span>
        <select
          value={selected.id}
          onChange={(e) => onCountryChange(e.target.value)}
          aria-label="País del teléfono"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.flag} {c.label} (+{c.prefix})
            </option>
          ))}
        </select>
      </div>

      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="99 123 456"
        className={`${inputClass} flex-1 min-w-0`}
      />
    </div>
  )
}
