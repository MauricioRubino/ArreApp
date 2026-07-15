// Webhook de WhatsApp Business Platform (Meta Cloud API).
//
// GET: handshake de verificación que Meta hace una sola vez al configurar
// el webhook en su panel (compara WHATSAPP_WEBHOOK_VERIFY_TOKEN).
//
// POST: mensajes entrantes. Seguridad en capas:
//   1. La Callback URL se configura en Meta con el token en la query
//      (https://.../api/webhook?token=EL_TOKEN) y acá se exige que
//      coincida — nadie sin el token puede llegar al parseo.
//   2. Si META_APP_SECRET está configurado y el runtime expone el body
//      crudo, se valida además la firma X-Hub-Signature-256 de Meta.
//   3. Sólo se procesan mensajes cuyo remitente es OWNER_WHATSAPP_NUMBER.
//
// Comandos del dueño:
//   - Estado: "ok #3", "listo #3", "en camino #3", "confirmada #5",
//     "cancelada #5" → avisa al cliente (por plantilla, es un mensaje
//     iniciado por el negocio) y le confirma al dueño (texto libre,
//     gratis: él acaba de escribir, la ventana de 24hs está abierta).
//   - Stock: "no hay rabas" / "sí hay rabas" (con desambiguación numerada
//     si el nombre matchea varios platos).
//
// Además, si había detalles de pedidos en cola (avisos que no se pudieron
// entregar como texto), se le mandan apenas escribe cualquier cosa.

import crypto from 'node:crypto'
import { sendWhatsAppText, sendWhatsAppTemplate } from './_lib/whatsapp.js'
import { getRecord, updateRecordEstado, flushPendingDetails } from './_lib/store.js'
import {
  markOutOfStock,
  markInStock,
  savePendingDisambiguation,
  getPendingDisambiguation,
  clearPendingDisambiguation,
} from './_lib/stockStore.js'
import { findMenuItemsByName, getMenuItemById } from './_lib/matchMenuItem.js'
import { normalizePhone } from './_lib/phone.js'

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
    await sendWhatsAppText(ownerNumber, `No encontré el #${command.numero}.`)
    return
  }

  if (record.tipo !== definition.tipo) {
    const esperado = record.tipo === 'order' ? 'ok, listo o en camino' : 'confirmada o cancelada'
    await sendWhatsAppText(
      ownerNumber,
      `El #${command.numero} es ${record.tipo === 'order' ? 'un pedido' : 'una reserva'}, usá: ${esperado}.`
    )
    return
  }

  await updateRecordEstado(command.numero, definition.estado)
  // Al cliente se le inicia conversación: va por plantilla (una línea).
  await sendWhatsAppTemplate(record.telefono, definition.mensajeCliente(command.numero))
  await sendWhatsAppText(
    ownerNumber,
    `✅ Le avisé a ${record.nombre} sobre el #${command.numero} (${definition.estado}).`
  )
}

async function handleStockCommand(command, ownerNumber) {
  const matches = findMenuItemsByName(command.query)

  if (matches.length === 0) {
    await sendWhatsAppText(ownerNumber, `No encontré ningún plato con "${command.query}" en el nombre.`)
    return
  }

  if (matches.length > 1) {
    const listado = matches.map((item, i) => `${i + 1}. ${item.name}`).join('\n')
    await savePendingDisambiguation(
      matches.map((item) => item.id),
      command.action
    )
    await sendWhatsAppText(
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
    await sendWhatsAppText(ownerNumber, `🚫 Marqué "${item.name}" sin stock.`)
  } else {
    await markInStock(itemId)
    await sendWhatsAppText(ownerNumber, `✅ Repuse el stock de "${item.name}".`)
  }
}

async function handleBareNumber(numero, ownerNumber) {
  const pending = await getPendingDisambiguation()
  if (!pending) return

  const itemId = pending.candidates[numero - 1]
  if (!itemId) {
    await sendWhatsAppText(ownerNumber, `Ese número no está en la lista. Probá de nuevo.`)
    return
  }

  await clearPendingDisambiguation()
  await applyStockAction(itemId, pending.action, ownerNumber)
}

function verifyGetHandshake(req) {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  return mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
}

function verifyPostToken(req) {
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  // Sin token configurado (etapa de desarrollo) no se exige.
  if (!expected) return true
  return req.query?.token === expected
}

function verifySignature(req) {
  const secret = process.env.META_APP_SECRET
  if (!secret) return true

  const signature = req.headers['x-hub-signature-256']
  if (!signature) return false

  // La firma se calcula sobre el body crudo. Si el runtime no lo expone
  // (Vercel lo parsea antes), no se puede verificar de forma confiable:
  // queda la protección del token en la query + el filtro por remitente.
  const rawBody = req.rawBody
    ? Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : Buffer.from(req.rawBody)
    : null
  if (!rawBody) {
    console.warn('[webhook] Body crudo no disponible; no se pudo verificar la firma de Meta.')
    return true
  }

  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (verifyGetHandshake(req)) {
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

  if (!verifyPostToken(req) || !verifySignature(req)) {
    res.status(403).end()
    return
  }

  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  const ownerNumber = normalizePhone(process.env.OWNER_WHATSAPP_NUMBER)

  // Sin owner configurado no hay a quién contestar; y sólo procesamos
  // mensajes que vengan de ese número.
  if (
    !message ||
    !ownerNumber ||
    normalizePhone(message.from) !== ownerNumber ||
    message.type !== 'text'
  ) {
    res.status(200).end()
    return
  }

  const text = message.text.body

  try {
    // El dueño escribió: la ventana de 24hs está abierta. Si quedaron
    // detalles de pedidos sin entregar, van primero.
    const pendingDetails = await flushPendingDetails()
    for (const detail of pendingDetails) {
      await sendWhatsAppText(ownerNumber, detail)
    }

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
