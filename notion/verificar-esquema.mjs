// Chequea, sin tocar Notion, que lo que manda la app encaje exactamente
// con la base que crea crear-base.mjs.
//
//   node notion/verificar-esquema.mjs
//
// Compara tres cosas por cada propiedad:
//   1. que el nombre que manda la app exista en el esquema (tildes incluidas)
//   2. que el tipo del valor coincida con el tipo declarado
//   3. que los valores de los Select estén entre las opciones creadas
//
// Es el chequeo que evita el 400 de Notion antes de que pase en producción.

import { PROPIEDADES, SOLO_MANUALES } from './esquema.mjs'

process.env.NOTION_TOKEN = 'token-de-prueba'
process.env.NOTION_DATABASE_ID = 'base-de-prueba'

// Se fija el reloj a las 20:00 de Montevideo: la validación rechaza
// pedidos fuera del horario de atención.
const FIXED = new Date('2026-08-21T23:00:00Z').getTime()
class FakeDate extends Date {
  constructor(...args) { super(...(args.length ? args : [FIXED])) }
  static now() { return FIXED }
}
globalThis.Date = FakeDate

const { MENU_ITEMS } = await import('../src/data/menuData.js')
const { validateOrder } = await import('../api/_lib/validation.js')
const { createNotionPage } = await import('../api/_lib/notion.js')

let enviado = null
globalThis.fetch = async (_url, init) => {
  enviado = JSON.parse(init.body).properties
  return { ok: true, json: async () => ({ id: 'page-test', url: 'https://notion.so/test' }) }
}

// Un pedido que ejercita todos los campos: varias líneas, guarnición,
// referencia del hogar y ubicación en el mapa.
const plato = MENU_ITEMS[0]
const conGuarnicion = MENU_ITEMS.find((m) => m.requiresGuarnicion)
const { ok, order } = validateOrder({
  nombre: 'Juan Pérez',
  telefono: '+59899123456',
  calle: 'Av. Solari 1234',
  referenciaHogar: 'portón verde',
  metodoPago: 'scotiabank-25',
  location: { lat: -34.6612, lng: -54.1489 },
  items: [
    { menuItemId: plato.id, quantity: 2, guarnicion: null },
    { menuItemId: conGuarnicion.id, quantity: 3, guarnicion: 'Papas fritas' },
  ],
})

if (!ok) {
  console.error('✗ El pedido de prueba no pasó la validación.')
  process.exit(1)
}

await createNotionPage('order', 12, order)

// El tipo de una propiedad es la única clave del objeto que la describe.
const tipoDeclarado = (def) => Object.keys(def)[0]
const tipoEnviado = (val) => Object.keys(val)[0]

const problemas = []
console.log('Propiedad              tipo esperado   tipo enviado    valor')
console.log('─'.repeat(78))

for (const [nombre, valor] of Object.entries(enviado)) {
  const def = PROPIEDADES[nombre]
  if (!def) {
    problemas.push(`La app manda "${nombre}", que no existe en la base.`)
    console.log(`✗ ${nombre.padEnd(20)} —               ${tipoEnviado(valor).padEnd(15)} NO EXISTE`)
    continue
  }

  const esperado = tipoDeclarado(def)
  const recibido = tipoEnviado(valor)
  const coincide = esperado === recibido
  if (!coincide) problemas.push(`"${nombre}": la base espera ${esperado} y la app manda ${recibido}.`)

  // Los Select sólo aceptan opciones que existan en la base.
  let nota = ''
  if (coincide && esperado === 'select') {
    const elegida = valor.select.name
    const opciones = def.select.options.map((o) => o.name)
    if (!opciones.includes(elegida)) {
      problemas.push(`"${nombre}": la opción "${elegida}" no está entre las de la base.`)
      nota = ' ← OPCIÓN INVÁLIDA'
    }
  }

  const muestra = JSON.stringify(valor).slice(0, 34)
  console.log(`${coincide ? '✓' : '✗'} ${nombre.padEnd(20)} ${esperado.padEnd(15)} ${recibido.padEnd(15)} ${muestra}${nota}`)
}

const enviadas = Object.keys(enviado)
const sinUsar = Object.keys(PROPIEDADES).filter(
  (n) => !enviadas.includes(n) && !SOLO_MANUALES.includes(n)
)

console.log('')
console.log(`Propiedades en la base:      ${Object.keys(PROPIEDADES).length}`)
console.log(`Escritas por la app:         ${enviadas.length}`)
console.log(`Sólo manuales (esperado):    ${SOLO_MANUALES.join(', ')}`)
if (sinUsar.length > 0) {
  console.log(`⚠ En la base pero nunca escritas: ${sinUsar.join(', ')}`)
}

// Sólo se ejercitó un método de pago arriba; los cuatro tienen que caer
// en una opción existente o el pedido se pierde justo al confirmarlo.
const { METODOS_PAGO } = await import('../src/data/paymentData.js')
const opcionesPago = PROPIEDADES.Pago.select.options.map((o) => o.name)
console.log('Métodos de pago:')
for (const metodo of METODOS_PAGO) {
  await createNotionPage('order', 99, { ...order, metodoPago: metodo.id })
  const enviada = enviado.Pago.select.name
  const vale = opcionesPago.includes(enviada)
  if (!vale) problemas.push(`El método "${metodo.id}" manda "${enviada}", que no es una opción de la base.`)
  console.log(`  ${vale ? '✓' : '✗'} ${metodo.id.padEnd(18)} → ${enviada}`)
}

console.log('')
if (problemas.length === 0) {
  console.log('✓ El esquema y lo que manda la app coinciden en todo.')
} else {
  console.log('✗ Problemas encontrados:')
  for (const p of problemas) console.log(`  · ${p}`)
  process.exit(1)
}
