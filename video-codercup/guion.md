# Guion — CoderCup · 2:45

Video de concurso. La diferencia con el de la entrega del curso: allá había que
demostrar que se cumple una rúbrica, acá hay que hacer que alguien que ve
cuarenta videos seguidos se acuerde del tuyo.

**La idea que tiene que quedar:** no automaticé al encargado, le saqué de encima
lo que no necesitaba decidir.

---

## Materiales

**Placas** en [`placas/`](placas/) — PNG de 1920×1080 listos para cortar:

| Placa | Cuándo entra |
| --- | --- |
| `01-titulo.png` | apertura |
| `02-antes-despues.png` | 1:05 · transición a reservas |
| `03-arquitectura.png` | 0:50 · cómo está hecho |
| `04-rag.png` | 1:45 · el momento clave |
| `05-numeros.png` | 2:20 |
| `06-cierre.png` | 2:35 |

Se regeneran con `node video-codercup/generar-placas.mjs` si cambia algún dato.

**Grabaciones de pantalla que necesitás:**

1. Carta → agregar dos platos → carrito
2. Checkout: elegir *Scotiabank 25%* y que se vea bajar el total
3. Formulario de reserva completándose
4. n8n: una ejecución corriendo, con los nodos poniéndose verdes
5. Notion: la reserva con el `Motivo_Revision` desplegado
6. Telegram: el aviso llegando
7. Notion: cambiar `Estado` a `Confirmada`
8. El mail de confirmación

---

## 0:00 – 0:18 · Apertura

**Pantalla:** `01-titulo.png`, luego corte a la home de la app.

> «Arrecife es una parrillada de La Paloma. Abrió en 1986 y hoy recibe pedidos
> y reservas por internet.
>
> Hasta hace poco, alguien leía cada reserva a mano y se preguntaba lo mismo:
> ¿trae un perro? ¿puede traer su propia bebida? ¿entra ese grupo un sábado?»

Ritmo rápido. Nada de "hola, mi nombre es". El problema primero.

---

## 0:18 – 0:45 · La app · pedidos

**Pantalla:** carta → agregar platos → checkout.

> «La app tiene la carta completa, carrito y checkout con mapa de entrega.
>
> Y algo que parece un detalle: el restaurante tiene promociones bancarias.
> Cuando el cliente elige el medio de pago…»

**Elegí Scotiabank 25%. Que se vea el total bajando.**

> «…el descuento se calcula en el momento. Y se vuelve a calcular en el
> servidor, porque lo que manda el navegador no se considera confiable.»

---

## 0:45 – 1:05 · Qué pasa al confirmar

**Pantalla:** `03-arquitectura.png`.

> «Al confirmar, el pedido pasa por un backend propio que revalida precios,
> horario y zona de entrega. Recién ahí se guarda en Notion, y desde ahí n8n le
> avisa al encargado por Telegram.
>
> Si Notion no puede guardar, al cliente no se le confirma nada. Prefiero que
> reintente antes de que se quede esperando comida que nadie va a cocinar.»

---

## 1:05 – 1:20 · El giro

**Pantalla:** `02-antes-despues.png`.

> «Con las reservas el problema es otro. No alcanza con guardarlas: hay que
> entenderlas.»

Pausá un segundo acá. Es el pivote del video.

---

## 1:20 – 2:00 · La reserva y la IA

**Pantalla:** el formulario, escribiendo el comentario en vivo.

> «Escribo una reserva como la escribiría un cliente: cumpleaños, llevamos
> nuestra torta y una botella de champagne, y viene mi perro.»

**Confirmá. Cortá a n8n con la ejecución corriendo.**

> «El flujo trae de Notion las veintitrés políticas reales del restaurante y
> arma con ellas el contexto que le manda al modelo. El prompt no está escrito
> a mano: se rearma en cada ejecución. Si el dueño cambia una regla en Notion,
> la próxima reserva ya se evalúa con la regla nueva.»

**Corte a `04-rag.png`.**

> «Y esto es lo que devuelve.
>
> No dice "revisar". Dice que la torta está permitida, que el champagne
> contradice la política de descorche, y que el perro se acepta en la terraza
> pero no en el salón — que es justo la zona que pidió.»

Dejá la placa cuatro o cinco segundos. Que se lea.

---

## 2:00 – 2:25 · La decisión humana

**Pantalla:** Telegram con el aviso, después Notion.

> «El encargado recibe eso en el celular. Y acá está la parte que más me
> importa: el sistema **no le escribió nada al cliente**. Está esperando.
>
> Aprueba cambiando un campo en Notion. No tiene que aprender ninguna
> herramienta nueva.»

**Cambiá el `Estado` a `Confirmada`. Corte al mail que llega.**

> «Recién ahora, con una persona atrás de la decisión, sale la confirmación.»

---

## 2:25 – 2:45 · Cierre

**Pantalla:** `05-numeros.png`, después `06-cierre.png`.

> «Veintinueve nodos, veintitrés políticas, cinco bases relacionadas. Diez
> segundos de análisis y menos de tres centavos de dólar por reserva.
>
> No automaticé al encargado. Le saqué de encima lo que no necesitaba decidir.»

Fin. No agregues "gracias por ver".

---

## Cómo grabarlo

**Grabá la pantalla y la voz por separado.** Es la diferencia más grande entre
un video que se ve amateur y uno que no. Grabá primero las ocho capturas sin
hablar, después la voz leyendo el guion, y recién ahí montás.

**El análisis tarda unos diez segundos.** No los dejes en el video: cortá y usá
la placa `04-rag.png` para tapar la espera.

**Ensayá una vez con cronómetro.** El guion entra en 2:45 hablando a ritmo
normal. Si te apurás se nota, y si te pasás de 3:00 puede quedar fuera de bases.

**Ocultá:** el nodo `Configuracion` abierto (muestra los IDs de las bases), la
sección Credentials de n8n, y cualquier teléfono o correo real en Notion.

---

## Si tenés que recortar

En este orden:

1. La parte de precios y descuento (0:18–0:45) — bajala a una frase.
2. La placa de arquitectura (0:45–1:05) — mostrala tres segundos sin explicarla.
3. Los números del cierre.

**No se corta nunca** el bloque 1:20–2:25: el análisis citando las políticas y
el sistema deteniéndose a preguntar. Todo lo demás es contexto de eso.

## Lo que no conviene decir

- **«Usé inteligencia artificial»** — todos los videos van a decir lo mismo.
  Mostrá qué decidió, no qué tecnología usaste.
- **«Le pegué a la API de…»** — el jurado no está evaluando integraciones,
  está evaluando criterio.
- Enumerar herramientas sin decir qué resuelve cada una. La placa de
  arquitectura ya las muestra; vos explicá por qué están.
