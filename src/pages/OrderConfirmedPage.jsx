import { Link, Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import OrderConfirmation from '../components/checkout/OrderConfirmation'

export default function OrderConfirmedPage() {
  const location = useLocation()
  const order = location.state?.order

  if (!order) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-tinta-dim hover:text-title transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Inicio
      </Link>

      <OrderConfirmation order={order} />
    </div>
  )
}
