// Lleva una base de Notion que YA existe al esquema de esquema.mjs.
//
//   node notion/aplicar-esquema.mjs <URL-o-ID-de-la-base>
//
// Sirve para la base recién creada a mano (que arranca con una sola
// propiedad "Nombre") y también para realinearla si alguien le tocó algo
// después. Sólo agrega y renombra: nunca borra una propiedad, así que no
// se puede llevar puestos datos existentes.
//
// Si la base tiene filas, avisa antes de tocar nada.

import { PROPIEDADES } from './esquema.mjs'

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se espera NOTION_TOKEN en el entorno.
}

const token = process.env.NOTION_TOKEN
const version = process.env.NOTION_VERSION || '2022-06-28'
if (!token) {
  console.error('✗ Falta NOTION_TOKEN en .env.local')
  process.exit(1)
}

function parseId(input) {
  const m = String(input ?? '').match(/[0-9a-f]{32}/i)
  if (m) return m[0]
  const d = String(input ?? '').match(/[0-9a-f-]{36}/i)
  return d ? d[0].replace(/-/g, '') : null
}

const databaseId = parseId(process.argv[2] ?? process.env.NOTION_DATABASE_ID)
if (!databaseId) {
  console.error('✗ Falta la base.\n  Uso: node notion/aplicar-esquema.mjs <URL-o-ID-de-la-base>')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': version,
  'Content-Type': 'application/json',
}

const actualRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, { headers })
const actual = await actualRes.json()
if (!actualRes.ok) {
  console.error(`✗ No pude leer la base (${actualRes.status}): ${actual.code}`)
  if (actual.code === 'object_not_found') {
    console.error('  Agregá la integración a la base: ··· > Connections.')
  }
  process.exit(1)
}

const titulo = actual.title?.map((t) => t.plain_text).join('') || '(sin título)'
console.log(`Base: "${titulo}"`)

const filas = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ page_size: 1 }),
})
const filasData = await filas.json()
const tieneFilas = (filasData.results ?? []).length > 0
console.log(`Filas: ${tieneFilas ? 'tiene datos' : 'vacía'}`)

const existentes = actual.properties
// Notion sólo admite UNA propiedad de tipo title, así que la que ya está
// se renombra en vez de crear otra.
const [nombreTitleActual] = Object.entries(existentes).find(([, d]) => d.type === 'title') ?? []
const nombreTitleDeseado = Object.entries(PROPIEDADES).find(([, d]) => 'title' in d)?.[0]

const patch = {}
const acciones = []

if (nombreTitleActual && nombreTitleActual !== nombreTitleDeseado) {
  patch[nombreTitleActual] = { name: nombreTitleDeseado }
  acciones.push(`renombrar "${nombreTitleActual}" → "${nombreTitleDeseado}" (title)`)
}

for (const [nombre, definicion] of Object.entries(PROPIEDADES)) {
  if ('title' in definicion) continue
  if (existentes[nombre]) {
    const tipoActual = existentes[nombre].type
    const tipoDeseado = Object.keys(definicion)[0]
    if (tipoActual !== tipoDeseado) {
      patch[nombre] = definicion
      acciones.push(`corregir "${nombre}": ${tipoActual} → ${tipoDeseado}`)
    }
    continue
  }
  patch[nombre] = definicion
  acciones.push(`agregar "${nombre}" (${Object.keys(definicion)[0]})`)
}

if (acciones.length === 0) {
  console.log('\n✓ La base ya coincide con el esquema. No hay nada que hacer.')
  process.exit(0)
}

console.log(`\nCambios a aplicar (${acciones.length}):`)
for (const a of acciones) console.log(`  · ${a}`)

if (tieneFilas) {
  console.log('\n⚠ La base tiene filas. Renombrar la propiedad title no pierde datos,')
  console.log('  pero conviene revisar el resultado después.')
}

const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ properties: patch }),
})
const body = await res.json()

if (!res.ok) {
  console.error(`\n✗ Notion respondió ${res.status}: ${body.code}`)
  console.error(`  ${body.message}`)
  process.exit(1)
}

console.log('\n✓ Esquema aplicado. Propiedades finales:')
for (const [n, d] of Object.entries(body.properties)) console.log(`   · ${n} → ${d.type}`)
console.log(`\nNOTION_DATABASE_ID=${databaseId}`)
