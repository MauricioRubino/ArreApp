# Arrecife — Ecosistema de automatización con IA

Sistema de triage automático de reservas para el restaurante **Arrecife** (La
Paloma, Rocha — desde 1986).

Una reserva entra por la web, el sistema la valida, la **razona contra las
políticas del local con un modelo de lenguaje**, la registra en Notion y avisa
al encargado por Telegram. Confirma sola las que no tienen observaciones, y se
detiene a pedir aprobación humana cuando la reserva lo amerita.

| | |
| --- | --- |
| **Caso de uso** | Triage automático de reservas de restaurante |
| **Orquestador** | n8n Cloud — 28 nodos |
| **Base de datos** | Notion — 5 bases relacionadas |
| **Procesamiento IA** | Claude Opus 5 con RAG sobre políticas y salida estructurada |
| **Canales de salida** | Gmail al cliente · Telegram al encargado |
| **Aplicación** | React + funciones serverless en Vercel |
| **Producción** | https://arre-app.vercel.app |
| **Video demo** | https://youtu.be/lzZIMKeJYp4 |

> **La aplicación no manda ni recibe mensajes.** Toda la comunicación con el
> cliente y con el encargado vive en n8n, del otro lado del webhook. Cambiar un
> aviso es editar un nodo, no redeployar la app.

La documentación completa de la entrega —mapa de arquitectura, estructuras de
datos, matriz de costos, seguridad y resiliencia— está en
**[`entrega-final.pdf`](Entrega%20Final%20-%20Ecosistema%20de%20Automatización%20IA%20Autónomo%20para%20Negocios/entrega-final.pdf)**.

---

## El problema

Las reservas llegaban por teléfono y WhatsApp, y cada una obligaba a la misma
secuencia manual: anotarla, acordarse de si esa fecha ya estaba llena, y decidir
si el comentario del cliente —«vamos con un perro», «llevamos nuestra torta»,
«uno es celíaco»— chocaba contra alguna regla del local. Ese último paso es el
que no se puede resolver con un formulario: exige leer una frase libre y
cruzarla con 23 políticas que viven en la cabeza del encargado.

El sistema automatiza la parte mecánica y **deja la decisión humana sólo donde
hace falta**, con el motivo ya redactado.

---

## Cómo funciona el proceso de automatización

### Paso a paso

**1 · El formulario web entrega, no escribe.**
`POST /api/orders` con `type: "reservation"` aplica rate limit por IP, valida
los campos server-side, rechaza fechas en el pasado y le asigna un número
correlativo del día (contador atómico en Redis). Después se lo pasa al webhook
de n8n y responde. **No toca Notion.**

**2 · El webhook autentica.**
La URL es pública, así que el nodo `Reserva nueva` usa una credencial *Header
Auth* que exige el header `X-Arrecife-Secret`. Sin él, n8n rechaza la petición
antes de ejecutar nada.

**3 · `Configuracion` centraliza todo lo variable.**
IDs de las bases, capacidad por defecto, plazo de vencimiento y el rango de
fechas del día. Los lee de variables de entorno de n8n con literal de respaldo.
Ningún identificador vive adentro de otro nodo: levantar un ambiente de prueba
es tocar un nodo, no doce.

**4 · RAG: se recuperan las políticas vigentes.**
Se consulta la base `Politicas_Arrecife` filtrando por `Activo`, y las 23
políticas activas se inyectan en el system prompt. **El prompt se rearma en cada
ejecución**: editar una política en Notion cambia cómo se evalúa la próxima
reserva, sin tocar el flujo ni redeployar nada.

**5 · Claude analiza el comentario.**
El cuerpo de la llamada lo arma un nodo Code (no una expresión, para poder
probarlo como JavaScript común) y usa **salida estructurada** — un `json_schema`
que garantiza la forma de la respuesta, sin tener que pedir "devolvé sólo JSON"
ni manejar texto alrededor:

```json
{
  "requiere_revision_humana": true,
  "motivo_revision": "Viene con un perro: permitido en terraza, no en salón",
  "confianza": 0.94,
  "viola_politica": false,
  "politica_relacionada": "Mascotas en el salón"
}
```

**El teléfono y el email no se le mandan al modelo.** No aportan nada a la
clasificación y son los datos más sensibles del conjunto.

**6 · Se chequea la disponibilidad real.**
`Turnos` da la `Capacidad_Total` de esa fecha y `Reservas` las ya confirmadas.
La ocupación **se calcula sumando personas, no se guarda**: un contador
almacenado se desincroniza en cuanto alguien cancela o carga una reserva a mano.

**7 · `Decidir` elige la ruta.**
Combina el análisis, el cupo y los duplicados, y le asigna a la reserva su
`Estado` inicial.

**8 · Se crea la reserva en Notion**, vinculada por relación a su turno.

**9 · Sale el aviso.** Telegram al encargado siempre; Gmail al cliente sólo si la
reserva se confirmó sola y dejó email.

**10 · Human-in-the-loop.** Si quedó `Esperando_Aprobacion`, el flujo **se
detiene**: no contacta al cliente hasta que una persona decida.

### El diagrama

```
Reserva nueva (Webhook · Header Auth)
  └ Configuracion ················ IDs, plazos y rango de fechas en un solo lugar
      └ Notion: políticas activas → Preparar análisis → Claude (RAG)
          └ Notion: turno del día → Notion: reservas confirmadas
              └ Decidir ·········· router: confianza · política · cupo · duplicado
                  ├ duplicada → descartar
                  └ Notion: crear reserva (vinculada a su turno)
                       ├ si falló la IA → Notion: registrar en Errores
                       └ Telegram al encargado
                            ├ automática → Gmail al cliente (si dejó email)
                            └ a revisar → esperar 5 min → releer Estado
                                            ├ sigue esperando → volver a esperar
                                            ├ Confirmada → Gmail al cliente
                                            ├ Rechazada  → Gmail de disculpa
                                            └ 4 h sin respuesta → Vencida
```

### Qué manda la reserva a revisión humana

Se confirma sola sólo si **no** se cumple ninguna de estas:

| Condición | De dónde sale |
| --- | --- |
| Claude marcó `requiere_revision_humana` | mascotas, alergias, eventos, accesibilidad |
| Claude detectó que viola una política | comparación contra las 23 políticas |
| Son más de 10 personas | regla dura, sin IA |
| La confianza del análisis es menor a 0,7 | el modelo no está seguro |
| No hay lugar en el turno | personas confirmadas vs. `Capacidad_Total` |

El motivo queda escrito en `Motivo_Revision` **y** en el mensaje de Telegram, así
que el encargado decide con el argumento a la vista. Aprobar es cambiar `Estado`
a `Confirmada` en Notion; rechazar, a `Rechazada`. El flujo lo detecta en menos
de 5 minutos.

### El punto de aprobación humana, y por qué no cuelga

Notion no emite webhooks de cambios, así que el flujo sondea — pero acotado: un
nodo `Wait` de 5 minutos que relee **esa reserva concreta**, no la base entera.
A las **4 horas sin respuesta** la reserva pasa a `Vencida` y se escala por
Telegram. Ese corte es la guarda contra el bucle infinito: ninguna ejecución
puede quedar viva para siempre esperando que alguien mire el celular.

### Cuando la IA falla, la reserva no se pierde

Si Claude no contesta o devuelve algo inutilizable, `Decidir` manda la reserva a
revisión humana en lugar de tirarla, y **además** escribe una fila en la base
`Errores`, vinculada por relación a la reserva que la provocó. Antes ese fallo
era invisible: el workflow terminaba en verde.

---

## La decisión central: quién es dueño del dato

El repositorio resuelve **dos** procesos que comparten la puerta de entrada
(`/api/orders`) pero reparten el trabajo al revés:

| | **Reservas** | **Pedidos** |
| --- | --- | --- |
| Quién valida y numera | la app | la app |
| **Quién escribe en Notion** | **n8n** | **la app** |
| Rol de n8n | analiza, decide y escribe | sólo notifica |
| Por qué | el `Estado` depende de un análisis que ocurre dentro del flujo | el pedido ya está completo cuando llega |
| Si n8n está caído | la reserva **no** entra (502 al cliente) | el pedido igual se guarda; sólo se pierde el aviso |

Confundir los dos repartos rompe cualquiera de los dos procesos.

---

## El flujo de pedidos

Más corto y sin IA: la carta y el carrito son datos exactos, no lenguaje
ambiguo.

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
  pidiéndole que reintente. Es preferible a confirmarle un pedido que nadie va a
  ver, porque ya no queda ningún canal de respaldo.
- **Si n8n falla, el pedido igual se confirma.** Ya quedó guardado en Notion; lo
  único que se pierde es la automatización, que se puede reprocesar mirando la
  base.

**Los precios se validan siempre en el backend** (`api/_lib/validation.js`): lo
que manda el navegador no se considera confiable, cada línea del pedido se
reconstruye contra la carta real. También se valida server-side el horario de
atención y que el pin de ubicación caiga dentro de la zona de entrega.

---

## Las cinco bases de Notion

| Base | Rol |
| --- | --- |
| **Reservas** | Registro operativo. `Estado` es el eje del sistema: `Confirmada`, `Esperando_Aprobacion`, `Rechazada`, `Vencida` |
| **Turnos** | Capacidad por fecha. Relación bidireccional con Reservas |
| **Politicas_Arrecife** | Base de conocimiento del RAG. 23 políticas activas, editables sin tocar el flujo |
| **Errores** | Análisis que no se pudieron hacer, vinculados a su reserva |
| **arrecifepedidos** | Pedidos de delivery |

Vistas publicadas en modo lectura:

- [**Reservas** — panel de operación](https://efficacious-limburger-84e.notion.site/3c119da0dec98087b386ed1a5e21a39e?v=3c519da0dec980adad00000cf21a8216)
- [**Politicas_Arrecife** — base de conocimiento del RAG](https://efficacious-limburger-84e.notion.site/3c119da0dec980be8594c3080b55c1d6?v=3c519da0dec980c386f5000c3256eb90)

Las vistas del dashboard y los indicadores están en
[`dashboard.md`](Entrega%20Final%20-%20Ecosistema%20de%20Automatización%20IA%20Autónomo%20para%20Negocios/dashboard.md).
Se pueden recalcular contra la API en cualquier momento:

```bash
npm run notion:kpis
```

---

## Dónde se usa IA, y dónde no

La primera decisión de costo fue **no usar un modelo donde alcanza el código**.
El sistema tiene cinco tareas y sólo una llama a un modelo de lenguaje:

| Tarea | Resuelta con |
| --- | --- |
| Validar precios, horario y zona de entrega | Código determinista |
| Numerar pedidos y reservas | Contador atómico en Redis |
| Detectar duplicados | Consulta a Notion |
| Controlar la capacidad del turno | Suma aritmética |
| **Interpretar el comentario contra 23 políticas** | **Claude Opus 5** |

Con 300 reservas al mes, el componente de IA cuesta unos **8,55 USD** y el
sistema completo unos **32,55 USD** (n8n Cloud es el grueso; Vercel, Notion,
Upstash y Telegram están en capa gratuita). Bajar a un modelo más chico ahorraría
menos de 7 USD al mes, contra el costo de clasificar mal una mascota en el salón
o una alergia grave. El desglose y la matriz de decisión están en el PDF.

---

## Cómo correrlo

```bash
npm install
```

```bash
npm run dev
```

Otros comandos: `npm run build` (compila a `dist/`), `npm run lint` (oxlint),
`npm run preview` (sirve el build), `npm run n8n:generar` (regenera los JSON de
los workflows), `npm run docs:pdf` (regenera el PDF de la entrega).

> `npm run dev` **también sirve las funciones de `api/`**, así que se puede
> probar el flujo completo sin `vercel dev`. Lo hace `vite-api-plugin.js`, que
> las monta en el dev server y les pasa las variables de `.env.local`.

> **Si los pedidos fallan en local con un error de certificado**
> (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), es un antivirus o proxy interceptando
> HTTPS. Por eso el script `dev` arranca Node con `--use-system-ca`.

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
  orders.js     Recibe pedido/reserva, valida, numera, y entrega
  _lib/         notion, n8n, validación, contador, rate limit, teléfonos
n8n/            Los dos workflows + el código de cada nodo Code como .js
  reservas/     preparar-analisis, decidir, mensaje-al-dueno, evaluar-aprobacion…
notion/         Scripts de las bases + guía del esquema
```

El código de cada nodo Code vive como **JavaScript ejecutable** en
[`n8n/reservas/`](n8n/reservas/), lo que permite probarlo contra datos reales
antes de importar nada. `node n8n/generar-workflow-reservas.mjs` regenera el JSON
a partir de esos archivos y verifica que **ningún nodo quede sin conexión
entrante** — el bug más caro del workflow anterior eran ramas colgando de una
salida que nadie había cableado.

Guías detalladas: [`n8n/RESERVAS.md`](n8n/RESERVAS.md) ·
[`n8n/README.md`](n8n/README.md) · [`notion/README.md`](notion/README.md)

---

## Lo que recibe n8n

`POST` al webhook con el header `X-Arrecife-Secret`. El payload va **masticado a
propósito**: además de los datos crudos lleva las etiquetas resueltas, los links
armados y los subtotales calculados, para que el workflow arme texto en vez de
traducir IDs a nombres.

Con `"tipo": "reservation"`:

```json
{
  "tipo": "reservation",
  "numero": 7,
  "fecha": "2026-08-22",
  "recibido": "2026-08-22T18:04:13-03:00",
  "datos": {
    "nombre": "Martín Silva",
    "telefono": "+59899123456",
    "email": "martin@example.com",
    "fecha": "2027-01-15",
    "fechaLabel": "Viernes, 15 de enero",
    "hora": "21:00",
    "fechaHora": "2027-01-15T21:00:00-03:00",
    "personas": 12,
    "zona": "terraza",
    "zonaLabel": "Terraza frente al puerto",
    "comentario": "Cumpleaños, venimos con un perro de asistencia"
  }
}
```

`email` y `comentario` llegan en `null` si el cliente no los completó.

Con `"tipo": "order"`, `datos` trae además `calle`, `direccion`, `location`,
`mapsUrl`, `metodoPago`/`metodoPagoLabel`, `items[]` (cada uno con su `subtotal`
y su `linea` ya redactada), `platos`, `total` y `totalLabel`; y afuera de `datos`
viene `notion` con el `pageId` y la `url` de la página ya creada. Con eso el
mensaje al dueño sale de una expresión:

```
🍽️ Pedido #{{ $json.numero }}

{{ $json.datos.items.map(i => i.linea).join("\n") }}

Total: {{ $json.datos.totalLabel }} ({{ $json.datos.metodoPagoLabel }})
{{ $json.datos.nombre }} — {{ $json.datos.telefono }}
{{ $json.datos.direccion }} · {{ $json.datos.mapsUrl }}

Ver en Notion: {{ $json.notion.url }}
```

---

## Seguridad y resiliencia

- **Ningún secreto vive dentro de un workflow.** El del webhook está en una
  credencial *Header Auth* de n8n; las claves de Notion, Anthropic, Gmail y
  Telegram, en credenciales propias. Los JSON publicados en el repo traen
  marcadores (`PEGA-ACA-TU-N8N-SECRET`), no credenciales.
- **Minimización de datos:** teléfono y email se guardan en Notion pero **no se
  envían al modelo**. El registro de errores guarda todavía menos —número, fecha,
  personas y comentario— porque para depurar un análisis no hace falta saber a
  quién llamar.
- **Rutas de error explícitas:** 400 con la lista de campos faltantes, 409 fuera
  de horario o de zona, 429 por rate limit (20/hora por IP, 500/día global), 502
  si la escritura no se pudo hacer.
- **Sin datos hardcodeados:** identificadores, plazos y destinatarios salen del
  nodo `Configuracion`.
- **Guarda contra bucle infinito:** el sondeo de aprobación vence a las 4 horas.

Dos trampas que costaron caro y quedaron documentadas:

- **Notion compara fechas en UTC.** Una reserva de las 21:00 `-03:00` queda
  guardada como el día *siguiente* en UTC, así que `{ equals: "2028-04-22" }` no
  devuelve ninguna reserva de cena. Se consulta por **rango**, no por igualdad.
- **El JSON de Claude no está en `content[0].text`.** El modelo razona antes de
  responder, así que el primer bloque es `thinking`; el texto viene después. Se
  busca el bloque por tipo. Asumir la posición hacía que el análisis fallara en
  silencio.

---

## Entrega del proyecto final

**Video de presentación: [youtu.be/lzZIMKeJYp4](https://youtu.be/lzZIMKeJYp4)**

El resto está en
**[`Entrega Final - Ecosistema de Automatización IA Autónomo para Negocios/`](Entrega%20Final%20-%20Ecosistema%20de%20Automatización%20IA%20Autónomo%20para%20Negocios/)**:

| Archivo | Qué contiene |
| --- | --- |
| **entrega-final.pdf** | 13 páginas: mapa de arquitectura, estructuras de datos, matriz de costos, seguridad y resiliencia |
| dashboard.md | Las cinco vistas de control y los indicadores |
| guion-video.md | Guion cronometrado del video demo |
| workflows/ | Los dos flujos exportados, con los secretos reemplazados por marcadores |
| capturas/ | El formulario en producción y el historial de ejecuciones en n8n |

El PDF se regenera desde el HTML con `npm run docs:pdf` (requiere Edge o Chrome).

---

## Deploy en Vercel

1. Importar el repo (framework Vite, se detecta solo). El `vercel.json` incluye
   el rewrite que hace falta para que las rutas del SPA (`/carta`, `/reservas`…)
   no den 404 al entrar directo, sin tocar `/api/*`.
2. **Storage → Redis (Upstash)** desde el Marketplace y conectarlo al proyecto:
   carga solo `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Sin esto la
   numeración y el límite anti-spam no persisten entre invocaciones.
3. Crear las bases de Notion con `node notion/crear-base.mjs <URL-de-la-página>`
   — esquema y detalles en [`notion/README.md`](notion/README.md).
4. Importar los dos workflows en n8n, completar credenciales y activar. Las
   *Production URL* de los webhooks van a Vercel como `N8N_WEBHOOK_URL` y
   `N8N_RESERVAS_WEBHOOK_URL`.
5. Cargar el resto de las variables de entorno (ver `.env.example`).

`N8N_RESERVAS_WEBHOOK_URL` **no es opcional**: n8n es el único que escribe la
reserva en Notion, así que sin esa variable el formulario de reservas devuelve
error.
