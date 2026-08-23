# Arrecife — Restaurant Parrillada

App web del restaurante Arrecife (La Paloma, Rocha — desde 1986). Pensada
principalmente para usarse desde el celular. Permite ver la carta, armar un
pedido de delivery y reservar mesa. Cada pedido se valida en el backend, se
guarda en una base de Notion y dispara una automatización en n8n, que es la
que se encarga de avisarle al dueño.

**La app no manda ni recibe mensajes.** Toda la comunicación con el dueño y
con el cliente vive en n8n, del otro lado del webhook.

## Cómo correrlo

```bash
npm install
```

```bash
npm run dev
```

Otros comandos: `npm run build` (compila a `dist/`), `npm run lint` (oxlint),
`npm run preview` (sirve el build).

> `npm run dev` **también sirve las funciones de `api/`**, así que se puede
> probar el flujo completo (incluida la escritura en Notion) sin `vercel dev`.
> Lo hace `vite-api-plugin.js`, que las monta en el dev server y les pasa las
> variables de `.env.local`. Si `NOTION_TOKEN` no está cargado, al confirmar
> un pedido la app muestra "no pudimos guardar tu pedido" — que es el
> comportamiento correcto: sin backend que responda, el pedido no existe.

> **Si los pedidos fallan en local con un error de certificado**
> (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), es un antivirus o proxy interceptando
> HTTPS. Por eso el script `dev` arranca Node con `--use-system-ca`: así usa
> el almacén de certificados del sistema, donde esos programas registran su
> CA raíz.

## Cómo está organizado

```
src/
  pages/        Una por ruta (Home, Carta, Delivery, Checkout, Reservas…)
  components/   UI por dominio: menu/, cart/, checkout/, reservas/, forms/
  hooks/        Estado y lógica de formularios (useMenu, useCheckoutForm…)
  services/     Única puerta de salida a datos/red (apiClient, menuService…)
  store/        Carrito (Zustand, persistido en localStorage)
  data/         Carta, guarniciones, países, métodos de pago, ubicación
api/            Funciones serverless de Vercel
  orders.js     Recibe pedido/reserva, valida, numera, guarda y dispara n8n
  _lib/         notion, n8n, validación, contador, rate limit, teléfonos
notion/         Scripts de la base en Notion + guía del esquema
vite-api-plugin.js  Monta api/ en el dev server de Vite
```

Toda la app habla con los datos a través de `services/` — la carta resuelve
contra `data/` local y los pedidos salen por `apiClient`.

## El flujo de un pedido

```
Navegador → POST /api/orders
   1. Rate limit por IP + tope global diario         (Redis)
   2. Validación server-side                         (_lib/validation.js)
   3. Número correlativo del día                     (Redis)
   4. Crear la página en Notion  ← fuente de verdad  (_lib/notion.js)
   5. Disparar el webhook de n8n                     (_lib/n8n.js)
```

Los pasos 4 y 5 no son intercambiables:

- **Si Notion falla, el pedido se rechaza** con 502 y el cliente ve un error
  pidiéndole que reintente. Es preferible a confirmarle un pedido que nadie
  va a ver, porque ya no queda ningún canal de respaldo.
- **Si n8n falla, el pedido igual se confirma.** Ya quedó guardado en Notion;
  lo único que se pierde es la automatización, que se puede reprocesar
  mirando la base.

**Los precios se validan siempre en el backend** (`api/_lib/validation.js`):
lo que manda el navegador no se considera confiable, cada línea del pedido se
reconstruye contra la carta real. Con Notion del otro lado esto importa más
que antes, no menos: es lo único entre el navegador y la base.

También se valida server-side el horario de atención y que la ubicación del
pin caiga dentro de la zona de entrega.

## Lo que recibe n8n

`POST` al `N8N_WEBHOOK_URL` con el header `X-Arrecife-Secret` (el workflow
tiene que verificarlo: el webhook es una URL pública).

El payload va **masticado a propósito**: además de los datos crudos lleva las
etiquetas ya resueltas, los links armados y los subtotales calculados, para
que el workflow sea un nodo que arma texto y no una cadena de nodos
traduciendo IDs a nombres.

```json
{
  "tipo": "order",
  "numero": 12,
  "fecha": "2026-08-21",
  "recibido": "2026-08-21T20:00:00-03:00",
  "notion": {
    "pageId": "page-abc-123",
    "url": "https://notion.so/page-abc-123"
  },
  "datos": {
    "nombre": "Juan Pérez",
    "telefono": "+59899123456",
    "calle": "Av. Solari 1234",
    "referenciaHogar": "portón verde",
    "direccion": "Av. Solari 1234 (portón verde)",
    "location": { "lat": -34.6612, "lng": -54.1489 },
    "mapsUrl": "https://maps.google.com/?q=-34.6612,-54.1489",
    "metodoPago": "scotiabank-25",
    "metodoPagoLabel": "Scotiabank 25%",
    "items": [
      {
        "menuItemId": "ent-01",
        "name": "Rabas de calamar",
        "price": 650,
        "quantity": 2,
        "guarnicion": null,
        "subtotal": 1300,
        "linea": "2x Rabas de calamar - $1.300"
      }
    ],
    "platos": 5,
    "total": 3490,
    "totalLabel": "$3.490"
  }
}
```

Cada campo `*Label` es el texto listo para mostrar; `linea` es la línea del
plato ya redactada. Con eso, el mensaje al dueño sale de una expresión:

```
🍽️ Pedido #{{ $json.numero }}

{{ $json.datos.items.map(i => i.linea).join('
') }}

Total: {{ $json.datos.totalLabel }} ({{ $json.datos.metodoPagoLabel }})
{{ $json.datos.nombre }} — {{ $json.datos.telefono }}
{{ $json.datos.direccion }}
{{ $json.datos.mapsUrl }}

Ver en Notion: {{ $json.notion.url }}
```

Con `"tipo": "reservation"`, `datos` trae `nombre`, `telefono`, `fecha`,
`fechaLabel` ("Sábado 15 de enero"), `hora`, `fechaHora` (ISO con offset),
`personas`, `zona`, `zonaLabel` y `comentario`.

Los datos ya vienen validados y con los precios recalculados contra la carta:
n8n puede confiar en ellos sin volver a chequear nada.

## Entrega del proyecto final

La documentación del ecosistema de automatización está en [`docs/`](docs/):

| Archivo | Contenido |
| --- | --- |
| [`entrega-final.pdf`](docs/entrega-final.pdf) | Mapa de arquitectura, estructuras de datos, matriz de costos, seguridad y resiliencia |
| [`entrega-final.html`](docs/entrega-final.html) | Fuente del PDF; se regenera con el comando de abajo |
| [`dashboard.md`](docs/dashboard.md) | Vistas del panel de control e indicadores |
| [`guion-video.md`](docs/guion-video.md) | Guion cronometrado del video demo |

Los archivos técnicos de respaldo son los workflows de
[`n8n/`](n8n/) y los scripts de esquema de [`notion/`](notion/).

Para regenerar el PDF tras editar el HTML (requiere Edge o Chrome):

```bash
npm run docs:pdf
```

Y para recalcular los indicadores del dashboard contra Notion:

```bash
npm run notion:kpis
```

## Deploy en Vercel

1. Importar el repo en Vercel (framework Vite, se detecta solo). El
   `vercel.json` incluye el rewrite que hace falta para que las rutas del SPA
   (`/carta`, `/reservas`…) no den 404 al entrar directo, sin tocar `/api/*`.
2. **Storage → Redis (Upstash)** desde el Marketplace de Vercel y conectarlo al
   proyecto: carga solo `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
   Sin esto la numeración de pedidos y el límite anti-spam no persisten entre
   invocaciones de la función.
3. Crear la base de Notion con `node notion/crear-base.mjs <URL-de-la-página>`
   — los detalles y el esquema están en [`notion/README.md`](notion/README.md).
4. Cargar el resto de las variables de entorno (ver `.env.example`).

## n8n self-hosted

El webhook tiene que ser **alcanzable desde Vercel**: HTTPS público con
certificado válido. En un VPS alcanza con un dominio y Caddy/nginx adelante;
si corre en una máquina de casa, lo más práctico es un Cloudflare Tunnel.

Si el server está caído no se pierde ningún pedido —quedan todos en Notion—
pero el dueño no se entera hasta que mire la base.
