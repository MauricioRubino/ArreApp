# Base de datos de Notion — Pedidos y Reservas

`arrecife-pedidos.csv` existe sólo para **crear el esquema** de la base en
Notion de una vez, sin armar 16 propiedades a mano. Una vez importado, las
filas reales las escribe la app por la API de Notion (`api/_lib/notion.js`);
este CSV no se vuelve a usar.

Es **una sola base** para pedidos y reservas, porque la numeración del día es
compartida (`#12` puede ser un pedido y `#13` una reserva — ver
`api/_lib/store.js`). Los pedidos y las reservas se separan después con vistas
filtradas por `Tipo`.

## 1. Importar

En Notion: página nueva → `/` → **Import** → **CSV** → elegir
`arrecife-pedidos.csv`. Queda una base con las 3 filas de ejemplo.

**Borrá las 3 filas de ejemplo** cuando termines de configurar los tipos: sólo
están para que se vea cómo queda cada campo lleno.

## 2. Corregir los tipos de propiedad

Notion importa casi todo como texto. Hay que abrir cada propiedad y cambiarle
el tipo. Los valores de los `Select` tienen que escribirse **exactamente** así,
porque son los que manda el código:

| Propiedad | Tipo en Notion | Valores / formato |
| --- | --- | --- |
| `Pedido` | Title | `#12 · Juan Pérez` |
| `Número` | Number | `12` |
| `Tipo` | Select | `Pedido`, `Reserva` |
| `Estado` | Select | `Nuevo`, `Preparando`, `Listo`, `En camino`, `Confirmada`, `Cancelada` |
| `Cliente` | Text | |
| `Teléfono` | Phone | E.164 con `+` |
| `Recibido` | Date | con hora |
| `Detalle` | Text | una línea por ítem |
| `Total` | Number | formato *Peso* si querés el `$` |
| `Pago` | Select | `Efectivo`, `Scotiabank 25%`, `Scotiabank 15%`, `Otras Tarjetas` |
| `Dirección` | Text | |
| `Ubicación` | URL | link de Google Maps |
| `Fecha reserva` | Date | con hora |
| `Personas` | Number | |
| `Zona` | Select | `Sin preferencia`, `Interior`, `Terraza frente al puerto` |
| `Comentario` | Text | |

Los `Pago` salen de `src/data/paymentData.js` y las `Zona` de
`src/data/reservasData.js` — `api/_lib/notion.js` importa esas listas
directamente, así que si agregás una opción allá hay que agregarla acá
también o la API de Notion rechaza la escritura.

### Campos que quedan vacíos según el tipo

Es esperable y no es un problema: un pedido no tiene `Fecha reserva`, `Personas`
ni `Zona`; una reserva no tiene `Detalle`, `Total`, `Pago`, `Dirección` ni
`Ubicación`. Las vistas del punto 3 esconden las columnas que no aplican.

## 3. Vistas sugeridas

El dueño mira el celular entre mesas, así que conviene que la vista por defecto
sea la más chica posible:

- **Hoy** (tabla, por defecto) — filtro `Recibido` = *Today*, orden `Número` ↑.
  Es la única que necesita mirar durante el servicio.
- **Pedidos** (tablero agrupado por `Estado`) — filtro `Tipo` = `Pedido`.
  Las columnas se llenan solas a medida que él responde por WhatsApp.
  Esconder `Fecha reserva`, `Personas`, `Zona`.
- **Reservas** (calendario por `Fecha reserva`) — filtro `Tipo` = `Reserva`.
  Esconder `Detalle`, `Total`, `Pago`, `Dirección`, `Ubicación`.
- **Historial** (tabla) — sin filtro, orden `Recibido` ↓. Para buscar un pedido
  viejo, que es justo lo que hoy no se puede: en Redis los registros se borran
  a los 3 días.

## 4. Conectar la app

1. En [notion.so/my-integrations](https://www.notion.so/my-integrations) crear
   una **internal integration** y copiar el token (`ntn_...`) → `NOTION_TOKEN`.
2. En la base: menú `···` → **Connections** → agregar la integración. Sin este
   paso la API responde 404 aunque el token sea válido.
3. El **database ID** son los 32 caracteres de la URL de la base
   (`notion.so/<workspace>/<DATABASE_ID>?v=...`) → `NOTION_DATABASE_ID`.

### Detalles de la escritura

- `Fecha reserva` y `Recibido` van en ISO 8601 **con offset explícito**:
  `2026-08-22T21:00:00-03:00`. Sin el offset, Notion lo interpreta como UTC y
  las reservas aparecen 3 horas corridas. Uruguay no tiene horario de verano
  desde 2015, así que `-03:00` sirve todo el año.
- La API de Notion admite ~3 pedidos por segundo. De sobra para el volumen del
  restaurante, pero conviene no meter reintentos agresivos en el workflow de
  n8n si algún día también escribe acá.
- `Estado` lo escribe la app siempre en `Nuevo`. A partir de ahí lo mueve el
  dueño a mano desde Notion, o el workflow de n8n si le agregás ese paso: la
  app no lo vuelve a tocar.

## 5. Notion no manda nada de vuelta

La base es **sólo lectura** para el flujo: la escribe la app y la mira el dueño.
Mover una tarjeta de columna en el tablero no dispara nada — Notion no emite
webhooks de cambios, habría que hacer polling desde n8n. Por ahora el `Estado`
es una anotación para el propio dueño, no una acción.
