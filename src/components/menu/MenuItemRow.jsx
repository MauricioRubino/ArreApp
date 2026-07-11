import { Leaf, Plus } from 'lucide-react'

function formatPrice(price) {
  return `$${price.toLocaleString('es-UY')}`
}

export default function MenuItemRow({ item, onAdd }) {
  const isVeg = item.tags.includes('vegetariano') || item.tags.includes('vegano')

  return (
    <div className="py-3 border-b border-linea/60 last:border-b-0 group">
      <div className="flex items-baseline gap-2">
        <h4 className="font-display text-tinta text-base sm:text-lg tracking-wide shrink-0">
          {item.name}
        </h4>
        {isVeg && <Leaf className="w-3 h-3 text-salvia shrink-0 mb-0.5" strokeWidth={2.5} />}
        <span className="flex-1 border-b border-dotted border-tinta-dim/40 translate-y-[-3px]" />
        <span className="font-body font-semibold text-title tabular-nums shrink-0">
          {formatPrice(item.price)}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3 mt-0.5">
        {item.description ? (
          <p className="text-sm text-tinta-dim leading-snug pr-4">{item.description}</p>
        ) : (
          <span />
        )}
        <button
          onClick={() => onAdd?.(item)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-60 flex items-center gap-1 text-[11px] uppercase tracking-wide text-tinta-dim hover:text-title border border-linea hover:border-title rounded-full px-2.5 py-1 shrink-0 transition"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          Agregar
        </button>
      </div>
    </div>
  )
}
