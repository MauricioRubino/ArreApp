// Lleva las bases de reservas al esquema que necesita el workflow de n8n.
//
//   node notion/reservas-esquema.mjs           (muestra qué haría)
//   node notion/reservas-esquema.mjs --aplicar (lo aplica)
//
// Cambios de tipo y renombres: sólo se aplican si la base está vacía.
// Cambiarle el tipo a una propiedad con datos los descarta, así que el
// script se planta antes de hacerlo.
//
// Nota sobre Reservas: la propiedad "Observaciones" venía como multi_select
// con opciones Confirmado/Rechazado/Aprobado/... — o sea, era el Estado con
// el nombre cambiado. Se la renombra a Estado y se crea una Observaciones
// nueva de texto para el comentario libre del cliente.

try {
  process.loadEnvFile('.env.local')
} catch {
  // Sin .env.local se espera NOTION_TOKEN en el entorno.
}

const token = process.env.NOTION_TOKEN
const version = process.env.NOTION_VERSION || '2022-06-28'
const aplicar = process.argv.includes('--aplicar')

if (!token) {
  console.error('✗ Falta NOTION_TOKEN en .env.local')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': version,
  'Content-Type': 'application/json',
}

export const BASES = {
  Reservas: '3c119da0dec98087b386ed1a5e21a39e',
  Turnos: '3c119da0dec980748fbad1f52292f811',
  Errores: '3c119da0dec98097b4d8c21f9f9fc137',
  Politicas: '3c119da0dec980be8594c3080b55c1d6',
}

// Los estados quedan deduplicados: Confirmado/Aprobado/Procesado_IA
// significaban lo mismo. Con estos cuatro, "¿ya tiene mesa?" es una sola
// comparación, y el chequeo de duplicados deja de ser ambiguo.
const ESTADOS = [
  { name: 'Esperando_Aprobacion', color: 'yellow' },
  { name: 'Confirmada', color: 'green' },
  { name: 'Rechazada', color: 'red' },
  { name: 'Vencida', color: 'gray' },
]

const CANALES = [
  { name: 'Web', color: 'blue' },
  { name: 'Telefono', color: 'orange' },
  { name: 'Presencial', color: 'brown' },
  { name: 'WhatsApp', color: 'green' },
  { name: 'Telegram', color: 'purple' },
]

// Las mismas zonas que ofrece el formulario de la app (reservasData.js).
const ZONAS = [
  { name: 'Sin preferencia', color: 'default' },
  { name: 'Interior', color: 'brown' },
  { name: 'Terraza frente al puerto', color: 'blue' },
]

const TIPOS_ERROR = [
  { name: 'Dato_Faltante', color: 'yellow' },
  { name: 'Formato_Invalido', color: 'orange' },
  { name: 'API_IA_Fallo', color: 'red' },
  { name: 'Notion_Fallo', color: 'brown' },
]

const PLAN = {
  Reservas: {
    // renombres + cambios de tipo (exigen base vacía)
    convertir: {
      Observaciones: { name: 'Estado', select: { options: ESTADOS } },
      Canal_Origen: { select: { options: CANALES } },
    },
    // altas (seguras siempre)
    agregar: {
      Observaciones: { rich_text: {} },
      Email: { email: {} },
      Numero: { number: { format: 'number' } },
      Motivo_Revision: { rich_text: {} },
      Politica_Relacionada: { rich_text: {} },
      Zona: { select: { options: ZONAS } },
    },
  },
  Errores: {
    convertir: {
      Tipo_Error: { select: { options: TIPOS_ERROR } },
    },
    agregar: {},
  },
}

async function leerBase(id) {
  const r = await fetch(`https://api.notion.com/v1/databases/${id}`, { headers })
  const b = await r.json()
  if (!r.ok) throw new Error(`${r.status} ${b.code}: ${b.message}`)
  return b
}

async function contarFilas(id) {
  const r = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ page_size: 1 }),
  })
  const b = await r.json()
  return (b.results ?? []).length
}

let huboBloqueo = false

for (const [nombre, plan] of Object.entries(PLAN)) {
  const id = BASES[nombre]
  const base = await leerBase(id)
  const filas = await contarFilas(id)
  const existentes = base.properties

  console.log(`\n■ ${nombre}  (${filas > 0 ? 'CON DATOS' : 'vacía'})`)

  const patch = {}

  for (const [prop, definicion] of Object.entries(plan.convertir)) {
    if (!existentes[prop]) {
      console.log(`   ⚠ "${prop}" no existe, no hay nada que convertir`)
      continue
    }
    const tipoActual = existentes[prop].type
    const tipoNuevo = Object.keys(definicion).find((k) => k !== 'name')
    const destino = definicion.name ?? prop

    // Idempotencia: si el destino ya existe con el tipo correcto, la
    // conversión ya se hizo. Sin este guard, una segunda corrida renombra
    // la propiedad equivocada — la que se creó como reemplazo — y Notion
    // le pone "Estado 1" al duplicado.
    if (destino !== prop && existentes[destino]?.type === tipoNuevo) {
      console.log(`   = "${destino}" ya existe (${tipoNuevo}), conversión ya hecha`)
      continue
    }
    if (destino === prop && tipoActual === tipoNuevo) {
      console.log(`   = "${prop}" ya es ${tipoNuevo}, no se toca`)
      continue
    }
    if (filas > 0) {
      console.log(`   ✗ BLOQUEADO: "${prop}" (${tipoActual}) → "${destino}" (${tipoNuevo})`)
      console.log(`      la base tiene datos; el cambio de tipo los descartaría`)
      huboBloqueo = true
      continue
    }
    console.log(`   · convertir "${prop}" (${tipoActual}) → "${destino}" (${tipoNuevo})`)
    patch[prop] = definicion
  }

  for (const [prop, definicion] of Object.entries(plan.agregar)) {
    // El nombre queda libre sólo si esta misma corrida va a renombrar esa
    // propiedad (está en el patch). Si la conversión ya se hizo antes, el
    // nombre está ocupado por la propiedad nueva y no hay nada que agregar.
    const seLiberaAhora = patch[prop] !== undefined
    if (existentes[prop] && !seLiberaAhora) {
      console.log(`   = "${prop}" ya existe (${existentes[prop].type}), no se toca`)
      continue
    }
    console.log(`   + agregar "${prop}" (${Object.keys(definicion)[0]})`)
  }

  if (!aplicar) continue

  // Paso 1: renombres y cambios de tipo.
  if (Object.keys(patch).length > 0) {
    const r = await fetch(`https://api.notion.com/v1/databases/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties: patch }),
    })
    const b = await r.json()
    if (!r.ok) {
      console.error(`   ✗ falló la conversión: ${b.code} — ${b.message}`)
      continue
    }
    console.log('   ✓ conversiones aplicadas')
  }

  // Paso 2: altas, ya con los nombres viejos liberados.
  const base2 = await leerBase(id)
  const altas = {}
  for (const [prop, definicion] of Object.entries(plan.agregar)) {
    if (!base2.properties[prop]) altas[prop] = definicion
  }
  if (Object.keys(altas).length > 0) {
    const r = await fetch(`https://api.notion.com/v1/databases/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties: altas }),
    })
    const b = await r.json()
    if (!r.ok) {
      console.error(`   ✗ fallaron las altas: ${b.code} — ${b.message}`)
      continue
    }
    console.log('   ✓ altas aplicadas')
  }

  const final = await leerBase(id)
  console.log('   propiedades finales:')
  for (const [p, d] of Object.entries(final.properties)) {
    const ops = d.type === 'select' ? ` → ${d.select.options.map((o) => o.name).join(', ')}` : ''
    console.log(`      ${p} (${d.type})${ops}`)
  }
}

console.log('')
if (!aplicar) {
  console.log('Simulación. Volvé a correrlo con --aplicar para hacer los cambios.')
} else if (huboBloqueo) {
  console.log('⚠ Quedaron cambios bloqueados por bases con datos (ver arriba).')
} else {
  console.log('✓ Listo.')
}
