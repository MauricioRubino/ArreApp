// Nodo Code "Evaluar aprobacion".
//
// Entrada: la pagina releida desde Notion. Decide si el encargado ya
// respondio o si hay que seguir esperando.
//
// El estado se lee de properties.Estado.select.name, que es la forma que
// devuelve la API de Notion. Leerlo de page['Estado'] devuelve undefined
// y el loop no sale nunca hasta vencer.

const original = $('Mensaje al dueno').first().json;
const pagina = $input.first().json;

const estado = pagina.properties?.Estado?.select?.name || 'Esperando_Aprobacion';

const creado = pagina.created_time || original.recibido;
const horas = (Date.now() - new Date(creado).getTime()) / (1000 * 60 * 60);
const vencida = horas >= 4;

return [
  {
    json: {
      ...original,
      estado_actual: estado,
      vencida,
      horas_esperando: Math.round(horas * 100) / 100,
    },
  },
];
