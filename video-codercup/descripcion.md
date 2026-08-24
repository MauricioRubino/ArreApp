# Descripción del problema y la solución

Textos para el formulario de postulación. Elegí según el límite del campo.

---

## Versión larga (~2.100 caracteres)

Arrecife es una parrillada de La Paloma, Rocha, abierta desde 1986. Recibe
pedidos de delivery y reservas de mesa a través de su web, y hasta hace poco
todo lo que llegaba lo procesaba una persona a mano.

Con los pedidos el problema era operativo: el aviso al restaurante dependía de
plantillas de WhatsApp aprobadas por Meta y de una ventana de 24 horas, y los
descuentos por medio de pago eran una etiqueta decorativa que nadie calculaba.

Con las reservas el problema era más difícil, porque no alcanza con guardarlas:
hay que entenderlas. Cada comentario libre podía esconder algo que el
restaurante tiene reglado — una mascota, una bebida propia, una alergia, un
cumpleaños con torta externa, un grupo que no entra en el turno. El encargado
tenía que cruzar cada reserva contra esas reglas de memoria, en medio del
servicio. Es lento, es inconsistente entre personas, y los errores se pagan con
el cliente ya sentado en el salón.

Construí un ecosistema que resuelve las dos puntas. La aplicación valida todo
del lado del servidor: recalcula los precios contra la carta real, aplica los
descuentos bancarios y verifica horario y zona de entrega, sin confiar en lo que
manda el navegador. Los pedidos se registran en Notion y n8n le avisa al
encargado por Telegram.

Las reservas pasan por un flujo de 29 nodos en n8n donde un modelo de lenguaje
cruza el comentario del cliente contra las 23 políticas reales del local,
guardadas en Notion y recuperadas en cada ejecución. El prompt no está escrito a
mano: se rearma cada vez, así que si el dueño edita una regla, la próxima
reserva ya se evalúa con la regla nueva. En paralelo, el sistema calcula la
ocupación del turno y detecta duplicados con lógica determinista, porque para
eso un modelo sería más caro y menos confiable.

El resultado no es una reserva marcada como "revisar", sino una explicación:
qué política toca cada pedido del cliente y cuál no. Las reservas sin
observaciones se confirman solas; las que tocan una regla se detienen y esperan
a que una persona decida, moviendo un campo en Notion. Ningún cliente recibe una
confirmación sin que un humano la haya autorizado.

Cada análisis toma unos diez segundos y cuesta menos de tres centavos de dólar.

---

## Versión corta (~980 caracteres)

Arrecife es una parrillada de La Paloma abierta desde 1986. Recibe pedidos y
reservas por su web, y hasta hace poco una persona leía cada reserva a mano y la
cruzaba de memoria con las reglas del local: mascotas, bebida propia, alergias,
capacidad del turno. Lento, inconsistente, y con errores que se pagan con el
cliente ya sentado.

Construí un sistema que valida todo del lado del servidor —precios, descuentos
bancarios, horario y zona— y que, para las reservas, cruza el comentario del
cliente contra las 23 políticas reales del restaurante usando un modelo de
lenguaje con RAG sobre Notion. El prompt se rearma en cada ejecución, así que
editar una regla cambia cómo se evalúa la próxima reserva.

El resultado no es "revisar": es una explicación de qué política toca cada
pedido. Las reservas simples se confirman solas; las que tocan una regla se
detienen y esperan a que el encargado decida moviendo un campo en Notion. Ningún
cliente recibe confirmación sin decisión humana.

---

## Versión mínima (~520 caracteres)

Un restaurante de La Paloma recibe pedidos y reservas por su web. Cada reserva
la leía una persona a mano, cruzándola de memoria con las reglas del local:
mascotas, descorche, alergias, capacidad del turno.

Construí un sistema que valida los pedidos del lado del servidor y que, para las
reservas, cruza el comentario del cliente contra las 23 políticas reales del
restaurante con un modelo de lenguaje. No devuelve "revisar": explica qué
política toca cada pedido. Las simples se confirman solas; las que tocan una
regla esperan a que una persona decida. Ningún cliente recibe confirmación sin
decisión humana.
