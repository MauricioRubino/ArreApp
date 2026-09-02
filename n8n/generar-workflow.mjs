// Genera pedido-a-telegram.json a partir de armar-mensaje.js.
//
//   node n8n/generar-workflow.mjs
//
// El código del nodo Code vive en un archivo aparte para poder probarlo
// como JavaScript de verdad; esto sólo lo mete adentro del JSON que n8n
// sabe importar.

import fs from 'node:fs'
import path from 'node:path'

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const jsCode = fs.readFileSync(path.join(dir, 'armar-mensaje.js'), 'utf8')

const workflow = {
  name: 'Arrecife — Pedido nuevo a Telegram',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'arrecife-pedidos',
        // El secreto va en una credencial Header Auth, no adentro del
        // workflow: no se pierde al reimportar ni viaja en el JSON del
        // repositorio, y n8n rechaza el pedido antes de ejecutar nada.
        authentication: 'headerAuth',
        options: {},
      },
      id: 'a1000000-0000-4000-8000-000000000001',
      name: 'Pedido nuevo',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 0],
      webhookId: 'a1000000-0000-4000-8000-000000000001',
      notes: 'La URL de produccion de este nodo es el N8N_WEBHOOK_URL que va en Vercel.',
    },
    {
      parameters: { jsCode },
      id: 'a1000000-0000-4000-8000-000000000003',
      name: 'Armar mensaje',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [460, -100],
    },
    {
      parameters: {
        chatId: 'PEGA-ACA-TU-CHAT-ID',
        text: '={{ $json.mensaje }}',
        additionalFields: { appendAttribution: false, parse_mode: 'HTML' },
      },
      id: 'a1000000-0000-4000-8000-000000000004',
      name: 'Avisar al dueno',
      type: 'n8n-nodes-base.telegram',
      typeVersion: 1.2,
      position: [680, -100],
      notes: 'Elegi la credencial de Telegram al importar. El chatId es el del dueno.',
    },
  ],
  connections: {
    // No hay nodo intermedio que valide el secreto: eso lo hace la
    // credencial Header Auth del webhook, que rechaza el pedido antes de
    // que el workflow empiece a ejecutarse.
    'Pedido nuevo': { main: [[{ node: 'Armar mensaje', type: 'main', index: 0 }]] },
    'Armar mensaje': { main: [[{ node: 'Avisar al dueno', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
}

// Un nodo puede quedar sin cablear, o una conexión puede apuntar a un nodo
// que ya no existe, y el JSON sigue siendo válido: n8n lo importa igual y
// el workflow se rompe recién en producción. Fue exactamente lo que pasó al
// reemplazar el IF del secreto por la credencial Header Auth — el nodo se
// sacó de la lista pero quedó en las conexiones. Acá eso se detecta al
// generar. Es la misma verificación que hace generar-workflow-reservas.mjs.
const nombres = new Set(workflow.nodes.map((n) => n.name))
const alcanzados = new Set(['Pedido nuevo'])
for (const conn of Object.values(workflow.connections)) {
  for (const rama of conn.main) for (const destino of rama) alcanzados.add(destino.node)
}

const huerfanos = [...nombres].filter((n) => !alcanzados.has(n))
if (huerfanos.length > 0) {
  console.error('✗ Nodos que nadie conecta:', huerfanos.join(', '))
  process.exit(1)
}
for (const origen of Object.keys(workflow.connections)) {
  if (!nombres.has(origen)) {
    console.error(`✗ Hay una conexion que sale de "${origen}", que no existe`)
    process.exit(1)
  }
}
for (const conn of Object.values(workflow.connections)) {
  for (const rama of conn.main) {
    for (const destino of rama) {
      if (!nombres.has(destino.node)) {
        console.error(`✗ Hay una conexion hacia "${destino.node}", que no existe`)
        process.exit(1)
      }
    }
  }
}

const salida = path.join(dir, 'pedido-a-telegram.json')
fs.writeFileSync(salida, JSON.stringify(workflow, null, 2) + '\n')
console.log('✓ generado', path.relative(process.cwd(), salida))
console.log(`  ${workflow.nodes.length} nodos, todos alcanzables desde el webhook`)
