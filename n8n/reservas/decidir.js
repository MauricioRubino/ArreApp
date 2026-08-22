// Nodo Code "Decidir".
//
// Junta las cuatro fuentes y decide la ruta. Cada una se referencia por
// nombre de nodo a proposito: el $json que llega aca es el de Claude, no
// el de la reserva.
//
// La ocupacion NO sale de un campo Ocupacion en Turnos: se calcula
// sumando las personas de las reservas ya confirmadas de esa fecha. Un
// contador guardado se desincroniza en cuanto alguien cancela o carga una
// reserva a mano.

const cuerpo = $('Reserva nueva').first().json.body;
const d = cuerpo.datos;

// El JSON NO esta en content[0]: claude-opus-5 razona por defecto, asi que
// el primer bloque suele ser de tipo "thinking" y el texto viene despues.
// Hay que buscar el bloque de texto, no asumir la posicion.
let ia;
let iaFallo = false;
try {
  const bloques = $('Claude - Analizar').first().json.content || [];
  const texto = bloques.find((b) => b.type === 'text')?.text;
  ia = JSON.parse(texto);
} catch {
  iaFallo = true;
  ia = {
    requiere_revision_humana: true,
    motivo_revision: 'No se pudo analizar la reserva automaticamente',
    confianza: 0,
    viola_politica: false,
    politica_relacionada: null,
  };
}

// Igual que en Preparar analisis: n8n a veces entrega { results: [...] } en
// un item y a veces un item por pagina. Se aceptan las dos formas.
const paginasDe = (nodo) => {
  const items = $(nodo).all();
  if (items.length === 1 && Array.isArray(items[0].json.results)) return items[0].json.results;
  return items.map((i) => i.json).filter((j) => j && j.properties);
};

const turnos = paginasDe('Notion - Turno de la fecha');
const confirmadas = paginasDe('Notion - Reservas confirmadas');

const capacidad = turnos[0]?.properties?.Capacidad_Total?.number ?? null;
const ocupacion = confirmadas.reduce((suma, p) => suma + (p.properties?.Personas?.number || 0), 0);
// Sin turno cargado para esa fecha no se bloquea: se asume que hay lugar y
// que el encargado lo revisara si hace falta.
const hayLugar = capacidad === null ? true : ocupacion + d.personas <= capacidad;

// Mismo telefono, misma fecha y ya confirmada: es la misma reserva mandada
// dos veces, no una nueva.
const telefono = String(d.telefono || '').replace(/\D/g, '');
const duplicada = confirmadas.some((p) => {
  const otro = p.properties?.Telefono?.rich_text?.[0]?.plain_text || '';
  return String(otro).replace(/\D/g, '') === telefono;
});

const motivos = [];
if (ia.requiere_revision_humana) motivos.push(ia.motivo_revision || 'La IA pidio revision');
if (ia.viola_politica) motivos.push(`Politica: ${ia.politica_relacionada || 'sin especificar'}`);
if (d.personas > 10) motivos.push(`Grupo grande (${d.personas} personas)`);
// Si la IA fallo, la confianza es 0 por definicion: agregar "confianza
// baja" al motivo solo confunde a quien lee el aviso.
if (!iaFallo && (ia.confianza ?? 0) < 0.7) motivos.push(`Confianza baja (${ia.confianza})`);
if (!hayLugar) motivos.push(`Sin lugar: ${ocupacion} + ${d.personas} supera ${capacidad}`);

const requiereRevision = motivos.length > 0;

return [
  {
    json: {
      numero: cuerpo.numero,
      recibido: cuerpo.recibido,
      nombre: d.nombre,
      telefono: d.telefono,
      email: d.email,
      fecha: d.fecha,
      fechaLabel: d.fechaLabel,
      hora: d.hora,
      fechaHora: d.fechaHora,
      personas: d.personas,
      zonaLabel: d.zonaLabel,
      comentario: d.comentario,

      duplicada,
      requiere_revision: requiereRevision,
      estado: requiereRevision ? 'Esperando_Aprobacion' : 'Confirmada',
      motivo_revision: motivos.join(' · ') || null,
      confianza: ia.confianza ?? 0,
      politica_relacionada: ia.viola_politica ? ia.politica_relacionada : null,

      capacidad,
      ocupacion,
      hay_lugar: hayLugar,
    },
  },
];
