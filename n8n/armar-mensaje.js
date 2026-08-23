// Cuerpo del nodo Code "Armar mensaje" del workflow de n8n.
//
// Vive como archivo aparte para poder probarlo como JavaScript de verdad
// en vez de escribirlo a ciegas adentro de un JSON. Si cambiás el texto,
// regenerá el workflow con generar-workflow.mjs — o editalo directamente
// en n8n, que para eso está.
//
// Va en texto plano a propósito, sin parse_mode: un nombre con & o con _
// rompería el formato de Telegram justo en medio del servicio.

// Telegram interpreta el mensaje segun el parse_mode del nodo, y el de
// n8n usa Markdown por defecto: un guion bajo en el texto —por ejemplo el
// nombre de una politica como "Politica_Reserva"— abre una cursiva que
// nunca cierra, y Telegram rechaza el mensaje entero con "can't parse
// entities". El nodo va en parse_mode HTML, donde solo estos tres
// caracteres son especiales, y aca se escapan.
const escaparHtml = (t) =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cuerpo = $input.first().json.body;
const d = cuerpo.datos;

// Las líneas vacías son separadores a propósito, así que no se filtran:
// lo único opcional es el mapa, y ese caso se maneja aparte.
const lineas = [`🍽 PEDIDO #${cuerpo.numero}`, '', ...d.items.map((i) => i.linea), ''];

// El bloque de descuento sólo aparece si el cliente eligió una promo.
if (d.descuento > 0) {
  lineas.push(`Subtotal: ${d.subtotalLabel}`, `${d.metodoPagoLabel}: ${d.descuentoLabel}`, '');
}

lineas.push(
  `TOTAL: ${d.totalLabel}  ·  ${d.metodoPagoLabel}`,
  '',
  `Cliente: ${d.nombre}`,
  `Tel: ${d.telefono}`,
  `Dirección: ${d.direccion}`
);

if (d.mapsUrl) lineas.push(`Mapa: ${d.mapsUrl}`);

lineas.push('', `Ver en Notion: ${cuerpo.notion.url}`);

return [{ json: { mensaje: escaparHtml(lineas.join('\n')), numero: cuerpo.numero } }];
