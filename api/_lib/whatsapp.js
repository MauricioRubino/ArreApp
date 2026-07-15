// Envío de mensajes de WhatsApp (Meta Cloud API).
//
// Dos modos, porque Meta los trata distinto:
//
// - sendWhatsAppText: mensaje de texto libre (multilínea, con *negritas*).
//   Sólo se entrega si el destinatario escribió en las últimas 24 horas
//   (ventana de servicio); dentro de esa ventana es gratis. Si está fuera
//   de la ventana, la API lo rechaza y quien llama debe usar la plantilla.
//
// - sendWhatsAppTemplate: mensaje de plantilla pre-aprobada, para iniciar
//   conversación (avisos al cliente, ping al dueño). IMPORTANTE: Meta NO
//   permite saltos de línea ni tabulaciones en los parámetros de plantilla,
//   por eso acá el parámetro se sanitiza a una sola línea.
//
// Plantilla sugerida para aprobar en Meta (una sola, categoría Utility):
//   nombre: notificacion_arrecife  ·  idioma: es_UY
//   cuerpo: "Aviso de Arrecife: {{1}}"

function getConfig() {
  return {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'notificacion_arrecife',
  }
}

export function isWhatsAppConfigured() {
  const { token, phoneNumberId } = getConfig()
  return Boolean(token && phoneNumberId)
}

// Colapsa saltos de línea y espacios repetidos: los parámetros de plantilla
// de Meta no aceptan \n, \t ni más de 4 espacios consecutivos.
export function sanitizeTemplateParam(text) {
  return String(text).replace(/\s+/g, ' ').trim().slice(0, 1000)
}

async function postMessage(body) {
  const { token, phoneNumberId } = getConfig()
  try {
    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('[whatsapp] Error de la API de WhatsApp:', JSON.stringify(data))
      return { ok: false, error: data }
    }
    return { ok: true, simulated: false, data }
  } catch (error) {
    console.error('[whatsapp] Error enviando mensaje:', error)
    return { ok: false, error: String(error) }
  }
}

export async function sendWhatsAppText(to, text) {
  if (!isWhatsAppConfigured()) {
    console.log(`[whatsapp] No configurado. Texto simulado para ${to}:\n${text}`)
    return { ok: true, simulated: true }
  }
  return postMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text, preview_url: false },
  })
}

export async function sendWhatsAppTemplate(to, param) {
  const sanitized = sanitizeTemplateParam(param)
  if (!isWhatsAppConfigured()) {
    console.log(`[whatsapp] No configurado. Plantilla simulada para ${to}: ${sanitized}`)
    return { ok: true, simulated: true }
  }
  const { templateName } = getConfig()
  return postMessage({
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es_UY' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: sanitized }] }],
    },
  })
}
