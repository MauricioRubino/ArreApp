import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatPrice } from '../../utils/format'

export default function CartLine({ item, onQuantityChange, onRemove }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-linea/60 last:border-b-0">
      <div className="flex-1 min-w-0">
        <h4 className="font-display text-tinta text-base sm:text-lg tracking-wide">{item.name}</h4>
        {item.guarnicion && (
          <p className="text-sm text-tinta-dim mt-0.5">Guarnición: {item.guarnicion}</p>
        )}
        <p className="text-xs text-tinta-dim mt-1">{formatPrice(item.price)} c/u</p>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={() => onRemove(item.cartItemId)}
          aria-label={`Quitar ${item.name}`}
          className="text-tinta-dim hover:text-title transition-colors"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-2 border border-linea rounded-full px-1.5 py-1">
          <button
            onClick={() => onQuantityChange(item.cartItemId, item.quantity - 1)}
            aria-label="Restar"
            className="text-tinta-dim hover:text-title transition-colors w-5 h-5 flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <span className="text-sm text-tinta tabular-nums w-4 text-center">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.cartItemId, item.quantity + 1)}
            aria-label="Sumar"
            className="text-tinta-dim hover:text-title transition-colors w-5 h-5 flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>

        <span className="font-body font-semibold text-title tabular-nums text-sm">
          {formatPrice(item.price * item.quantity)}
        </span>
      </div>
    </div>
  )
}
