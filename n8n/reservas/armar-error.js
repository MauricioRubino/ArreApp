// Nodo Code "Armar error".
//
// Deja registro en la base Errores cuando el analisis de IA no se pudo
// hacer. La reserva NO se pierde —Decidir la manda a revision humana— pero
// sin este registro el fallo era invisible: el workflow terminaba en verde
// y nadie se enteraba de que Claude no habia contestado.
//
// Se corre despues de crear la reserva a proposito, para poder vincular el
// error con ella (Reserva_Relacionada) en vez de dejar un registro suelto.

const r = $('Mensaje al dueno').first().json;
const bases = $('Configuracion').first().json.bases;

// Lo minimo para poder reproducir el caso, sin volcar la reserva entera:
// telefono y email no hacen falta para depurar por que fallo la IA.
const payload = {
  numero: r.numero,
  fecha: r.fecha,
  hora: r.hora,
  personas: r.personas,
  zona: r.zonaLabel,
  comentario: r.comentario,
  politicas_consultadas: r.politicas_consultadas,
};

// rich_text corta en 2000 caracteres.
const texto = JSON.stringify(payload).slice(0, 1900);

const peticion = {
  parent: { database_id: bases.errores },
  properties: {
    Error_numero: {
      title: [{ text: { content: `Reserva #${r.numero} - fallo el analisis de IA` } }],
    },
    Tipo_Error: { select: { name: 'API_IA_Fallo' } },
    Payload_Original: { rich_text: [{ text: { content: texto } }] },
    Resuelto: { checkbox: false },
    Reserva_Relacionada: { relation: [{ id: r.reserva_id }] },
  },
};

return [{ json: { peticion, numero: r.numero } }];
