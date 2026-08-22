// Nodo Code "Preparar analisis" (este archivo se llama igual que el nodo).
//
// Entrada: la respuesta cruda de Notion al consultar Politicas_Arrecife.
//
// El filtro Activo se aplica aca y no en la consulta: el filtro por
// propiedad venia fallando desde el nodo HTTP de n8n con "Could not find
// property with name or id: Activo", aunque el mismo request funciona
// contra la API. Con 23 politicas traerlas todas y filtrar en JS no cuesta
// nada y saca una pieza fragil del medio.
//
// Arma el contexto RAG y ademas el cuerpo COMPLETO de la llamada a la API
// de Anthropic. El nodo HTTP despues solo lo serializa: armar ese JSON a
// mano dentro de una expresion de n8n es fragil y no se puede probar.
//
// Ojo: la title de Politicas_Arrecife se llama "Nombre", no "Tema". Leer
// "Tema" devuelve undefined y las politicas llegan como "(sin tema)".

// n8n entrega la respuesta HTTP de Notion en formas distintas segun la
// configuracion del nodo: un item con { results: [...] }, un item por
// pagina ya desarmada, o —si esta activo "Include Response Headers and
// Status"— envuelta en { body: { results: [...] } }. Se aceptan las tres.
//
// Cuando esto fallaba, el array quedaba vacio y Claude analizaba la
// reserva sin ninguna politica: escribia "no hay politicas cargadas" y
// bajaba la confianza por no poder contrastar nada. El workflow no daba
// error, solo decidia peor.
const items = $input.all();
const todas = [];
for (const item of items) {
  const j = item.json || {};
  if (Array.isArray(j.results)) todas.push(...j.results);
  else if (Array.isArray(j.body?.results)) todas.push(...j.body.results);
  else if (j.properties) todas.push(j);
}

const paginas = todas.filter((p) => p.properties?.Activo?.checkbox === true);
const d = $('Reserva nueva').first().json.body.datos;

const texto = (prop) => prop?.rich_text?.[0]?.plain_text || '';
const titulo = (prop) => prop?.title?.[0]?.plain_text || '';

const lineas = paginas.map((p) => {
  const nombre = titulo(p.properties.Nombre) || '(sin nombre)';
  const contenido = texto(p.properties.Contenido);
  const categoria = p.properties.Categoria?.select?.name || 'General';
  const prioridad = p.properties.Prioridad?.select?.name || '';
  const aviso = p.properties.Requiere_Aviso_Previo?.checkbox ? ' (requiere aviso previo)' : '';
  return `- [${categoria}${prioridad ? '/' + prioridad : ''}] ${nombre}${aviso}: ${contenido}`;
});

const contexto = lineas.length > 0 ? lineas.join('\n') : 'No hay politicas cargadas.';

const system = [
  'Sos un asistente que evalua solicitudes de reserva del restaurante Arrecife (La Paloma, Rocha).',
  '',
  'Los datos de fecha, hora, personas y contacto ya vienen validados desde el formulario: no los reinterpretes ni los corrijas.',
  'Tu unico trabajo es leer el comentario del cliente y contrastarlo con las politicas vigentes.',
  '',
  'Marca requiere_revision_humana = true si el comentario menciona: eventos privados o cumpleanos grandes,',
  'alergias o restricciones alimentarias serias, mascotas, accesibilidad, pedidos que exceden la operativa normal,',
  'o cualquier cosa que contradiga una politica.',
  '',
  'Si no hay nada de eso, confianza = 1 y requiere_revision_humana = false.',
  'La capacidad del salon y el tamano del grupo los chequea el sistema aparte: no los evalues vos.',
  '',
  'POLITICAS VIGENTES DE ARRECIFE:',
  contexto,
].join('\n');

const usuario = [
  `Nombre: ${d.nombre}`,
  `Personas: ${d.personas}`,
  `Fecha: ${d.fechaLabel} (${d.fecha})`,
  `Hora: ${d.hora}`,
  `Zona pedida: ${d.zonaLabel}`,
  `Comentario del cliente: ${d.comentario || 'Ninguno'}`,
].join('\n');

const peticion = {
  model: 'claude-opus-5',
  // Con el razonamiento activado (que en opus-5 viene por defecto), los
  // tokens de pensamiento salen de este presupuesto: 1000 se queda corto y
  // la respuesta se corta a la mitad.
  max_tokens: 4000,
  system,
  // Structured outputs: la respuesta viene validada contra el esquema, asi
  // que no hace falta pedir "devolve solo JSON" ni manejar el caso de que
  // conteste con texto alrededor.
  output_config: {
    // Clasificar una reserva contra 23 politicas no necesita razonar hondo;
    // bajar el esfuerzo recorta latencia y costo.
    effort: 'low',
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          requiere_revision_humana: { type: 'boolean' },
          motivo_revision: { type: ['string', 'null'] },
          confianza: { type: 'number' },
          viola_politica: { type: 'boolean' },
          politica_relacionada: { type: ['string', 'null'] },
        },
        required: [
          'requiere_revision_humana',
          'motivo_revision',
          'confianza',
          'viola_politica',
          'politica_relacionada',
        ],
        additionalProperties: false,
      },
    },
  },
  messages: [{ role: 'user', content: usuario }],
};

return [
  {
    json: {
      contexto,
      politicas: lineas.length,
      politicas_totales: todas.length,
      // Diagnostico: si politicas_totales es 0, esto dice que forma tenia
      // la respuesta para poder arreglarla sin adivinar.
      forma_entrada: items.length === 0 ? 'sin items' : Object.keys(items[0].json || {}).join(','),
      peticion,
    },
  },
];
