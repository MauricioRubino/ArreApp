import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useCheckoutForm } from '../hooks/useCheckoutForm'
import CheckoutForm from '../components/checkout/CheckoutForm'

export default function CheckoutPage() {
  const {
    fields,
    setField,
    location,
    setLocation,
    errors,
    status,
    errorMessage,
    submit,
    items,
    totalPrice,
    hasSubmitted,
    estaAbierto,
    proximaApertura,
    horarioLabel,
    ubicacionEnZona,
  } = useCheckoutForm()

  if (items.length === 0 && !hasSubmitted) {
    return <Navigate to="/delivery" replace />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/delivery"
        className="inline-flex items-center gap-1.5 text-xs text-tinta-dim hover:text-title transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Carrito
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-tinta tracking-wide">Realizá tu pedido</h1>
        <p className="text-tinta-dim mt-3 max-w-lg mx-auto">
          Contanos tus datos y marcá tu ubicación para coordinar la entrega.
        </p>
      </div>

      <CheckoutForm
        fields={fields}
        errors={errors}
        setField={setField}
        location={location}
        setLocation={setLocation}
        status={status}
        errorMessage={errorMessage}
        items={items}
        totalPrice={totalPrice}
        onSubmit={submit}
        estaAbierto={estaAbierto}
        proximaApertura={proximaApertura}
        horarioLabel={horarioLabel}
        ubicacionEnZona={ubicacionEnZona}
      />
    </div>
  )
}
