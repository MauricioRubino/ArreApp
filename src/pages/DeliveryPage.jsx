import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function DeliveryPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-tinta-dim hover:text-title transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Inicio
      </Link>
      <div className="text-center py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-title mb-3">Próximamente</p>
        <h1 className="font-display text-4xl text-tinta tracking-wide">Delivery</h1>
        <p className="text-tinta-dim mt-2">El carrito y el checkout se arman en la próxima fase.</p>
      </div>
    </div>
  )
}
