// Envío de mensajes de WhatsApp (Meta Cloud API). Reutilizado tanto para
// avisar al dueño como para avisarle al cliente.
//
// Supuesto sobre la plantilla: una sola plantilla aprobada en Meta, con
// un único parámetro de cuerpo ({{1}}) que recibe el texto ya armado.

export const isWhatsAppConfigured = Boolean(
  process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
)

export async function sendWhatsAppMessage(to, text) {
  const { WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME } = process.env

  if (!isWhatsAppConfigured) {
    console.log(`[whatsapp] No configurado. Mensaje simulado para ${to}:\n${text}`)
    return { ok: true, simulated: true }
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: WHATSAPP_TEMPLATE_NAME || 'notificacion_arrecife',
          language: { code: 'es_UY' },
          components: [{ type: 'body', parameters: [{ type: 'text', text }] }],
        },
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('[whatsapp] Error de la API de WhatsApp:', data)
      return { ok: false, error: data }
    }
    return { ok: true, simulated: false, data }
  } catch (error) {
    console.error('[whatsapp] Error enviando mensaje:', error)
    return { ok: false, error: String(error) }
  }
}
