// Prueba de punta a punta contra la base real de Notion.
//
//   node notion/verificar.mjs            (archiva el pedido de prueba)
//   node notion/verificar.mjs --dejar    (lo deja visible en la base)
//
// Manda un pedido de prueba por el mismo camino que usa la web
// (validación, numeración, escritura en Notion), después lo lee de vuelta
// desde Notion para confirmar que llegó bien, y al final lo archiva para
// no dejarte basura en la base.
//
// El reloj se fija a las 20:00 de Montevideo porque la validación rechaza
// pedidos fuera del horario de atención: si no, esto sólo se podría correr
// a la hora del almuerzo o de la cena.

const FIXED = new Date('2026-08-21T23:00:00Z').getTime()
class FakeDate extends Date {
  constructor(...args) { super(...(args.length ? args : [FIXED])) }
  static now() { return FIXED }
}

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se esperan las variables en el entorno.
}

const { NOTION_TOKEN: token, NOTION_DATABASE_ID: databaseId } = process.env
const version = process.env.NOTION_VERSION || '2022-06-28'

if (!token || !databaseId) {
  console.error('✗ Faltan NOTION_TOKEN y/o NOTION_DATABASE_ID en .env.local')
  process.exit(1)
}

globalThis.Date = FakeDate

const { MENU_ITEMS } = await import('../src/data/menuData.js')
const handler = (await import('../api/orders.js')).default

const plato = MENU_ITEMS[0]
const conGuarnicion = MENU_ITEMS.find((m) => m.requiresGuarnicion)

const req = {
  method: 'POST',
  headers: { 'x-forwarded-for': '127.0.0.1' },
  body: {
    type: 'order',
    payload: {
      nombre: 'PRUEBA — borrar',
      telefono: '+59899123456',
      calle: 'Av. Solari 1234',
      referenciaHogar: 'pedido de prueba',
      metodoPago: 'scotiabank-25',
      location: { lat: -34.6612, lng: -54.1489 },
      items: [
        { menuItemId: plato.id, quantity: 2, guarnicion: null },
        { menuItemId: conGuarnicion.id, quantity: 1, guarnicion: 'Papas fritas' },
      ],
    },
  },
}

const res = {
  statusCode: null,
  payload: null,
  status(code) { this.statusCode = code; return this },
  json(body) { this.payload = body; return this },
}

console.log('→ Mandando un pedido de prueba por el camino real de la web...')
await handler(req, res)

if (res.statusCode !== 200) {
  console.error(`✗ El pedido no se guardó (HTTP ${res.statusCode}):`, JSON.stringify(res.payload))
  console.error('\n  Si dice "no-guardado", el problema está en Notion. Lo más común:')
  console.error('  la integración no fue agregada a la base (··· > Connections).')
  process.exit(1)
}

console.log(`✓ Guardado. Pedido #${res.payload.numero}\n`)

// Se busca la página recién creada para confirmar que Notion la tiene de
// verdad y que cada propiedad quedó con el valor esperado.
const query = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Notion-Version': version,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filter: { property: 'Número', number: { equals: res.payload.numero } },
    page_size: 1,
  }),
})

const data = await query.json()
if (!query.ok) {
  console.error('✗ No se pudo leer de vuelta la base:', JSON.stringify(data))
  process.exit(1)
}

const page = data.results[0]
if (!page) {
  console.error('✗ La escritura dio ok pero la página no aparece en la base.')
  process.exit(1)
}

const p = page.properties
const leer = {
  Pedido: p.Pedido?.title?.[0]?.plain_text,
  'Número': p['Número']?.number,
  Estado: p.Estado?.select?.name,
  Cliente: p.Cliente?.rich_text?.[0]?.plain_text,
  'Teléfono': p['Teléfono']?.phone_number,
  Recibido: p.Recibido?.date?.start,
  Detalle: p.Detalle?.rich_text?.[0]?.plain_text,
  Platos: p.Platos?.number,
  Subtotal: p.Subtotal?.number,
  Descuento: p.Descuento?.number,
  Total: p.Total?.number,
  Pago: p.Pago?.select?.name,
  'Dirección': p['Dirección']?.rich_text?.[0]?.plain_text,
  Referencia: p.Referencia?.rich_text?.[0]?.plain_text,
  'Ubicación': p['Ubicación']?.url,
}

console.log('✓ Leído de vuelta desde Notion:\n')
for (const [k, v] of Object.entries(leer)) {
  const estado = v === undefined || v === null ? '✗ vacía' : '✓'
  console.log(`  ${estado}  ${k}: ${v ?? '—'}`)
}

const vacias = Object.entries(leer).filter(([, v]) => v === undefined || v === null)
console.log('')
if (vacias.length > 0) {
  console.log(`⚠ ${vacias.length} propiedad(es) sin valor: ${vacias.map(([k]) => k).join(', ')}`)
  console.log('  Suele ser que el nombre en Notion no coincide exactamente con el del código.')
} else {
  console.log(`✓ Las ${Object.keys(leer).length} propiedades llegaron completas.`)
}

// Con --dejar el pedido queda en la base, para poder mirarlo en Notion.
if (process.argv.includes('--dejar')) {
  console.log(`
✓ El pedido de prueba queda en la base: ${page.url}`)
  console.log('  Borralo desde Notion cuando termines de mirarlo.')
  process.exit(0)
}

// Limpieza: se archiva sólo la página que creó este script. En Notion
// "archivar" la manda a la papelera, así que se puede restaurar.
const limpiar = await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Notion-Version': version,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ archived: true }),
})

console.log(
  limpiar.ok
    ? '\n✓ Pedido de prueba archivado (queda en la papelera de Notion por si lo querés ver).'
    : `\n⚠ No se pudo archivar el pedido de prueba. Borralo a mano: ${page.url}`
)
