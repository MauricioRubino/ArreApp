// Averigua el chatId del dueño y diagnostica por qué getUpdates viene vacío.
//
//   node n8n/telegram-chat-id.mjs
//
// Necesita TELEGRAM_BOT_TOKEN en .env.local. Ese token es sólo para este
// helper: la app no manda mensajes, el que habla con Telegram es n8n. NO
// hace falta cargarlo en Vercel.

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se espera la variable en el entorno.
}

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('✗ Falta TELEGRAM_BOT_TOKEN en .env.local')
  console.error('  Es el que te dio @BotFather, tipo 8123456789:AAF...')
  process.exit(1)
}

const api = (metodo) => fetch(`https://api.telegram.org/bot${token}/${metodo}`).then((r) => r.json())

const me = await api('getMe')
if (!me.ok) {
  console.error('✗ El token no es válido:', me.description)
  console.error('  Copialo de nuevo desde @BotFather con /mybots → API Token.')
  process.exit(1)
}
console.log(`✓ Bot: @${me.result.username} (${me.result.first_name})`)

// Si el bot tiene un webhook configurado, Telegram le entrega los mensajes
// ahí y getUpdates queda vacío para siempre. Es la causa más confusa.
const hook = await api('getWebhookInfo')
if (hook.ok && hook.result.url) {
  console.log(`\n⚠ El bot tiene un webhook configurado: ${hook.result.url}`)
  console.log('  Telegram le manda los mensajes ahí, así que getUpdates siempre')
  console.log('  va a venir vacío. Si ese webhook es de n8n, está todo bien:')
  console.log('  sacá el chatId desde la ejecución del workflow en n8n.')
}

const updates = await api('getUpdates')
if (!updates.ok) {
  console.error('\n✗ getUpdates falló:', updates.description)
  process.exit(1)
}

const chats = new Map()
for (const u of updates.result) {
  const msg = u.message ?? u.edited_message ?? u.channel_post
  if (msg?.chat) chats.set(msg.chat.id, msg.chat)
}

if (chats.size === 0) {
  console.log('\n✗ No hay mensajes pendientes, por eso no ves el chatId.\n')
  console.log('  Las tres causas posibles:')
  console.log(`  1. Nadie le escribió todavía. Abrí Telegram, buscá @${me.result.username}`)
  console.log('     y mandale /start desde la cuenta del dueño. Después corré esto de nuevo.')
  console.log('  2. Ya consumiste los updates (abrir getUpdates varias veces los va')
  console.log('     descartando). Mandá otro mensaje al bot y volvé a probar.')
  console.log('  3. Hay un webhook configurado (te lo habría avisado arriba).')
  console.log('\n  Atajo: en Telegram escribile a @userinfobot desde la cuenta del dueño.')
  console.log('  Te responde con el id de esa cuenta, que en un chat privado ES el chatId.')
  process.exit(0)
}

console.log(`\n✓ Encontré ${chats.size} chat(s):\n`)
for (const chat of chats.values()) {
  const quien = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.title || '—'
  console.log(`  chatId: ${chat.id}`)
  console.log(`    tipo: ${chat.type}  ·  ${quien}${chat.username ? ` (@${chat.username})` : ''}`)
}
console.log('\nEse número va en el nodo "Avisar al dueño" del workflow, en chatId.')
