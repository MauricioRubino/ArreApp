import { CheckCircle2, MessageCircle, TriangleAlert } from 'lucide-react'
import { formatPrice } from '../../utils/format'
import { METODOS_PAGO } from '../../data/paymentData'
import { RESTAURANT_WHATSAPP } from '../../data/contactData'
import { buildOrderWhatsAppText, buildWaLink } from '../../utils/waLink'

export default function OrderConfirmation({ order }) {
  const metodoPagoLabel = METODOS_PAGO.find((m) => m.id === order.metodoPago)?.label
  const needsManualSend = order.notificationDelivered === false

  return (
    <div className="max-w-xl mx-auto text-center border border-linea rounded-lg px-6 sm:px-10 py-12 bg-crema-soft/60">
      <span className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 className="w-6 h-6 text-teal" strokeWidth={1.75} />
      </span>

      {order.numero && (
        <p className="text-xs uppercase tracking-[0.2em] text-teal font-semibold mb-2">
          Pedido #{order.numero}
        </p>
      )}
      <h2 className="font-display text-2xl text-tinta tracking-wide mb-2">¡Tu pedido está listo!</h2>
      <p className="text-sm text-tinta-dim mb-8">Ya lo recibimos y lo estamos preparando.</p>

      {needsManualSend && (
        <div className="text-left text-sm border border-title/30 bg-title/5 rounded-lg px-4 py-3 mb-8">
          <p className="flex items-start gap-2 text-tinta mb-2">
            <TriangleAlert className="w-4 h-4 text-title shrink-0 mt-0.5" strokeWidth={2} />
            No pudimos avisarle automáticamente al restaurante.
          </p>
          {RESTAURANT_WHATSAPP ? (
            <a
              href={buildWaLink(RESTAURANT_WHATSAPP, buildOrderWhatsAppText(order))}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-title hover:bg-title-soft text-crema text-xs font-medium tracking-wide rounded-lg px-4 py-2 transition-colors"
            >
              Enviar el pedido por WhatsApp
            </a>
          ) : (
            <p className="text-tinta-dim">Comunicate con el restaurante para confirmar que lo hayan recibido.</p>
          )}
        </div>
      )}

      <div className="text-left border-t border-linea pt-6 mb-6">
        <p className="text-xs uppercase tracking-wide text-tinta-dim mb-3">Detalle del pedido</p>
        <dl className="text-sm flex flex-col gap-2.5">
          {order.items.map((item) => (
            <div key={item.cartItemId} className="flex justify-between gap-3">
              <dt className="text-tinta-dim">
                {item.quantity}× {item.name}
                {item.guarnicion && ` (${item.guarnicion})`}
              </dt>
              <dd className="text-tinta tabular-nums">{formatPrice(item.price * item.quantity)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-linea pt-2.5 font-medium text-title">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="text-left border-t border-linea pt-6 mb-8">
        <p className="text-xs uppercase tracking-wide text-tinta-dim mb-3">Datos del comprador</p>
        <dl className="text-sm flex flex-col gap-2.5">
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-dim">Nombre</dt>
            <dd className="text-tinta text-right">{order.nombre}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-dim">Teléfono</dt>
            <dd className="text-tinta text-right">{order.telefono}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tinta-dim">Dirección</dt>
            <dd className="text-tinta text-right">
              {order.calle}
              {order.referenciaHogar && ` (${order.referenciaHogar})`}
            </dd>
          </div>
          {metodoPagoLabel && (
            <div className="flex justify-between gap-3">
              <dt className="text-tinta-dim">Método de pago</dt>
              <dd className="text-tinta text-right">{metodoPagoLabel}</dd>
            </div>
          )}
        </dl>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-tinta-dim">
        <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
        Te vamos a avisar por WhatsApp cuando tu pedido esté en camino.
      </p>
    </div>
  )
}
