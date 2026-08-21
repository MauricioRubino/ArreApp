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
      parameters: { httpMethod: 'POST', path: 'arrecife-pedidos', options: {} },
      id: 'a1000000-0000-4000-8000-000000000001',
      name: 'Pedido nuevo',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [0, 0],
      webhookId: 'a1000000-0000-4000-8000-000000000001',
      notes: 'La URL de produccion de este nodo es el N8N_WEBHOOK_URL que va en Vercel.',
    },
    {
      parameters: {
        conditions: {
          options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
          conditions: [
            {
              id: 'secreto',
              leftValue: "={{ $json.headers['x-arrecife-secret'] }}",
              rightValue: 'PEGA-ACA-TU-N8N-SECRET',
              operator: { type: 'string', operation: 'equals' },
            },
          ],
          combinator: 'and',
        },
        options: {},
      },
      id: 'a1000000-0000-4000-8000-000000000002',
      name: 'Secreto valido',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [220, 0],
      notes: 'El webhook es una URL publica: sin este chequeo cualquiera le manda pedidos falsos al dueno.',
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
        additionalFields: { appendAttribution: false },
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
    'Pedido nuevo': { main: [[{ node: 'Secreto valido', type: 'main', index: 0 }]] },
    // La rama falsa del IF queda vacía a propósito: un pedido sin el
    // secreto correcto se descarta en silencio.
    'Secreto valido': { main: [[{ node: 'Armar mensaje', type: 'main', index: 0 }], []] },
    'Armar mensaje': { main: [[{ node: 'Avisar al dueno', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  pinData: {},
}

const salida = path.join(dir, 'pedido-a-telegram.json')
fs.writeFileSync(salida, JSON.stringify(workflow, null, 2) + '\n')
console.log('✓ generado', path.relative(process.cwd(), salida))
