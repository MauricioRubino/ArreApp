# Entrega Final · Ecosistema de Automatización IA Autónomo para Negocios

**Caso de uso:** triage automático de reservas para el restaurante Arrecife
(La Paloma, Rocha).

Una reserva entra por la web, el sistema la valida, la razona contra las
políticas del local con un modelo de lenguaje, la registra en Notion y avisa al
encargado por Telegram. Confirma sola las que no tienen observaciones, y se
detiene a pedir aprobación humana cuando la reserva lo amerita.

| | |
| --- | --- |
| **Orquestador** | n8n Cloud — 29 nodos |
| **Base de datos** | Notion — 5 bases relacionadas |
| **Procesamiento IA** | Anthropic Claude (Opus 5) con RAG y salida estructurada |
| **Canales de salida** | Gmail al cliente · Telegram al encargado |
| **Aplicación** | React + funciones serverless en Vercel |
| **Producción** | https://arre-app.vercel.app |
| **Video demo** | https://youtu.be/lzZIMKeJYp4 |

---

## 1 · Documentación

| Archivo | Criterio de la rúbrica que cubre |
| --- | --- |
| **[entrega-final.pdf](entrega-final.pdf)** | Mapa de arquitectura · Estructuras de datos · Optimización de costos · Seguridad y resiliencia |
| [dashboard.md](dashboard.md) | Dashboard de control: vistas e indicadores |
| **[Video de presentación](https://youtu.be/lzZIMKeJYp4)** | Demostración del sistema funcionando |
| [guion-video.md](guion-video.md) | Guion cronometrado del video demo |
| [entrega-final.html](entrega-final.html) | Fuente del PDF; se regenera con `npm run docs:pdf` |

El PDF de 13 páginas es el documento principal: contiene los diagramas de los
dos flujos, el modelo de datos con los esquemas JSON de cada integración, la
matriz de decisión de modelos con costos medidos, y la documentación de
seguridad.

## 2 · Lógica del flujo

| Archivo | Contenido |
| --- | --- |
| [workflows/reservas-arrecife.json](workflows/reservas-arrecife.json) | Flujo principal de reservas — 29 nodos, con RAG, HITL y ruta de error |
| [workflows/pedidos-a-telegram.json](workflows/pedidos-a-telegram.json) | Flujo de pedidos |

> **Los secretos están reemplazados por marcadores.** El campo
> `ARRECIFE_SECRET` del nodo `Configuracion` dice `PEGA-ACA-TU-N8N-SECRET`: hay
> que completarlo al importar. Ningún archivo de esta carpeta contiene
> credenciales reales.

El código de cada nodo Code vive además como archivos JavaScript ejecutables en
[`../n8n/reservas/`](../n8n/reservas/), lo que permite probarlos contra datos
reales antes de importar nada. `node n8n/generar-workflow-reservas.mjs`
regenera el JSON a partir de ellos y verifica que ningún nodo quede sin
conexión entrante.

## 3 · Base de datos (modo lectura)

Vistas publicadas en Notion, accesibles sin cuenta ni sesión:

| Vista | Enlace |
| --- | --- |
| **Reservas** — panel de operación | https://efficacious-limburger-84e.notion.site/3c119da0dec98087b386ed1a5e21a39e?v=3c519da0dec980adad00000cf21a8216 |
| **Politicas_Arrecife** — base de conocimiento del RAG | https://efficacious-limburger-84e.notion.site/3c119da0dec980be8594c3080b55c1d6?v=3c519da0dec980c386f5000c3256eb90 |

Las 23 políticas de la tercera base son las que alimentan el análisis: se
recuperan en cada ejecución y se inyectan en el prompt. Editar una política ahí
cambia cómo se evalúa la próxima reserva, sin tocar el flujo.

## 4 · Evidencia

| Captura | Muestra |
| --- | --- |
| [01-formulario.png](capturas/01-formulario.png) | El formulario de reserva en producción |
| [03-ejecuciones.png](capturas/03-ejecuciones.png) | El historial de ejecuciones en n8n, con la última exitosa en 9,9 s |
| [06-telegram.png](capturas/06-telegram.png) | El aviso al encargado. La reserva #2 se derivó a revisión y el motivo cita las políticas una por una: mascotas, descorche, horario de cocina y pedidos fuera de la operativa |
| [08-mail-cliente.png](capturas/08-mail-cliente.png) | El correo de confirmación que recibe el cliente cuando la reserva queda `Confirmada` |

El historial incluye ejecuciones fallidas de la etapa de desarrollo: quedaron a
propósito, porque documentan las pruebas del camino infeliz.

Los indicadores del sistema se pueden recalcular en cualquier momento contra la
API con `npm run notion:kpis`, lo que permite verificar que las vistas
publicadas muestren los mismos números.

## 5 · Cómo está armado el sistema

```
Reserva nueva (Webhook)
  └ Configuración ················ IDs, plazos y rango de fechas en un solo lugar
      └ Notion: políticas activas → Preparar análisis → Claude (RAG)
          └ Notion: turno del día → Notion: reservas confirmadas
              └ Decidir ·········· router: confianza, política, cupo, duplicado
                  ├ duplicada → descartar
                  └ Notion: crear reserva (vinculada a su turno)
                       ├ si falló la IA → Notion: registrar en Errores
                       └ Telegram al encargado
                            ├ automática → Gmail al cliente
                            └ a revisar → HITL: esperar · releer estado
                                            ├ Confirmada → Gmail al cliente
                                            ├ Rechazada  → Gmail de disculpa
                                            └ 4 h sin respuesta → Vencida
```

**Requisitos de arquitectura cubiertos**

- **Trigger inteligente:** webhook, no sondeo. Una ejecución por evento real.
- **Prompt dinámico:** se rearma en cada corrida con las políticas vigentes.
- **Rutas de error:** validación previa, registro en la base `Errores` cuando
  falla la IA, y degradación controlada en los canales de salida.
- **Human-in-the-loop:** el sistema no contacta al cliente hasta que una persona
  decide, moviendo un campo en Notion.
- **Sin datos hardcodeados:** identificadores, plazos y destinatarios salen del
  nodo `Configuración`, que los lee de variables de entorno.
- **Guarda contra bucle infinito:** el sondeo de aprobación vence a las 4 horas.
- **Tipos correctos en los filtros:** booleano con booleano, número con número.
