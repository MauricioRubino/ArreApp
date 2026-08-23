// Genera reservas-arrecife.json a partir de los .js de n8n/reservas/.
//
//   node n8n/generar-workflow-reservas.mjs
//
// Los nodos Code viven como archivos JavaScript de verdad para poder
// ejecutarlos contra un payload real antes de importar nada.
//
// Las operaciones contra Notion van por HTTP Request y no por el nodo
// Notion: asi el cuerpo de cada request es exactamente el que documenta la
// API, sin depender de como el nodo mapea "Propiedad|tipo" a valores. La
// credencial sigue siendo la misma (notionApi).

import fs from 'node:fs'
import path from 'node:path'

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const code = (archivo) => fs.readFileSync(path.join(dir, 'reservas', archivo), 'utf8')

const NOTION_VERSION = '2022-06-28'

// Toda referencia a una base sale del nodo Configuracion: ningun ID queda
// escrito dentro de un nodo de Notion.
const CFG = "$('Configuracion').first().json"
const urlQuery = (base) =>
  `=https://api.notion.com/v1/databases/{{ ${CFG}.bases.${base} }}/query`

let x = 0
const pos = () => [(x += 220) - 220, 0]

function notionHttp(name, url, { method = 'POST', body = null, notes } = {}) {
  return {
    parameters: {
      method,
      url,
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'notionApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Notion-Version', value: NOTION_VERSION }] },
      ...(body ? { sendBody: true, specifyBody: 'json', jsonBody: body } : {}),
      options: {},
    },
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: pos(),
    ...(notes ? { notes } : {}),
  }
}

function codeNode(name, archivo, notes) {
  return {
    parameters: { jsCode: code(archivo) },
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: pos(),
    ...(notes ? { notes } : {}),
  }
}

const cond = (id, left, right, type = 'string', operation = 'equals') => ({
  id,
  leftValue: left,
  rightValue: right,
  operator: { type, operation },
})

const opciones = { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }

function ifNode(name, condiciones, notes) {
  return {
    parameters: {
      conditions: { options: opciones, conditions: condiciones, combinator: 'and' },
      options: {},
    },
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position: pos(),
    ...(notes ? { notes } : {}),
  }
}

// La reserva del webhook, para las consultas que filtran por su fecha.
const FECHA_PEDIDA = "$('Reserva nueva').first().json.body.datos.fecha"

const FILTRO_TURNO =
  '={{ JSON.stringify({ filter: { property: "Fecha", date: { equals: ' +
  FECHA_PEDIDA +
  ' } }, page_size: 1 }) }}'

const FILTRO_CONFIRMADAS =
  '={{ JSON.stringify({ filter: { and: [ { property: "Fecha", date: { equals: ' +
  FECHA_PEDIDA +
  ' } }, { property: "Estado", select: { equals: "Confirmada" } } ] }, page_size: 100 }) }}'

// El cuerpo del POST que crea la pagina. Todos los nombres salen del
// esquema real de la base (ver notion/reservas-esquema.mjs).
const CREAR_RESERVA = `={{ JSON.stringify({
  parent: { database_id: ${CFG}.bases.reservas },
  properties: {
    Nombre_Cliente: { title: [{ text: { content: $json.nombre } }] },
    Numero: { number: $json.numero },
    Estado: { select: { name: $json.estado } },
    Canal_Origen: { select: { name: 'Web' } },
    Telefono: { rich_text: [{ text: { content: $json.telefono } }] },
    Email: { email: $json.email || null },
    Fecha: { date: { start: $json.fechaHora } },
    Hora: { rich_text: [{ text: { content: $json.hora } }] },
    Personas: { number: $json.personas },
    Zona: { select: { name: $json.zonaLabel } },
    Turno: $json.turno_id ? { relation: [{ id: $json.turno_id }] } : { relation: [] },
    Observaciones: { rich_text: [{ text: { content: $json.comentario || '' } }] },
    Confianza_IA: { number: $json.confianza },
    Requiere_Revision: { checkbox: $json.requiere_revision },
    Motivo_Revision: { rich_text: [{ text: { content: $json.motivo_revision || '' } }] },
    Politica_Relacionada: { rich_text: [{ text: { content: $json.politica_relacionada || '' } }] }
  }
}) }}`

const MAIL_CONFIRMA =
  '=Hola {{ $json.nombre }},\n\nTu reserva quedo confirmada:\n\n' +
  '{{ $json.fechaLabel }} a las {{ $json.hora }}\n' +
  '{{ $json.personas }} personas - {{ $json.zonaLabel }}\n\n' +
  'Si necesitas cambiar algo, respondenos este mail o llamanos.\n\nTe esperamos.\nArrecife'

const MAIL_RECHAZO =
  '=Hola {{ $json.nombre }},\n\nNo pudimos confirmar tu reserva para el ' +
  '{{ $json.fechaLabel }} a las {{ $json.hora }} ({{ $json.personas }} personas).\n\n' +
  'Escribinos o llamanos y buscamos otra alternativa.\n\nArrecife'

const TELEGRAM_VENCIDA =
  '=Reserva #{{ $json.numero }} sin respuesta hace mas de 4 horas, quedo marcada como Vencida.\n\n' +
  '{{ $json.nombre }} - {{ $json.telefono }}\n' +
  '{{ $json.fechaLabel }} a las {{ $json.hora }} - {{ $json.personas }} personas\n\n' +
  'Hay que contactar al cliente a mano.\n\n{{ $json.reserva_url }}'

const nodes = [
  {
    parameters: { httpMethod: 'POST', path: 'arrecife-reservas', options: {} },
    name: 'Reserva nueva',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: pos(),
    webhookId: 'b2000000-0000-4000-8000-000000000001',
    notes: 'La URL de produccion es el N8N_RESERVAS_WEBHOOK_URL que va en Vercel.',
  },

  codeNode(
    'Configuracion',
    'configuracion.js',
    'Unico lugar con los IDs de las bases y el secreto. El resto los referencia desde aca.'
  ),

  ifNode(
    'Secreto valido',
    [
      cond(
        'secreto',
        "={{ $('Reserva nueva').first().json.headers['x-arrecife-secret'] }}",
        `={{ ${CFG}.secreto }}`
      ),
    ],
    'El webhook es publico: sin este chequeo cualquiera carga reservas falsas.'
  ),

  notionHttp(
    'Notion - Politicas activas',
    urlQuery('politicas'),
    {
      // Sin filtro a proposito: filtrar por propiedad fallaba desde el nodo
      // HTTP de n8n ("Could not find property with name or id: Activo")
      // aunque el mismo request anda contra la API. Son 23 politicas: se
      // traen todas y se filtra por Activo en el Code.
      body: '={{ JSON.stringify({ page_size: 100 }) }}',
    }
  ),

  codeNode(
    'Preparar analisis',
    'preparar-analisis.js',
    'Arma el contexto RAG y el cuerpo completo de la llamada a Claude.'
  ),

  {
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'anthropic-version', value: '2023-06-01' },
          { name: 'content-type', value: 'application/json' },
        ],
      },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.peticion) }}',
      options: {},
    },
    name: 'Claude - Analizar',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: pos(),
    onError: 'continueRegularOutput',
    notes: 'Credencial Header Auth con x-api-key. Si falla, Decidir manda la reserva a revision humana.',
  },

  notionHttp('Notion - Turno de la fecha', urlQuery('turnos'), {
    body: FILTRO_TURNO,
  }),

  notionHttp(
    'Notion - Reservas confirmadas',
    urlQuery('reservas'),
    {
      body: FILTRO_CONFIRMADAS,
      notes: 'Sirve para dos cosas: calcular la ocupacion del dia y detectar duplicados.',
    }
  ),

  codeNode('Decidir', 'decidir.js', 'Combina reserva + IA + ocupacion y elige la ruta.'),

  ifNode('Es duplicada', [cond('dup', '={{ $json.duplicada }}', true, 'boolean')]),

  {
    parameters: {},
    name: 'Duplicada descartada',
    type: 'n8n-nodes-base.noOp',
    typeVersion: 1,
    position: pos(),
    notes: 'Mismo telefono y misma fecha con reserva ya confirmada.',
  },

  notionHttp('Notion - Crear reserva', 'https://api.notion.com/v1/pages', { body: CREAR_RESERVA }),

  codeNode('Mensaje al dueno', 'mensaje-al-dueno.js'),

  {
    parameters: {
      chatId: 'PEGA-ACA-TU-CHAT-ID',
      text: '={{ $json.mensaje }}',
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' },
    },
    name: 'Telegram - Avisar al dueno',
    type: 'n8n-nodes-base.telegram',
    typeVersion: 1.2,
    position: pos(),
  },

  codeNode(
    'Retomar datos',
    'retomar-datos.js',
    'El nodo de Telegram devuelve su propia respuesta: sin esto, los datos de la reserva no llegan al resto del flujo.'
  ),

  ifNode(
    'Fallo la IA',
    [cond('fallo', '={{ $json.ia_fallo }}', true, 'boolean')],
    'Rama paralela: la reserva sigue su curso igual, esto solo deja constancia.'
  ),

  codeNode('Armar error', 'armar-error.js'),

  notionHttp('Notion - Registrar error', 'https://api.notion.com/v1/pages', {
    body: '={{ JSON.stringify($json.peticion) }}',
    notes: 'Deja el fallo en la base Errores, vinculado a la reserva que lo genero.',
  }),

  ifNode('Requiere aprobacion', [cond('rev', '={{ $json.requiere_revision }}', true, 'boolean')]),

  ifNode(
    'Tiene email',
    [cond('mail', '={{ $json.email }}', '', 'string', 'notEmpty')],
    'Sin email la confirmacion queda por telefono; la reserva no se bloquea.'
  ),

  {
    parameters: {
      sendTo: '={{ $json.email }}',
      subject: '=Tu reserva en Arrecife esta confirmada',
      message: MAIL_CONFIRMA,
      options: {},
    },
    name: 'Gmail - Confirmar al cliente',
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.1,
    position: pos(),
    onError: 'continueRegularOutput',
  },

  {
    parameters: { amount: 5, unit: 'minutes' },
    name: 'Esperar 5 min',
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position: pos(),
    webhookId: 'b2000000-0000-4000-8000-000000000002',
  },

  notionHttp(
    'Notion - Releer reserva',
    "=https://api.notion.com/v1/pages/{{ $('Mensaje al dueno').first().json.reserva_id }}",
    { method: 'GET' }
  ),

  codeNode('Evaluar aprobacion', 'evaluar-aprobacion.js'),

  ifNode('Sigue esperando', [
    cond('esperando', '={{ $json.estado_actual }}', 'Esperando_Aprobacion'),
    cond('novencida', '={{ $json.vencida }}', false, 'boolean'),
  ]),

  {
    parameters: {
      rules: {
        values: [
          {
            conditions: {
              options: opciones,
              conditions: [cond('ok', '={{ $json.estado_actual }}', 'Confirmada')],
              combinator: 'and',
            },
          },
          {
            conditions: {
              options: opciones,
              conditions: [cond('no', '={{ $json.estado_actual }}', 'Rechazada')],
              combinator: 'and',
            },
          },
        ],
      },
      options: { fallbackOutput: 'extra' },
    },
    name: 'Resultado',
    type: 'n8n-nodes-base.switch',
    typeVersion: 3,
    position: pos(),
    notes: 'Salida 0 Confirmada, salida 1 Rechazada, salida 2 (fallback) vencida.',
  },

  {
    parameters: {
      sendTo: '={{ $json.email }}',
      subject: '=Tu reserva en Arrecife no pudo confirmarse',
      message: MAIL_RECHAZO,
      options: {},
    },
    name: 'Gmail - Avisar rechazo',
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.1,
    position: pos(),
    onError: 'continueRegularOutput',
  },

  notionHttp('Notion - Marcar vencida', '=https://api.notion.com/v1/pages/{{ $json.reserva_id }}', {
    method: 'PATCH',
    // Todos los cuerpos van como expresion, no literales: el unico nodo
    // que fallaba era el que tenia el cuerpo literal.
    body: '={{ JSON.stringify({ properties: { Estado: { select: { name: "Vencida" } } } }) }}',
  }),

  {
    parameters: {
      chatId: 'PEGA-ACA-TU-CHAT-ID',
      text: TELEGRAM_VENCIDA,
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' },
    },
    name: 'Telegram - Escalar vencida',
    type: 'n8n-nodes-base.telegram',
    typeVersion: 1.2,
    position: pos(),
  },
]

// null = salida sin cablear a proposito (rama que se descarta).
const salida = (nodo, ...destinos) => ({
  [nodo]: {
    main: destinos.map((d) =>
      d === null ? [] : [].concat(d).map((n) => ({ node: n, type: 'main', index: 0 }))
    ),
  },
})

const connections = {
  ...salida('Reserva nueva', 'Configuracion'),
  ...salida('Configuracion', 'Secreto valido'),
  ...salida('Secreto valido', 'Notion - Politicas activas', null),
  ...salida('Notion - Politicas activas', 'Preparar analisis'),
  ...salida('Preparar analisis', 'Claude - Analizar'),
  ...salida('Claude - Analizar', 'Notion - Turno de la fecha'),
  ...salida('Notion - Turno de la fecha', 'Notion - Reservas confirmadas'),
  ...salida('Notion - Reservas confirmadas', 'Decidir'),
  ...salida('Decidir', 'Es duplicada'),
  ...salida('Es duplicada', 'Duplicada descartada', 'Notion - Crear reserva'),
  ...salida('Notion - Crear reserva', 'Mensaje al dueno'),
  ...salida('Mensaje al dueno', ['Telegram - Avisar al dueno', 'Fallo la IA']),
  ...salida('Fallo la IA', 'Armar error', null),
  ...salida('Armar error', 'Notion - Registrar error'),
  ...salida('Telegram - Avisar al dueno', 'Retomar datos'),
  ...salida('Retomar datos', 'Requiere aprobacion'),
  ...salida('Requiere aprobacion', 'Esperar 5 min', 'Tiene email'),
  ...salida('Tiene email', 'Gmail - Confirmar al cliente', null),
  ...salida('Esperar 5 min', 'Notion - Releer reserva'),
  ...salida('Notion - Releer reserva', 'Evaluar aprobacion'),
  ...salida('Evaluar aprobacion', 'Sigue esperando'),
  ...salida('Sigue esperando', 'Esperar 5 min', 'Resultado'),
  ...salida('Resultado', 'Tiene email', 'Gmail - Avisar rechazo', 'Notion - Marcar vencida'),
  ...salida('Notion - Marcar vencida', 'Telegram - Escalar vencida'),
}

const workflow = {
  name: 'Arrecife - Reserva nueva (webhook + HITL en Notion)',
  nodes: nodes.map((n, i) => ({
    ...n,
    id: `b2000000-0000-4000-8000-${String(i + 100).padStart(12, '0')}`,
  })),
  connections,
  settings: { executionOrder: 'v1' },
  pinData: {},
}

// Chequeo de integridad. El bug mas caro del workflow anterior eran nodos
// que nadie conectaba: la rama HITL entera colgaba de una salida sin
// cablear. Aca eso se detecta al generar, no en produccion.
const nombres = new Set(workflow.nodes.map((n) => n.name))
const alcanzados = new Set(['Reserva nueva'])
for (const conn of Object.values(connections)) {
  for (const rama of conn.main) for (const destino of rama) alcanzados.add(destino.node)
}

const huerfanos = [...nombres].filter((n) => !alcanzados.has(n))
if (huerfanos.length > 0) {
  console.error('✗ Nodos que nadie conecta:', huerfanos.join(', '))
  process.exit(1)
}
for (const origen of Object.keys(connections)) {
  if (!nombres.has(origen)) {
    console.error(`✗ Hay una conexion que sale de "${origen}", que no existe`)
    process.exit(1)
  }
}
for (const conn of Object.values(connections)) {
  for (const rama of conn.main) {
    for (const destino of rama) {
      if (!nombres.has(destino.node)) {
        console.error(`✗ Hay una conexion hacia "${destino.node}", que no existe`)
        process.exit(1)
      }
    }
  }
}

const salidaPath = path.join(dir, 'reservas-arrecife.json')
fs.writeFileSync(salidaPath, JSON.stringify(workflow, null, 2) + '\n')
console.log('✓ generado', path.relative(process.cwd(), salidaPath))
console.log(`  ${workflow.nodes.length} nodos, todos alcanzables desde el webhook`)
