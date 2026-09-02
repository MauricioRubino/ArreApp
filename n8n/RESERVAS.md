# Workflow de n8n — Reserva nueva

Reemplaza al workflow que entraba por Google Forms. Ahora la reserva llega
desde la página de reservas de la app.

```
Reserva nueva (Webhook · Header Auth)
  └ Configuración (IDs y plazos, en un solo lugar)
      └ Notion: políticas activas → Preparar análisis → Claude
          └ Notion: turno de la fecha → Notion: reservas confirmadas
              └ Decidir
                  ├ duplicada → descartar
                  └ Notion: crear reserva (vinculada a su turno)
                       ├ si falló la IA → Notion: registrar en Errores
                       └ Telegram al dueño
                       ├ automática → Gmail al cliente (si dejó email)
                       └ a revisar → esperar 5 min → releer Notion
                                       ├ sigue esperando → volver a esperar
                                       ├ Confirmada → Gmail al cliente
                                       ├ Rechazada  → Gmail de disculpa
                                       └ 4 h sin respuesta → Vencida + Telegram
```

## Qué decide qué

La reserva se confirma sola sólo si **no** se cumple ninguna de estas:

- Claude marcó `requiere_revision_humana` (mascotas, alergias, eventos,
  accesibilidad, algo que contradice una política)
- Claude detectó que viola una política
- son más de 10 personas
- la confianza del análisis es menor a 0.7
- no hay lugar en el turno

Cualquiera de esas la manda a revisión, y el motivo queda escrito tanto en
Notion (`Motivo_Revision`) como en el mensaje de Telegram.

## Decisiones de implementación

**Notion se consulta por HTTP Request, no con el nodo Notion.** Así el cuerpo
de cada request es exactamente el que documenta la API, sin depender de cómo
el nodo traduce `Propiedad|tipo` a valores — que es donde el workflow anterior
perdía el teléfono, la fecha y la hora. La credencial sigue siendo `notionApi`.

**Las reservas del día se buscan por rango, no por igualdad de fecha.**
Notion compara en UTC: una reserva de las 21:00 `-03:00` queda guardada como
el día *siguiente* en UTC, así que `{ equals: "2028-04-22" }` no devuelve
ninguna reserva de cena — y el turno de cena va de 19:30 a 00:00, o sea casi
todas. Con eso roto la ocupación daba siempre 0 y los duplicados de noche no
se detectaban nunca. El rango lo calcula el nodo `Configuracion`.

**La ocupación se calcula, no se guarda.** No hay campo `Ocupacion` en Turnos:
se suman las personas de las reservas ya `Confirmada` de esa fecha. Un contador
guardado se desincroniza en cuanto alguien cancela o carga una reserva a mano.

**Sin turno cargado para esa fecha, no se bloquea.** `Capacidad_Total` sale de
la base `Turnos`; si no hay fila para ese día, se asume que hay lugar. Para que
el control de capacidad funcione de verdad hay que cargar los turnos.

**El cuerpo de la llamada a Claude lo arma el nodo Code**, no una expresión.
Armar ese JSON con `{{ }}` anidados es frágil y no se puede probar; así se
ejecuta como JavaScript común contra un payload real.

**Structured outputs** (`output_config.format`) garantizan el esquema de la
respuesta, así que no hay que pedir "devolvé sólo JSON" ni manejar el caso de
que conteste con texto alrededor. Si la llamada falla igual, `Decidir` manda la
reserva a revisión humana en vez de tirarla.

**Los mensajes van en `parse_mode: HTML` con `&`, `<` y `>` escapados.** El
nodo de n8n usa Markdown por defecto, y basta un `_` —el nombre de una
política, por ejemplo— para que Telegram rechace el mensaje entero.

**Ningún identificador vive dentro de un nodo.** Las bases y las horas de
vencimiento salen del nodo `Configuracion`, que a su vez las lee de variables
de entorno de n8n y sólo cae al literal si no están. Cambiar de workspace o
levantar un ambiente de prueba es tocar un nodo, no doce.

**El secreto del webhook tampoco vive en `Configuracion`.** Está en una
credencial *Header Auth* del nodo `Reserva nueva`, que exige
`X-Arrecife-Secret` y rechaza la petición con 403 antes de que el workflow
arranque. Tenerlo en el código tenía dos problemas: cada reimportación lo
pisaba con el placeholder, y viajaba adentro del JSON que se sube al
repositorio.

**Los fallos de IA quedan registrados.** Si Claude no contesta, la reserva
sigue su curso hacia revisión humana —no se pierde— pero además se escribe
una fila en la base `Errores`, vinculada por relación a la reserva que la
generó. Antes ese fallo era invisible: el workflow terminaba en verde.

**Cada reserva queda vinculada a su turno.** La relación
`Turnos.Reservas_Vinculadas` se pasó a bidireccional, así que una sola
escritura desde la reserva llena los dos lados y ningún dato queda aislado.

## Importar

En n8n: **Workflows** → `···` → **Import from File** →
[`reservas-arrecife.json`](reservas-arrecife.json).

Después completar, igual que en el de pedidos:

| Dónde | Qué poner |
| --- | --- |
| Nodo **Reserva nueva** | elegir la credencial **Header Auth** (*Name* = `X-Arrecife-Secret`, *Value* = tu `N8N_SECRET`) — es la misma que usa el workflow de pedidos |
| Nodos de **Telegram** (2) | el `chatId` del dueño |
| Nodos **Notion** (7) | elegir la credencial `notionApi` — las URLs ya vienen cargadas |
| Nodo **Claude - Analizar** | credencial Header Auth con `x-api-key` |
| Nodos de **Gmail** (2) | elegir la credencial de Gmail |

Activar y copiar la **Production URL** del nodo `Reserva nueva` → va a Vercel y
a `.env.local` como `N8N_RESERVAS_WEBHOOK_URL`.

## Editar

Los cuatro nodos Code viven como archivos en [`reservas/`](reservas/):

Cada archivo se llama igual que el nodo que contiene:

| Archivo | Nodo en n8n |
| --- | --- |
| `preparar-analisis.js` | **Preparar analisis** — contexto RAG + petición a Claude |
| `decidir.js` | **Decidir** — combina todo y elige la ruta |
| `mensaje-al-dueno.js` | **Mensaje al dueno** — texto de Telegram |
| `evaluar-aprobacion.js` | **Evaluar aprobacion** — polling del estado |
| `configuracion.js` | **Configuracion** — IDs de bases, plazos y vencimiento |
| `armar-error.js` | **Armar error** — registro en la base Errores |
| `retomar-datos.js` | **Retomar datos** — repone los datos tras el nodo de Telegram |

`node n8n/generar-workflow-reservas.mjs` regenera el JSON a partir de ellos, y
antes de escribirlo verifica que **todos los nodos sean alcanzables desde el
webhook** — el bug más caro del workflow anterior eran ramas enteras colgando
de una salida que nadie había cableado.

También se pueden editar directamente en n8n, que para eso está.

## Lo que recibe el webhook

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

`email` y `comentario` llegan en `null` si el cliente no los completó. El
email es opcional en el formulario: sin él la confirmación queda por teléfono
y el workflow saltea el nodo de Gmail.
