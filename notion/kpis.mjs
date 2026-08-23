// Calcula los indicadores del dashboard directamente contra Notion.
//
//   npm run notion:kpis
//
// Sirve para dos cosas: verificar que las vistas compartidas muestren los
// mismos números, y generar la evidencia de la entrega sin tener que leer
// el tablero a mano.

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se esperan las variables en el entorno.
}

const token = process.env.NOTION_TOKEN
if (!token) {
  console.error('✗ Falta NOTION_TOKEN en .env.local')
  process.exit(1)
}

const BASES = {
  reservas: process.env.ARRECIFE_DB_RESERVAS || '3c119da0dec98087b386ed1a5e21a39e',
  errores: process.env.ARRECIFE_DB_ERRORES || '3c119da0dec98097b4d8c21f9f9fc137',
  turnos: process.env.ARRECIFE_DB_TURNOS || '3c119da0dec980748fbad1f52292f811',
  pedidos: process.env.NOTION_DATABASE_ID || '',
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': process.env.NOTION_VERSION || '2022-06-28',
  'Content-Type': 'application/json',
}

// Notion pagina de a 100: sin esto los indicadores mienten en cuanto la
// base pasa esa cantidad.
async function todasLasFilas(databaseId) {
  const filas = []
  let cursor
  do {
    const r = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }),
    })
    const b = await r.json()
    if (!r.ok) throw new Error(`${b.code}: ${b.message}`)
    filas.push(...b.results)
    cursor = b.has_more ? b.next_cursor : null
  } while (cursor)
  return filas
}

const porcentaje = (parte, total) => (total === 0 ? '—' : `${((parte / total) * 100).toFixed(1)} %`)
const linea = (etiqueta, valor, extra = '') =>
  console.log(`  ${etiqueta.padEnd(34)} ${String(valor).padStart(8)}  ${extra}`)

const reservas = await todasLasFilas(BASES.reservas)
const errores = await todasLasFilas(BASES.errores)

const estado = (p) => p.properties.Estado?.select?.name ?? '(sin estado)'
const revisadas = reservas.filter((p) => p.properties.Requiere_Revision?.checkbox === true)
const automaticas = reservas.filter((p) => p.properties.Requiere_Revision?.checkbox !== true)
const confianzas = reservas
  .map((p) => p.properties.Confianza_IA?.number)
  .filter((n) => typeof n === 'number')

const porEstado = {}
for (const p of reservas) porEstado[estado(p)] = (porEstado[estado(p)] ?? 0) + 1

console.log('\n═══ INDICADORES · RESERVAS ═══\n')
linea('Reservas procesadas', reservas.length)
linea('Resueltas automáticamente', automaticas.length, porcentaje(automaticas.length, reservas.length))
linea('Derivadas a revisión humana', revisadas.length, porcentaje(revisadas.length, reservas.length))
console.log('')
for (const [e, n] of Object.entries(porEstado).sort((a, b) => b[1] - a[1])) {
  linea(`  ${e}`, n, porcentaje(n, reservas.length))
}

console.log('\n═══ CALIDAD DEL ANÁLISIS ═══\n')
if (confianzas.length) {
  const media = confianzas.reduce((a, b) => a + b, 0) / confianzas.length
  linea('Confianza media', media.toFixed(2))
  linea('Análisis con confianza < 0,7', confianzas.filter((c) => c < 0.7).length)
  // Una confianza 0 significa que el analisis no se pudo hacer.
  linea('Análisis fallidos (confianza 0)', confianzas.filter((c) => c === 0).length)
} else {
  console.log('  todavía no hay reservas analizadas')
}

console.log('\n═══ ERRORES DEL SISTEMA ═══\n')
const sinResolver = errores.filter((p) => p.properties.Resuelto?.checkbox !== true)
linea('Errores registrados', errores.length)
linea('Sin resolver', sinResolver.length)
linea('Tasa de error', porcentaje(errores.length, reservas.length), 'sobre reservas procesadas')
const porTipo = {}
for (const p of errores) {
  const t = p.properties.Tipo_Error?.select?.name ?? '(sin tipo)'
  porTipo[t] = (porTipo[t] ?? 0) + 1
}
for (const [t, n] of Object.entries(porTipo)) linea(`  ${t}`, n)

console.log('\n═══ OCUPACIÓN POR TURNO ═══\n')
const turnos = await todasLasFilas(BASES.turnos)
if (!turnos.length) {
  console.log('  no hay turnos cargados: el control de capacidad no bloquea nada')
} else {
  for (const t of turnos) {
    const nombre = t.properties.Nombre_Turno?.title?.[0]?.plain_text ?? '(sin nombre)'
    const fecha = t.properties.Fecha?.date?.start ?? '—'
    const cupo = t.properties.Capacidad_Total?.number ?? null
    const vinculadas = t.properties.Reservas_Vinculadas?.relation ?? []
    linea(`${nombre} · ${fecha}`, `${vinculadas.length} res.`, cupo ? `cupo ${cupo}` : '')
  }
}

console.log('')
