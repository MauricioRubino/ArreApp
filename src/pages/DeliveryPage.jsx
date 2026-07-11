import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useCartStore, selectTotalPrice } from '../store/cartStore'
import CartLine from '../components/cart/CartLine'
import { formatPrice } from '../utils/format'

export default function DeliveryPage() {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const totalPrice = useCartStore(selectTotalPrice)

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
        <h1 className="font-display text-4xl sm:text-5xl text-tinta tracking-wide">Tu Pedido</h1>
        <p className="text-tinta-dim mt-3 max-w-lg mx-auto">
          Revisá los platos que agregaste desde la carta antes de continuar.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16">
          <span className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-5 h-5 text-teal" strokeWidth={1.75} />
          </span>
          <p className="font-display text-2xl text-tinta mb-2">Tu carrito está vacío</p>
          <p className="text-sm text-tinta-dim mb-6">Agregá platos desde la carta para armar tu pedido.</p>
          <Link
            to="/carta"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-title hover:text-title-soft transition-colors border border-linea hover:border-title rounded-full px-4 py-2"
          >
            Ver la carta
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="border border-linea rounded-lg px-6 bg-crema-soft/40">
            {items.map((item) => (
              <CartLine
                key={item.cartItemId}
                item={item}
                onQuantityChange={setQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 px-1">
            <span className="text-sm uppercase tracking-wide text-tinta-dim">Total</span>
            <span className="font-display text-2xl text-title tabular-nums">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <Link
            to="/delivery/checkout"
            className="block text-center bg-title hover:bg-title-soft text-crema font-medium tracking-wide rounded-lg px-6 py-3 mt-6 transition-colors"
          >
            Realizar pedido
          </Link>
        </div>
      )}
    </div>
  )
}
