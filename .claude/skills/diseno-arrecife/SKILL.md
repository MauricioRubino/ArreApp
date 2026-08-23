---
name: diseno-arrecife
description: Sistema visual de la app de Arrecife y reglas para cambiar la UI. Usar SIEMPRE antes de tocar cualquier archivo de src/components/, src/pages/ o src/index.css, o al agregar pantallas, formularios, botones y estilos. Cubre la paleta, la tipografía, el layout de página, las reglas mobile-first que no se negocian, y cómo verificar un cambio visual en el navegador en vez de suponer.
---

# Diseño de Arrecife

App de un restaurante parrillada de La Paloma (Rocha, desde 1986). **Se usa
sobre todo desde el celular**, muchas veces por turistas parados en la calle
con una mano ocupada. Eso manda sobre cualquier consideración estética.

La identidad visual no es inventada: la paleta y las tipografías salen de la
carta impresa del restaurante. Al cambiar algo, la pregunta no es "¿queda
lindo?" sino "¿sigue pareciendo Arrecife?".

## Paleta

Definida como tokens de Tailwind v4 en `src/index.css`. **Usar siempre el
token, nunca un hex suelto.**

| Token | Hex | Para qué |
| --- | --- | --- |
| `crema` | `#f4ecdb` | fondo de la página |
| `crema-soft` | `#efe4cd` | fondo de tarjetas y campos, siempre con opacidad (`/40`, `/60`) |
| `tinta` | `#2a2119` | texto principal |
| `tinta-dim` | `#6b6155` | texto secundario, etiquetas, descripciones |
| `title` | `#a63a2c` | rojo teja de la marca: precios, botones primarios, errores |
| `title-soft` | `#c17055` | hover de los botones primarios |
| `linea` | `#d8c7ac` | bordes y separadores |
| `salvia` | `#93a48f` | acentos suaves (ícono vegetariano, notas de guarnición) |
| `teal` | `#1c8b7f` | confirmaciones y descuentos a favor del cliente |
| `arcilla` | `#c98c74` | acento cálido, poco usado |

`title` hace doble función de marca y de error. No es un problema —el rojo
teja lee como "atención" igual que como "precio"— pero significa que un
mensaje de error nunca debe depender solo del color: siempre lleva texto.

## Tipografía

- `font-display` (Playfair Display) — títulos de página, nombres de platos,
  totales grandes. Casi siempre con `tracking-wide`.
- `font-body` (Inter) — todo lo demás. Es el default del `body`.

Las etiquetas de formulario van en versalitas: `text-xs uppercase
tracking-wide text-tinta-dim`.

## Layout de página

Las siete páginas comparten el mismo contenedor. **No lo cambies en una sola**
o la app deja de sentirse continua al navegar:

```jsx
<div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
```

La home es la excepción deliberada: `max-w-4xl` y más aire vertical
(`py-16 sm:py-24`), porque es una portada.

Si hace falta más respiro lateral en mobile, subí el gutter **en las siete a
la vez**, no en la pantalla que estés tocando.

## Reglas mobile-first que no se negocian

Estas salen de bugs reales que estuvieron en producción, no de teoría.

**1. Nada que se revele con hover.** En un celular no hay hover. Un botón con
`opacity-0 group-hover:opacity-100` es un botón **invisible**: el de "Agregar"
de la carta estuvo así, y la única forma de pedir era tocar a ciegas donde uno
adivinaba. Si un control es necesario, se ve siempre. Como mucho, se atenúa
(`opacity-60`) y se refuerza en hover.

**2. Área táctil mínima 44×44px.** Los controles de 26px de alto con texto de
11px se fallan con el pulgar. Para íconos, `w-11 h-11`.

**3. Todo control necesita `aria-label` si su texto no lo identifica.** En la
carta hay 200 botones que dicen "Agregar": con lector de pantalla eso no
significa nada. Va `aria-label={\`Agregar ${item.name}\`}`.

**4. El nombre de un plato puede envolver.** No le pongas `shrink-0` a un
título dentro de un flex: empuja el precio fuera de la pantalla. El nombre más
largo de la carta es "Papa al plomo con manteca de hierbas y oliva" — probá
con ese.

**5. Nunca scroll horizontal.** Verificalo, no lo supongas (ver más abajo).

## Patrones existentes

**Botón primario** — el rojo teja lleno:

```
bg-title hover:bg-title-soft text-crema font-medium tracking-wide
rounded-lg px-6 py-3 transition-colors
```

Cuando puede estar deshabilitado, sumar `disabled:opacity-40
disabled:cursor-not-allowed`.

**Tarjeta / caja de contenido:**

```
border border-linea rounded-lg bg-crema-soft/40
```

**Campo de formulario** — vive como `inputClass` en cada formulario:

```
w-full rounded-lg border border-linea bg-crema-soft/40 px-3.5 py-2.5
text-sm text-tinta placeholder:text-tinta-dim/60
focus:outline-none focus:border-title transition-colors
```

### Duplicaciones conocidas

`inputClass` está copiado en `CheckoutForm.jsx`, `ReservaForm.jsx` y
`PhoneInput.jsx`; `labelClass` y el componente `Field` en los dos primeros. El
botón primario tiene cuatro variantes que difieren solo en el `disabled:` y
los márgenes.

Si vas a tocar cualquiera de esos, **es el momento de unificarlos** en
`src/components/forms/`. Si no los estás tocando, dejalos: no es una deuda
urgente.

## Verificar, no suponer

Hay dev server y herramientas de navegador. Un cambio visual no está listo
hasta que se midió. Levantar con `preview_start` (nombre `dev`) y:

- `resize_window` a `mobile` (375px) y **recargar** — hay lógica que corre al
  cargar.
- Medir de verdad los controles nuevos:

```js
const b = document.querySelector('button[aria-label^="Agregar"]');
const cs = getComputedStyle(b), r = b.getBoundingClientRect();
({ opacity: cs.opacity, alto: r.height, ancho: r.width })
```

- Chequear overflow: `document.documentElement.scrollWidth > innerWidth` tiene
  que dar `false`.
- Probar el caso más largo de la carta, no el más corto.
- `read_console_messages` con `onlyErrors` después de cada cambio.

Si el navegador no está visible para sacar captura, medir con
`javascript_tool` igual sirve —y de hecho es más preciso que mirar.

## Trampas del proyecto

**Vite cachea módulos.** Al agregar un `export` nuevo a un archivo de `data/`,
la página puede quedar en blanco con un `SyntaxError` de export inexistente
aunque el build pase. Se arregla borrando `node_modules/.vite` y reiniciando.

**El checkout se bloquea fuera de horario.** El botón "Confirmar pedido" está
deshabilitado salvo entre 12:00–16:00 y 19:30–00:00 de Montevideo. Si estás
probando de madrugada no es un bug tuyo.

**Sin backend no hay pedido.** `npm run dev` sí levanta las funciones de
`api/`, pero si faltan las variables de Notion la app muestra "no pudimos
guardar tu pedido". Es el comportamiento correcto.

## Qué no hacer

- Meter una librería de componentes. La app es Tailwind puro y esa coherencia
  es parte de la identidad.
- Cambiar la paleta o las tipografías sin que lo pida el dueño: salen de la
  carta impresa.
- Poner un color como único portador de información (error, estado, stock).
- Cambiar el layout de una sola página.
- Dar por bueno un cambio mobile sin haberlo mirado a 375px.
