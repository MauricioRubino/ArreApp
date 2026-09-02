# Capturas de evidencia

Guardá acá los PNG. Los nombres sugeridos son los que referencia el índice.

| Archivo | Qué mostrar |
| --- | --- |
| ~~`01-formulario.png`~~ | ✅ listo — el formulario de reserva |
| `02-workflow.png` | El flujo completo en el editor de n8n |
| ~~`03-ejecuciones.png`~~ | ✅ listo — historial de ejecuciones en n8n |
| `04-analisis-ia.png` | La salida del nodo `Claude - Analizar`, con el JSON validado |
| `05-notion-reserva.png` | La reserva en Notion con `Motivo_Revision` citando las políticas |
| `06-telegram.png` | El aviso recibido en Telegram |
| `07-aprobacion.png` | El cambio de `Estado` a `Confirmada` en Notion |
| `08-mail-cliente.png` | El correo de confirmación que le llega al cliente |
| `09-camino-infeliz.png` | Un envío incompleto rechazado con el detalle de campos faltantes |
| `10-dashboard.png` | La vista pública de Notion con los indicadores |

**La más importante es la 05.** Es la que demuestra que el RAG funciona: el
motivo escrito por el modelo distingue qué política toca cada cosa, en vez de
decir sólo «requiere revisión».

## Antes de capturar

- Borrá las reservas de prueba con nombres tipo `PRUEBA — borrar`.
- No abras el nodo `Configuracion`: muestra los identificadores de las bases.
- No entres a la sección Credentials de n8n.
- Revisá que no queden visibles teléfonos ni correos de personas reales.
