# Workflow de n8n — Pedido nuevo a Telegram

Cuando entra un pedido, la app lo guarda en Notion y después dispara este
workflow, que le avisa al dueño por Telegram.

```
Pedido nuevo (Webhook) → Secreto válido (IF) → Armar mensaje (Code) → Avisar al dueño (Telegram)
```

La rama falsa del IF queda vacía a propósito: un pedido sin el secreto
correcto se descarta en silencio.

## 1. Crear el bot de Telegram

1. En Telegram, hablale a **@BotFather** → `/newbot` → elegí nombre y usuario.
   Te devuelve un token tipo `8123456789:AAF...`.
2. **El dueño tiene que escribirle al bot al menos una vez** (un `/start`
   alcanza). Un bot no puede iniciar conversación: si nunca le escribieron,
   el `sendMessage` falla con *chat not found*.
3. Para averiguar el `chatId`, abrí en el navegador:

   ```
   https://api.telegram.org/bot<TU-TOKEN>/getUpdates
   ```

   Buscá `"chat":{"id":123456789` — ese número es el `chatId`.

## 2. Importar el workflow

En n8n: **Workflows** → `···` → **Import from File** →
[`pedido-a-telegram.json`](pedido-a-telegram.json).

Después hay que completar tres cosas, que a propósito no vienen en el
archivo para no versionar secretos:

| Dónde | Qué poner |
| --- | --- |
| Nodo **Secreto válido** | reemplazar `PEGA-ACA-TU-N8N-SECRET` por tu `N8N_SECRET` |
| Nodo **Avisar al dueño** | reemplazar `PEGA-ACA-TU-CHAT-ID` por el `chatId` del dueño |
| Nodo **Avisar al dueño** | elegir la credencial de Telegram (creala con el token de BotFather) |

Activá el workflow y copiá la **Production URL** del nodo Webhook.

## 3. Conectar la app

En Vercel (Settings → Environment Variables) y en `.env.local`:

```
N8N_WEBHOOK_URL=https://tu-n8n/webhook/arrecife-pedidos
N8N_SECRET=el-mismo-que-pusiste-en-el-IF
```

El `N8N_SECRET` lo inventás vos. La app lo manda en el header
`X-Arrecife-Secret` y el IF lo verifica: el webhook es una URL pública y sin
eso cualquiera podría dispararle pedidos falsos al dueño.

Si n8n es self-hosted, la URL tiene que ser **alcanzable desde Vercel**:
HTTPS público con certificado válido (dominio propio, o un Cloudflare Tunnel
si corre en una máquina de casa).

## 4. Cómo queda el mensaje

```
🍽 PEDIDO #12

2x Rabas de calamar - $1.300
1x Milanesa de carne (Papas fritas) - $730

Subtotal: $2.030
Scotiabank 25%: -$508

TOTAL: $1.522  ·  Scotiabank 25%

Cliente: Juan Pérez
Tel: +59899123456
Dirección: Av. Solari 1234 (portón verde)
Mapa: https://maps.google.com/?q=-34.6612,-54.1489

Ver en Notion: https://notion.so/...
```

El bloque de descuento sólo aparece si el cliente eligió una promo.

## Editar el texto

El mensaje se arma en el nodo **Armar mensaje**, y podés editarlo
directamente en n8n sin tocar la app ni redeployar — que es buena parte de
por qué el aviso vive acá y no en el código.

Si preferís versionarlo, el mismo código está en
[`armar-mensaje.js`](armar-mensaje.js) como JavaScript de verdad (así se
puede probar), y `node n8n/generar-workflow.mjs` regenera el JSON a partir
de él.

## Lo que recibe el webhook

El payload completo, con las etiquetas ya resueltas y los links armados,
está documentado en el [README principal](../README.md#lo-que-recibe-n8n).
