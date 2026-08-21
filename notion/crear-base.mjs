// Crea la base de pedidos en Notion, con cada propiedad ya del tipo
// correcto y con las opciones de Estado y Pago cargadas.
// El esquema vive en esquema.mjs.
//
// Se corre una sola vez:
//
//   node notion/crear-base.mjs <URL-o-ID-de-la-página-madre> [nombre]
//
// El nombre es opcional; por defecto "arrecifepedidos".
//
// La página madre es cualquier página de tu workspace donde quieras que
// viva la base. Tiene que estar compartida con la integración (··· >
// Connections), igual que la base después.
//
// El token sale de .env.local o de la variable de entorno NOTION_TOKEN.
// Al terminar imprime el NOTION_DATABASE_ID listo para pegar en Vercel.

import { PROPIEDADES, NOMBRE_POR_DEFECTO } from './esquema.mjs'

const NOTION_VERSION = process.env.NOTION_VERSION || '2022-06-28'

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se espera NOTION_TOKEN en el entorno.
}

const token = process.env.NOTION_TOKEN
if (!token) {
  console.error('✗ Falta NOTION_TOKEN. Cargalo en .env.local o exportalo antes de correr esto.')
  process.exit(1)
}

// Acepta la URL completa de la página o el ID pelado, con o sin guiones.
function parsePageId(input) {
  const match = String(input ?? '').match(/[0-9a-f]{32}/i)
  if (match) return match[0]
  const dashed = String(input ?? '').match(/[0-9a-f-]{36}/i)
  return dashed ? dashed[0].replace(/-/g, '') : null
}

const parentPageId = parsePageId(process.argv[2] ?? process.env.NOTION_PARENT_PAGE_ID)
const nombreBase = process.argv[3] || NOMBRE_POR_DEFECTO
if (!parentPageId) {
  console.error('✗ Falta la página madre.\n')
  console.error('  Uso:  node notion/crear-base.mjs <URL-o-ID-de-la-página>\n')
  console.error('  Abrí en Notion la página donde querés la base, copiá la URL')
  console.error('  del navegador y pegala como argumento.')
  process.exit(1)
}

const response = await fetch('https://api.notion.com/v1/databases', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: nombreBase } }],
    is_inline: false,
    properties: PROPIEDADES,
  }),
})

const body = await response.json()

if (!response.ok) {
  console.error(`✗ Notion respondió ${response.status}: ${body.code ?? ''}`)
  console.error(`  ${body.message ?? JSON.stringify(body)}\n`)
  if (body.code === 'object_not_found') {
    console.error('  Casi siempre es que la página madre no está compartida con la')
    console.error('  integración. Abrila en Notion → ··· → Connections → agregala.')
  }
  if (body.code === 'unauthorized') {
    console.error('  El NOTION_TOKEN no es válido. Copialo de nuevo desde')
    console.error('  https://www.notion.so/my-integrations')
  }
  process.exit(1)
}

console.log('✓ Base creada:', body.url)
console.log('')
console.log('Pegá esto en Vercel (Settings → Environment Variables) y en .env.local:')
console.log('')
console.log(`NOTION_DATABASE_ID=${body.id.replace(/-/g, '')}`)
console.log('')
console.log('Y no te olvides de compartir la base con la integración:')
console.log('··· → Connections → agregar la integración.')
