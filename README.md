# Arrecife — Restaurant Parrillada

App web del restaurante Arrecife (La Paloma, Rocha — desde 1986). Pensada
principalmente para usarse desde el celular. Permite ver la carta, armar un
pedido de delivery y reservar mesa; los pedidos y reservas le llegan al dueño
por WhatsApp, y él responde por el mismo WhatsApp para avisarle al cliente o
dar de baja platos sin stock.

## Cómo correrlo

```bash
npm install
```

```bash
npm run dev
```

Otros comandos: `npm run build` (compila a `dist/`), `npm run lint` (oxlint),
`npm run preview` (sirve el build).

> En desarrollo con `vite dev` **no corren las funciones de `api/`**: los
> avisos por WhatsApp fallan en silencio y la app muestra el respaldo manual.
> Para probar el backend localmente hace falta `vercel dev`.

## Cómo está organizado

```
src/
  pages/        Una por ruta (Home, Carta, Delivery, Checkout, Reservas…)
  components/   UI por dominio: menu/, cart/, checkout/, reservas/, forms/
  hooks/        Estado y lógica de formularios (useMenu, useCheckoutForm…)
  services/     Única puerta de salida a datos/red (menuService, notification…)
  store/        Carrito (Zustand, persistido en localStorage)
  data/         Carta, guarniciones, países, métodos de pago, ubicación
api/            Funciones serverless de Vercel
  notify.js     Recibe pedido/reserva, valida, numera y avisa al dueño
  webhook.js    Recibe las respuestas del dueño desde WhatsApp
  stock.js      Expone los platos sin stock al frontend
  _lib/         Lógica compartida (kv, whatsapp, validación, teléfonos…)
```

Toda la app habla con los datos a través de `services/` — hoy resuelven contra
`data/` local, y el día que haya backend propio sólo cambia lo de adentro de
esas funciones.

**Precios y stock se validan siempre en el backend** (`api/_lib/validation.js`):
lo que manda el navegador no se considera confiable, cada línea del pedido se
reconstruye contra la carta real.

## Comandos que el dueño usa por WhatsApp

Cada pedido/reserva recibe un número correlativo (`#1`, `#2`, …) que se muestra
en la confirmación del cliente y en el aviso al dueño.

| El dueño escribe | Efecto |
| --- | --- |
| `ok #3` | Avisa al cliente que su pedido se está preparando |
| `listo #3` | Avisa que el pedido está listo |
| `en camino #3` | Avisa que el pedido salió |
| `confirmada #5` | Confirma la reserva |
| `cancelada #5` | Cancela la reserva |
| `no hay rabas` | Marca el plato sin stock (no se puede pedir) |
| `sí hay rabas` | Repone el stock |

Si el nombre del plato coincide con varios, el sistema responde con una lista
numerada y el dueño contesta sólo el número.

## Deploy en Vercel

1. Importar el repo en Vercel (framework Vite, se detecta solo). El
   `vercel.json` incluye el rewrite que hace falta para que las rutas del SPA
   (`/carta`, `/reservas`…) no den 404 al entrar directo, sin tocar `/api/*`.
2. **Storage → Redis (Upstash)** desde el Marketplace de Vercel y conectarlo al
   proyecto: carga solo `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
   Sin esto los números de pedido y el stock no persisten entre invocaciones.
3. Cargar el resto de las variables de entorno (ver `.env.example`).

## Configurar WhatsApp (Meta Cloud API)

1. Crear una app en [developers.facebook.com](https://developers.facebook.com/apps)
   (tipo Business) y agregarle el producto **WhatsApp**. Ahí salen
   `WHATSAPP_PHONE_NUMBER_ID` y un token de prueba de 24 h.
2. Para producción, generar un token permanente en Business Settings → System
   Users, con permiso `whatsapp_business_messaging` → `WHATSAPP_ACCESS_TOKEN`.
3. Aprobar una plantilla en WhatsApp Manager → Message Templates. Categoría
   *Utility*, idioma español, con **un solo parámetro** y de **una sola línea**
   (Meta no permite saltos de línea en los parámetros):

   ```
   Aviso de Arrecife: {{1}}
   ```

4. Configurar el webhook en WhatsApp → Configuration:
   - Callback URL: `https://TU-PROYECTO.vercel.app/api/webhook?token=EL_TOKEN`
     (el token va en la query, igual al `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
   - Verify token: el mismo valor
   - Suscribirse al campo `messages`
5. Poner el número público del restaurante en `src/data/contactData.js`, para
   que el cliente tenga el botón de respaldo por `wa.me` si el aviso automático
   no se pudo entregar.

### Sin credenciales configuradas

La app funciona igual: los mensajes quedan en los logs de la función y el
cliente ve un aviso de que el pedido no se pudo enviar automáticamente, con un
botón para mandarlo él mismo por WhatsApp. Nada de esto rompe el flujo.
