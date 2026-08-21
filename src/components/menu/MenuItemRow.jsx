import { Leaf, Plus } from 'lucide-react'
import { formatPrice } from '../../utils/format'

export default function MenuItemRow({ item, onAdd }) {
  const isVeg = item.tags.includes('vegetariano') || item.tags.includes('vegano')

  return (
    <div className="flex items-start gap-3 py-4 border-b border-linea/60 last:border-b-0 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4 className="font-display text-tinta text-[17px] sm:text-lg tracking-wide">
            {item.name}
          </h4>
          {isVeg && <Leaf className="w-3.5 h-3.5 text-salvia shrink-0" strokeWidth={2.5} />}
          {/* Puntitos de carta impresa: se comen el espacio sobrante y
              desaparecen solos cuando el nombre es largo y envuelve. */}
          <span className="flex-1 min-w-4 border-b border-dotted border-tinta-dim/40 translate-y-[-4px]" />
          <span className="font-body font-semibold text-title tabular-nums shrink-0">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.description && (
          <p className="text-[13px] sm:text-sm text-tinta-dim leading-snug mt-1 pr-2">
            {item.description}
          </p>
        )}
        {item.requiresGuarnicion && (
          <p className="text-xs text-salvia italic mt-0.5">Guarnición a elección incluida.</p>
        )}
      </div>

      {/* Siempre visible: en el celular no hay hover, y esta app se usa
          sobre todo desde el celular. 44px es el mínimo táctil cómodo. */}
      <button
        onClick={() => onAdd?.(item)}
        aria-label={`Agregar ${item.name}`}
        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center border border-linea text-title bg-crema-soft/40 hover:bg-title hover:border-title hover:text-crema active:scale-90 transition-all duration-150"
      >
        <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
