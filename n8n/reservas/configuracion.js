// Nodo Code "Configuracion".
//
// Unico lugar del workflow donde viven los identificadores. Todos los nodos
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

return [
  {
    json: {
      bases,
      // Se compara contra el header que manda la app. Ponerlo aca y no en el
      // nodo IF permite rotarlo sin tocar la logica del flujo.
      secreto: leerEnv('ARRECIFE_SECRET', 'PEGA-ACA-TU-N8N-SECRET'),
      // Horas que espera una reserva en revision antes de vencer.
      horasParaVencer: Number(leerEnv('ARRECIFE_HORAS_VENCIMIENTO', 4)),
    },
  },
];
