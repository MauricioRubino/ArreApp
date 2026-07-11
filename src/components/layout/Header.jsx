import { NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCartStore, selectTotalItems } from '../../store/cartStore'

const navLinkClass = ({ isActive }) =>
  `text-sm tracking-wide transition-colors ${
    isActive ? 'text-title' : 'text-tinta-dim hover:text-tinta'
  }`

export default function Header() {
  const totalItems = useCartStore(selectTotalItems)

  return (
    <header className="border-b border-linea bg-crema/90 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center">
          <img src="/arrecife-logo.png" alt="Arrecife" className="h-9 sm:h-10 w-auto" />
        </NavLink>

        <nav className="hidden sm:flex items-center gap-8">
          <NavLink to="/carta" className={navLinkClass}>
            Carta
          </NavLink>
          <NavLink to="/delivery" className={navLinkClass}>
            Delivery
          </NavLink>
          <NavLink to="/reservas" className={navLinkClass}>
            Reservas
          </NavLink>
        </nav>

        <NavLink
          to="/delivery"
          className="relative flex items-center gap-2 text-tinta hover:text-title transition-colors"
          aria-label="Ver carrito"
        >
          <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-title text-crema text-[10px] font-semibold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </NavLink>
      </div>
    </header>
  )
}
