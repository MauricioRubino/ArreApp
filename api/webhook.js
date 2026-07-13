// Webhook de WhatsApp Business Platform (Meta Cloud API).
//
// GET: handshake de verificación que Meta hace una sola vez al configurar
// el webhook en su panel (compara WHATSAPP_WEBHOOK_VERIFY_TOKEN).
//
// POST: mensajes entrantes. Sólo procesa mensajes que vengan del número
// del dueño (OWNER_WHATSAPP_NUMBER) — cualquier otro remitente se ignora.
// Reconoce tres tipos de comandos:
//   1. Estado de pedido/reserva: "ok #3", "listo #3", "en camino #3",
//      "confirmada #5", "cancelada #5"
//   2. Sin stock: "no hay rabas", "se acabó el pollo", "sin stock de X"
//   3. Reponer stock: "sí hay rabas", "volvió el stock de X"
//   4. Aclaración numerada: una respuesta con sólo un número, cuando hay
//      una desambiguación de stock pendiente.
//
// Variables de entorno (ver .env.example):
//   WHATSAPP_WEBHOOK_VERIFY_TOKEN, OWNER_WHATSAPP_NUMBER,
//   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID

import { sendWhatsAppMessage } from './_lib/whatsapp.js'
import { getRecord, updateRecordEstado } from './_lib/store.js'
import {
  markOutOfStock,
  markInStock,
  savePendingDisambiguation,
  getPendingDisambiguation,
  clearPendingDisambiguation,
} from './_lib/stockStore.js'
import { findMenuItemsByName, getMenuItemById } from './_lib/matchMenuItem.js'

const STATUS_COMMANDS = {
  ok: {
    tipo: 'order',
    estado: 'preparando',
    mensajeCliente: (n) => `Tu pedido #${n} se está preparando 🍽️`,
  },
  listo: {
    tipo: 'order',
    estado: 'listo',
    mensajeCliente: (n) => `Tu pedido #${n} está listo`,
  },
  'en camino': {
    tipo: 'order',
    estado: 'en-camino',
    mensajeCliente: (n) => `Tu pedido #${n} está en camino 🛵`,
  },
  confirmada: {
    tipo: 'reservation',
    estado: 'confirmada',
    mensajeCliente: (n) => `Tu reserva #${n} fue confirmada ✅`,
  },
  cancelada: {
    tipo: 'reservation',
    estado: 'cancelada',
    mensajeCliente: (n) => `Tu reserva #${n} fue cancelada`,
  },
}

const STOCK_OUT_PATTERNS = [/^no hay\s+(.+)/, /^se acab[oó]\s+(?:el|la|los|las)?\s*(.+)/, /^sin stock\s+(?:de\s+)?(.+)/]
const STOCK_IN_PATTERNS = [/^s[ií] hay\s+(.+)/, /^volvi[oó] (?:el )?stock\s+(?:de\s+)?(.+)/, /^hay stock\s+(?:de\s+)?(.+)/]
const BARE_NUMBER_PATTERN = /^#?\s*(\d+)$/

function parseStatusCommand(text) {
  const normalized = text.trim().toLowerCase()
  const keyword = Object.keys(STATUS_COMMANDS)
    .sort((a, b) => b.length - a.length)
    .find((k) => normalized.startsWith(k))
  if (!keyword) return null
  const rest = normalized.slice(keyword.length)
  const match = rest.match(/#?\s*(\d+)/)
  if (!match) return null
  return { keyword, numero: Number(match[1]) }
}

function parseStockCommand(text) {
  const normalized = text.trim().toLowerCase()
  for (const pattern of STOCK_OUT_PATTERNS) {
    const match = normalized.match(pattern)
    if (match) return { action: 'remove', query: match[1].trim() }
  }
  for (const pattern of STOCK_IN_PATTERNS) {
    const match = normalized.match(pattern)
    if (match) return { action: 'restore', query: match[1].trim() }
  }
  return null
}

async function handleStatusCommand(command, ownerNumber) {
  const definition = STATUS_COMMANDS[command.keyword]
  const record = await getRecord(command.numero)

  if (!record) {
    await sendWhatsAppMessage(ownerNumber, `No encontré el #${command.numero}.`)
    return
  }

  if (record.tipo !== definition.tipo) {
    const esperado = record.tipo === 'order' ? 'ok, listo o en camino' : 'confirmada o cancelada'
    await sendWhatsAppMessage(
      ownerNumber,
      `El #${command.numero} es ${record.tipo === 'order' ? 'un pedido' : 'una reserva'}, usá: ${esperado}.`
    )
    return
  }

  await updateRecordEstado(command.numero, definition.estado)
  await sendWhatsAppMessage(record.telefono, definition.mensajeCliente(command.numero))
  await sendWhatsAppMessage(
    ownerNumber,
    `✅ Le avisé a ${record.nombre} sobre el #${command.numero} (${definition.estado}).`
  )
}

async function handleStockCommand(command, ownerNumber) {
  const matches = findMenuItemsByName(command.query)

  if (matches.length === 0) {
    await sendWhatsAppMessage(ownerNumber, `No encontré ningún plato con "${command.query}" en el nombre.`)
    return
  }

  if (matches.length > 1) {
    const listado = matches.map((item, i) => `${i + 1}. ${item.name}`).join('\n')
    await savePendingDisambiguation(
      matches.map((item) => item.id),
      command.action
    )
    await sendWhatsAppMessage(
      ownerNumber,
      `Encontré varios platos con "${command.query}":\n${listado}\n\nRespondé con el número del que corresponde.`
    )
    return
  }

  await applyStockAction(matches[0].id, command.action, ownerNumber)
}

async function applyStockAction(itemId, action, ownerNumber) {
  const item = getMenuItemById(itemId)
  if (!item) return

  if (action === 'remove') {
    await markOutOfStock(itemId)
    await sendWhatsAppMessage(ownerNumber, `🚫 Marqué "${item.name}" sin stock.`)
  } else {
    await markInStock(itemId)
    await sendWhatsAppMessage(ownerNumber, `✅ Repuse el stock de "${item.name}".`)
  }
}

async function handleBareNumber(numero, ownerNumber) {
  const pending = await getPendingDisambiguation()
  if (!pending) return

  const itemId = pending.candidates[numero - 1]
  if (!itemId) {
    await sendWhatsAppMessage(ownerNumber, `Ese número no está en la lista. Probá de nuevo.`)
    return
  }

  await clearPendingDisambiguation()
  await applyStockAction(itemId, pending.action, ownerNumber)
}

function verifyWebhookRequest(req) {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  return mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (verifyWebhookRequest(req)) {
      res.status(200).send(req.query['hub.challenge'])
    } else {
      res.status(403).end()
    }
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER

  // Sin owner configurado no hay a quién contestar; y sólo procesamos
  // mensajes que vengan de ese número.
  if (!message || !ownerNumber || message.from !== ownerNumber || message.type !== 'text') {
    res.status(200).end()
    return
  }

  const text = message.text.body

  try {
    const statusCommand = parseStatusCommand(text)
    if (statusCommand) {
      await handleStatusCommand(statusCommand, ownerNumber)
      res.status(200).end()
      return
    }

    const stockCommand = parseStockCommand(text)
    if (stockCommand) {
      await handleStockCommand(stockCommand, ownerNumber)
      res.status(200).end()
      return
    }

    const bareNumberMatch = text.trim().match(BARE_NUMBER_PATTERN)
    if (bareNumberMatch) {
      await handleBareNumber(Number(bareNumberMatch[1]), ownerNumber)
      res.status(200).end()
      return
    }

    // Ningún comando reconocido: se ignora en silencio.
    res.status(200).end()
  } catch (error) {
    console.error('[webhook] Error procesando mensaje:', error)
    res.status(200).end()
  }
}
