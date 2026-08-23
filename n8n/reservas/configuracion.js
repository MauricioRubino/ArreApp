// Nodo Code "Configuracion".
//
// Unico lugar del workflow donde viven los identificadores.
//
// El secreto del webhook NO esta aca: vive en una credencial Header Auth
// del nodo Reserva nueva. Tenerlo en el codigo significaba que cada
// reimportacion del workflow lo pisaba con el placeholder, y ademas viajaba
// en el JSON que se sube al repositorio. Todos los nodos
// que hablan con Notion arman su URL desde aca, en vez de tener el ID de la
// base escrito adentro: si una base se muda o se duplica para un ambiente de
// prueba, se cambia en un solo lugar.
//
// Los valores se leen primero de las variables de entorno de n8n y recien
// despues del literal, asi la misma exportacion del workflow sirve para
// produccion y para pruebas sin editar nodos. El acceso a $env puede estar
// bloqueado segun la instancia, por eso va protegido.

const leerEnv = (clave, porDefecto) => {
  try {
    return $env[clave] || porDefecto;
  } catch {
    return porDefecto;
  }
};

const bases = {
  politicas: leerEnv('ARRECIFE_DB_POLITICAS', '3c119da0dec980be8594c3080b55c1d6'),
  turnos: leerEnv('ARRECIFE_DB_TURNOS', '3c119da0dec980748fbad1f52292f811'),
  reservas: leerEnv('ARRECIFE_DB_RESERVAS', '3c119da0dec98087b386ed1a5e21a39e'),
  errores: leerEnv('ARRECIFE_DB_ERRORES', '3c119da0dec98097b4d8c21f9f9fc137'),
};

// Rango del dia de la reserva, en hora de Montevideo.
//
// Notion compara fechas en UTC: una reserva de las 21:00 -03:00 queda
// guardada como el dia SIGUIENTE en UTC, asi que filtrar por
// { equals: "2028-04-22" } no devuelve ninguna reserva de cena. Y el turno
// de cena va de 19:30 a 00:00, o sea casi todas. Con eso roto, la ocupacion
// daba siempre 0 y los duplicados de noche no se detectaban nunca.
//
// Por eso se filtra por rango con el offset explicito en vez de por
// igualdad de fecha.
const fechaPedida = $('Reserva nueva').first().json.body.datos.fecha;
const siguiente = new Date(new Date(`${fechaPedida}T12:00:00Z`).getTime() + 86400000)
  .toISOString()
  .slice(0, 10);

const rangoDia = {
  desde: `${fechaPedida}T00:00:00-03:00`,
  hasta: `${siguiente}T00:00:00-03:00`,
};

return [
  {
    json: {
      bases,
      rangoDia,
      // Destinatario de los avisos. Al reimportar el workflow los nodos
      // vuelven al valor por defecto, asi que tenerlo en un solo lugar
      // reduce a uno los nodos que hay que retocar.
      chatId: leerEnv('ARRECIFE_CHAT_ID', 'PEGA-ACA-TU-CHAT-ID'),
      // Horas que espera una reserva en revision antes de vencer.
      horasParaVencer: Number(leerEnv('ARRECIFE_HORAS_VENCIMIENTO', 4)),
    },
  },
];
