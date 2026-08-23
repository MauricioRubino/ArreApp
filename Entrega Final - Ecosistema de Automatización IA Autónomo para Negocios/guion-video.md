# Guion del video demo — 3 minutos

## Antes de grabar

**Preparar:**

- Una reserva ya en `Esperando_Aprobacion` con tu email cargado, para poder
  aprobarla en vivo sin esperar los 5 minutos del sondeo.
- Borrar las reservas de prueba con nombres tipo `PRUEBA — borrar`.
- Un turno cargado en `Turnos` con fecha y capacidad, para que se vea el
  control de cupo.
- Pestañas abiertas y ordenadas: la web, n8n (pestaña Executions), Notion
  (vista Esperando aprobación), Telegram, y el correo.

**Ocultar:**

- El nodo `Configuracion` abierto muestra los IDs de las bases: no lo abras.
- Las credenciales de n8n: no entres a Credentials.
- `.env.local` y la consola: no muestres el editor de código.
- El teléfono real del dueño en Telegram, si se ve en pantalla.

**Ensayar una vez con cronómetro.** El análisis de IA tarda unos 10 a 15
segundos; conviene saber en qué momento cae ese silencio para llenarlo
hablando en vez de mirar la pantalla esperando.

---

## 0:00 – 0:20 · Qué resuelve

> «Arrecife es un restaurante de La Paloma. Recibe reservas por su web, y hasta
> ahora alguien tenía que leer cada una, cruzarla con las reglas del local
> —mascotas, descorche, alergias— y decidir a mano.
>
> Construí un sistema que hace ese trabajo solo, y que se detiene a preguntar
> únicamente cuando la reserva lo amerita.»

**En pantalla:** la home de la web.

---

## 0:20 – 0:50 · El disparador

Completá el formulario en vivo. Usá un comentario que toque varias políticas:

> «Cumpleaños, llevamos nuestra torta y una botella de champagne, y viene mi
> perro.»

Mientras escribís:

> «El formulario es el disparador. Cuando confirmo, la aplicación valida los
> datos, les asigna un número correlativo del día y dispara un webhook a n8n.
>
> Uso webhook y no un trigger que consulta cada minuto: así el flujo se ejecuta
> una vez por reserva real, en vez de gastar operaciones las veinticuatro horas
> buscando eventos que no llegaron.»

**Confirmá la reserva.** Mostrá la pantalla de confirmación.

---

## 0:50 – 1:30 · El orquestador

Pasá a n8n, pestaña **Executions**, abrí la ejecución que acaba de correr.

> «Acá está el flujo. Lo primero que hace es traer de Notion las veintitrés
> políticas del restaurante y armar con ellas el contexto que le va a mandar al
> modelo. Eso es RAG: el prompt no está escrito a mano, se rearma en cada
> ejecución con las políticas vigentes. Si el dueño cambia una regla en Notion,
> la próxima reserva ya se evalúa con la regla nueva.»

Señalá el nodo **Claude - Analizar**.

> «Acá llama a Claude con salida estructurada, así la respuesta viene validada
> contra un esquema y no hay que parsear texto libre.
>
> Después consulta la capacidad del turno y las reservas ya confirmadas de ese
> día para calcular la ocupación, y con todo eso el router decide si la reserva
> se confirma sola o necesita un humano.»

---

## 1:30 – 2:20 · El resultado — *el momento importante*

Abrí la reserva en Notion. **Mostrá el campo `Motivo_Revision`.**

> «Miren lo que escribió. No dice "revisar": dice exactamente qué política toca
> cada cosa.
>
> La torta de cumpleaños está permitida. El champagne no, porque contradice la
> política de descorche. Y el perro se acepta en la terraza pero no en el salón
> interior, que es justo la zona que pidió el cliente.
>
> Esa distinción es la que justifica usar un modelo de lenguaje acá: son
> matices que una regla fija no captura.»

Mostrá también `Confianza_IA` y `Estado`.

Pasá a **Telegram**.

> «Al mismo tiempo, al encargado le llega esto al celular: el detalle, el
> motivo, y el enlace directo a la reserva en Notion.»

---

## 2:20 – 2:50 · La aprobación humana

Volvé a Notion, a la reserva que dejaste preparada.

> «Acá está el punto de validación humana. El sistema no le escribió nada al
> cliente todavía: está esperando.
>
> El encargado aprueba cambiando un campo en Notion —no tiene que aprender
> ninguna herramienta nueva—. El flujo revisa ese estado cada cinco minutos, y
> si nadie contesta en cuatro horas la marca como vencida y escala el aviso.
> Ese corte es, además, lo que evita que el bucle quede girando para siempre.»

Cambiá el `Estado` a **Confirmada**. Mostrá el mail que llega.

> «Y recién ahora, con la decisión de una persona atrás, sale la confirmación al
> cliente.»

---

## 2:50 – 3:00 · Cierre

> «Todo el sistema queda registrado en Notion: las reservas, la ocupación por
> turno y los errores. Si el análisis de IA falla, la reserva no se pierde:
> entra igual marcada para revisión y queda constancia del fallo.»

---

## Si te pasás de tiempo

Cortá en este orden:

1. La explicación del webhook contra el sondeo (0:20–0:50) — está en el PDF.
2. El recorrido por los nodos de capacidad y router (1:30 aprox.).
3. El cierre: terminá justo después del mail de confirmación.

**Lo que no se corta nunca** es el bloque de 1:30 a 2:20. Ese motivo citando las
políticas por nombre es la prueba de que el RAG funciona, y es lo que distingue
la entrega de una que solamente conecta cajas.

## Errores frecuentes al grabar

- **No leas el guion.** Aprendete las tres ideas por bloque y hablá.
- **No narres lo obvio.** «Acá le doy clic a Confirmar» no aporta; decí *por qué*
  el sistema hace lo que hace.
- **No pidas disculpas por la espera.** Si el análisis tarda quince segundos,
  usá ese tiempo para explicar qué está pasando por dentro.
- **Cerrá las pestañas de más.** Una ventana con credenciales visible arruina un
  video que por lo demás está bien.
