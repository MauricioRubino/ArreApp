// Nodo Code "Mensaje al dueno".
//
// Se corre despues de crear la pagina en Notion, asi el mensaje puede
// linkear a la reserva. El $json de entrada es la respuesta de Notion, no
// la decision: por eso la decision se toma por nombre de nodo.

// Telegram interpreta el mensaje segun el parse_mode del nodo, y el de
// n8n usa Markdown por defecto: un guion bajo en el texto —por ejemplo el
// nombre de una politica como "Politica_Reserva"— abre una cursiva que
// nunca cierra, y Telegram rechaza el mensaje entero con "can't parse
// entities". El nodo va en parse_mode HTML, donde solo estos tres
// caracteres son especiales, y aca se escapan.
const escaparHtml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const r = $('Decidir').first().json;
const pagina = $input.first().json;

const lineas = [
  r.requiere_revision ? 'RESERVA A REVISAR' : 'RESERVA CONFIRMADA',
  `#${r.numero} - ${r.nombre}`,
  '',
  `${r.fechaLabel} a las ${r.hora}`,
  `${r.personas} personas - ${r.zonaLabel}`,
];

if (r.comentario) lineas.push(`Comentario: ${r.comentario}`);

lineas.push('', `Tel: ${r.telefono}`);
if (r.email) lineas.push(`Email: ${r.email}`);

if (r.capacidad !== null) {
  lineas.push('', `Ocupacion del turno: ${r.ocupacion} + ${r.personas} de ${r.capacidad}`);
}

if (r.requiere_revision) {
  lineas.push('', `Motivo: ${r.motivo_revision}`);
  lineas.push(`(analizado contra ${r.politicas_consultadas} politicas)`);
  lineas.push(
    '',
    'Para aprobarla o rechazarla, cambia el Estado de la reserva en Notion',
    'a Confirmada o Rechazada. El sistema lo revisa cada 5 minutos y se',
    'vence a las 4 horas sin respuesta.'
  );
}

lineas.push('', `Ver en Notion: ${pagina.url}`);

return [{ json: { ...r, reserva_id: pagina.id, reserva_url: pagina.url, mensaje: escaparHtml(lineas.join('\n')) } }];
