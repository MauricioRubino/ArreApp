// Definición única del esquema de la base de pedidos.
//
// La importan notion/crear-base.mjs (para crear la base) y
// notion/verificar-esquema.mjs (para chequear que lo que manda la app
// encaje). Tener una sola definición es lo que evita que la base y el
// código se separen con el tiempo.
//
// Los nombres tienen que coincidir carácter por carácter con los que usa
// api/_lib/notion.js, tildes incluidas, o Notion rechaza la escritura.

export const NOMBRE_POR_DEFECTO = 'arrecifepedidos'

const texto = () => ({ rich_text: {} })

export const PROPIEDADES = {
  // El título es lo que se ve en el tablero: número + nombre, para poder
  // identificar un pedido de un vistazo sin abrir la tarjeta.
  Pedido: { title: {} },
  'Número': { number: { format: 'number' } },
  Estado: {
    select: {
      options: [
        { name: 'Nuevo', color: 'red' },
        { name: 'Preparando', color: 'orange' },
        { name: 'Listo', color: 'yellow' },
        { name: 'En camino', color: 'blue' },
        { name: 'Entregado', color: 'green' },
        { name: 'Cancelado', color: 'gray' },
      ],
    },
  },
  Cliente: texto(),
  'Teléfono': { phone_number: {} },
  Recibido: { date: {} },
  Detalle: texto(),
  Platos: { number: { format: 'number' } },
  // Notion no tiene formato de peso uruguayo; queda como número y se
  // puede cambiar a mano desde la UI.
  Total: { number: { format: 'number' } },
  Pago: {
    select: {
      options: [
        { name: 'Efectivo', color: 'green' },
        { name: 'Scotiabank 25%', color: 'red' },
        { name: 'Scotiabank 15%', color: 'orange' },
        { name: 'Otras Tarjetas', color: 'blue' },
      ],
    },
  },
  'Dirección': texto(),
  Referencia: texto(),
  'Ubicación': { url: {} },
  // No la escribe la app: es para que el dueño anote lo que quiera.
  Notas: texto(),
}

// Propiedades que la app nunca escribe, así el verificador no las reporta
// como faltantes.
export const SOLO_MANUALES = ['Notas']
