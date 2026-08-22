// Nodo Code "Mensaje al dueno".
//
// Se corre despues de crear la pagina en Notion, asi el mensaje puede
// linkear a la reserva. El $json de entrada es la respuesta de Notion, no
// la decision: por eso la decision se toma por nombre de nodo.

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
  lineas.push(
    '',
    'Para aprobarla o rechazarla, cambia el Estado de la reserva en Notion',
    'a Confirmada o Rechazada. El sistema lo revisa cada 5 minutos y se',
    'vence a las 4 horas sin respuesta.'
  );
}

lineas.push('', `Ver en Notion: ${pagina.url}`);

return [{ json: { ...r, reserva_id: pagina.id, reserva_url: pagina.url, mensaje: lineas.join('\n') } }];
