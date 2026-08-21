import { Link } from 'react-router-dom'
import { BookOpen, ShoppingBag, CalendarCheck, ArrowRight } from 'lucide-react'

const OPTIONS = [
  {
    to: '/carta',
    icon: BookOpen,
    title: 'Ver la Carta',
    description: 'Entradas, brasas, pescados, pastas y bodega completa.',
  },
  {
    to: '/delivery',
    icon: ShoppingBag,
    title: 'Realizá tu Pedido',
    description: 'Elegí tus platos y pedilos para delivery.',
  },
  {
    to: '/reservas',
    icon: CalendarCheck,
    title: 'Hacé una Reserva',
    description: 'Reservá tu mesa y te confirmamos por teléfono.',
  },
]

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center">
      <img
        src="/arrecife-logo.png"
        alt="Arrecife — Restaurant Parrillada"
        className="w-full max-w-md h-auto mb-6"
      />

      <p className="text-tinta-dim max-w-md mb-14">Desde 1986.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {OPTIONS.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col items-center text-center gap-3 border border-linea rounded-lg px-6 py-8 bg-crema-soft/60 hover:border-title hover:bg-crema-soft transition-colors"
          >
            <span className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center group-hover:bg-teal/15 transition-colors">
              <Icon className="w-5 h-5 text-teal" strokeWidth={1.75} />
            </span>
            <span className="font-display text-xl text-tinta tracking-wide">{title}</span>
            <span className="text-sm text-tinta-dim">{description}</span>
            <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-title opacity-0 group-hover:opacity-100 transition-opacity">
              Continuar
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
