# Dashboard de control

Panel de monitoreo del sistema, en Notion. Se arma sobre las bases que el
workflow ya escribe: no hay una base aparte de métricas.

El destinatario es el encargado del restaurante mirando el celular entre mesas,
así que la vista por defecto tiene que ser la más chica posible.

## Verificar los números sin abrir Notion

```bash
npm run notion:kpis
```

Calcula los mismos indicadores directamente contra la API. Sirve para confirmar
que las vistas compartidas muestran lo correcto, y para generar evidencia sin
leer el tablero a mano. Pagina de a 100 filas, así que no miente cuando la base
crece.

## Las cinco vistas

Todas salen de la base **Reservas**, salvo la última.

### 1 · Hoy — vista por defecto

- Tipo: **Tabla**
- Filtro: `Fecha` → *Is* → *Today*
- Orden: `Fecha` ascendente
- Propiedades visibles: `Nombre_Cliente`, `Fecha`, `Personas`, `Zona`, `Estado`, `Telefono`
- Esconder: `Confianza_IA`, `Motivo_Revision`, `Politica_Relacionada`, `Numero`

Es la única que el encargado necesita durante el servicio.

### 2 · Esperando aprobación

- Tipo: **Tabla**
- Filtro: `Estado` → *Is* → `Esperando_Aprobacion`
- Orden: `Fecha` ascendente
- Propiedades visibles: `Nombre_Cliente`, `Personas`, `Fecha`, `Motivo_Revision`, `Confianza_IA`

La cola de decisiones. Aprobar es cambiar `Estado` a `Confirmada`; rechazar,
a `Rechazada`. El flujo lo detecta dentro de los 5 minutos.

### 3 · Por estado

- Tipo: **Tablero**, agrupado por `Estado`
- Sin filtro
- En la tarjeta: `Personas`, `Fecha`, `Requiere_Revision`

Muestra de un vistazo la proporción entre lo resuelto solo y lo que necesitó
un humano — que es el indicador de si el sistema está ganando tiempo.

### 4 · Ocupación

- Tipo: **Calendario** por `Fecha`
- Filtro: `Estado` → *Is* → `Confirmada`

Carga real por día. Cruzándola con `Capacidad_Total` de **Turnos** se ve
cuánto margen queda.

### 5 · Errores del sistema

- Base: **Errores**
- Tipo: **Tabla**
- Filtro: `Resuelto` → *Is not checked*
- Orden: `Timestamp` descendente

Debería estar vacía. Cada fila es un análisis que no se pudo hacer, con el
enlace a la reserva que lo provocó.

## Indicadores

| Indicador | Cómo se calcula | Qué significa si se mueve |
| --- | --- | --- |
| **Tasa de automatización** | reservas con `Requiere_Revision` sin marcar ÷ total | Si baja, las políticas se volvieron demasiado restrictivas o el público cambió |
| **Tasa de errores** | filas en `Errores` ÷ reservas procesadas | Si sube, hay un problema de integración, no de negocio |
| **Confianza media** | promedio de `Confianza_IA` | Una caída sostenida indica que las políticas quedaron desactualizadas frente a lo que la gente pregunta |
| **Vencidas** | `Estado` = `Vencida` | Reservas que nadie atendió en 4 horas: mide el tiempo de respuesta humano, no el del sistema |
| **Ocupación por turno** | suma de `Personas` confirmadas ÷ `Capacidad_Total` | Saturación real del salón |

## Publicar la vista

En cada base: **Share** → **Publish to web** → activar. Copiar el enlace y
dejarlo en el README del repositorio.

Conviene publicar la vista **Por estado** y la de **Errores**: la primera es el
panel de operación y la segunda la salud del sistema.

> **Antes de publicar.** Una vista pública expone nombres, teléfonos y correos
> de clientes reales a cualquiera con el enlace. Para la entrega conviene
> publicar con datos de prueba, o crear vistas que escondan `Telefono` y
> `Email` — Notion respeta las propiedades ocultas en la versión publicada.

## Medición de referencia

Salida de `npm run notion:kpis` al cierre del desarrollo. Los números incluyen
las reservas de prueba, así que sirven para verificar el mecanismo, no como
estadística del negocio:

```
Reservas procesadas                      20
Resueltas automáticamente                 7   35,0 %
Derivadas a revisión humana              13   65,0 %

  Confirmada                             13   65,0 %
  Rechazada                               5   25,0 %
  Esperando_Aprobacion                    2   10,0 %

Confianza media                        0,79
Análisis con confianza < 0,7              5
Análisis fallidos (confianza 0)           1

Errores registrados                       0
Tasa de error                          0,0 %
```

La proporción de revisión humana es alta porque las pruebas se concentraron
deliberadamente en casos conflictivos — mascotas, descorche, alergias, grupos
grandes. Con reservas corrientes la relación se invierte.
