// Genera las placas del video como PNG de 1920x1080, listas para cortar
// en la edición.
//
//   node video-codercup/generar-placas.mjs
//
// Se renderizan con Edge o Chrome en modo headless: permite versionar el
// diseño como HTML y regenerarlas si cambia un dato, en vez de mantener
// imágenes sueltas que se desactualizan.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const salida = path.join(dir, 'placas')
fs.mkdirSync(salida, { recursive: true })

const NAVEGADOR = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(fs.existsSync)

if (!NAVEGADOR) throw new Error('No se encontró Edge ni Chrome para renderizar')

// Paleta de la carta impresa de Arrecife, invertida para video: fondo
// oscuro que corta bien contra las capturas de la app, que son color crema.
const BASE = `
  @font-face { font-family: x; src: local("Segoe UI"); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1920px; height: 1080px; overflow: hidden; }
  body {
    background: #221a13;
    color: #f4ecdb;
    font-family: "Segoe UI", Inter, system-ui, sans-serif;
    display: flex; flex-direction: column;
    justify-content: center;
    padding: 0 150px;
    position: relative;
  }
  .marca {
    position: absolute; top: 70px; left: 150px;
    font-size: 20px; letter-spacing: 7px; text-transform: uppercase;
    color: #c17055; font-weight: 600;
  }
  .pie {
    position: absolute; bottom: 60px; left: 150px;
    font-size: 20px; color: #8a7c6c;
  }
  h1 { font-size: 104px; line-height: 1.02; letter-spacing: -3px; font-weight: 700; }
  h2 { font-size: 68px; line-height: 1.1; letter-spacing: -1.5px; font-weight: 600; }
  .sub { font-size: 34px; color: #b9ab99; line-height: 1.45; margin-top: 34px; max-width: 1180px; }
  .rojo { color: #e0674f; }
  .verde { color: #4fc4b4; }
`

const placas = [
  {
    archivo: '01-titulo',
    html: `
      <div class="marca">Arrecife · La Paloma, Rocha · desde 1986</div>
      <h1>El restaurante<br>que <span class="rojo">lee</span> sus reservas<br>antes que vos.</h1>
      <p class="sub">Pedidos y reservas por la web, razonados contra las reglas
      del local por un modelo de lenguaje.</p>
      <div class="pie">arre-app.vercel.app</div>`,
  },
  {
    archivo: '02-antes-despues',
    html: `
      <div class="marca">El problema</div>
      <div style="display:flex; gap:110px; align-items:flex-start">
        <div style="flex:1">
          <div style="font-size:24px;letter-spacing:4px;text-transform:uppercase;color:#8a7c6c;margin-bottom:30px">Antes</div>
          <div style="font-size:40px;line-height:1.5;color:#b9ab99">
            Cada reserva la leía una persona.<br>
            ¿Trae un perro?<br>
            ¿Puede traer su propia bebida?<br>
            ¿Entra ese grupo el sábado?<br><br>
            <span style="color:#8a7c6c">Todo de memoria, en medio del servicio.</span>
          </div>
        </div>
        <div style="width:2px;height:420px;background:#3d3128"></div>
        <div style="flex:1">
          <div style="font-size:24px;letter-spacing:4px;text-transform:uppercase;color:#e0674f;margin-bottom:30px">Ahora</div>
          <div style="font-size:40px;line-height:1.5">
            El sistema cruza cada reserva<br>
            contra <span class="rojo">23 políticas reales</span><br>
            del restaurante.<br><br>
            Confirma sola las simples.<br>
            <span class="verde">Pregunta sólo cuando importa.</span>
          </div>
        </div>
      </div>`,
  },
  {
    archivo: '03-arquitectura',
    html: `
      <div class="marca">Cómo está hecho</div>
      <svg viewBox="0 0 1600 560" style="width:100%">
        <defs><marker id="f" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
          <path d="M0,1 L8,4.5 L0,8 z" fill="#8a7c6c"/></marker></defs>

        <text x="0" y="34" font-size="24" fill="#c17055" letter-spacing="3">APLICACIÓN</text>
        <rect x="0" y="52" width="290" height="130" rx="10" fill="#2e241b" stroke="#4a3c30" stroke-width="2"/>
        <text x="145" y="105" font-size="32" fill="#f4ecdb" text-anchor="middle">React · Vercel</text>
        <text x="145" y="145" font-size="23" fill="#8a7c6c" text-anchor="middle">carta · carrito · reservas</text>

        <text x="360" y="34" font-size="24" fill="#c17055" letter-spacing="3">VALIDACIÓN</text>
        <rect x="360" y="52" width="290" height="130" rx="10" fill="#2e241b" stroke="#e0674f" stroke-width="2.5"/>
        <text x="505" y="98" font-size="28" fill="#f4ecdb" text-anchor="middle">/api/orders</text>
        <text x="505" y="134" font-size="22" fill="#8a7c6c" text-anchor="middle">precios · horario · zona</text>
        <text x="505" y="162" font-size="22" fill="#8a7c6c" text-anchor="middle">nada se confía al navegador</text>

        <text x="720" y="34" font-size="24" fill="#c17055" letter-spacing="3">ORQUESTADOR</text>
        <rect x="720" y="52" width="290" height="130" rx="10" fill="#2e241b" stroke="#4a3c30" stroke-width="2"/>
        <text x="865" y="105" font-size="32" fill="#f4ecdb" text-anchor="middle">n8n</text>
        <text x="865" y="145" font-size="23" fill="#8a7c6c" text-anchor="middle">29 nodos</text>

        <text x="1080" y="34" font-size="24" fill="#c17055" letter-spacing="3">RAZONAMIENTO</text>
        <rect x="1080" y="52" width="290" height="130" rx="10" fill="#3a2119" stroke="#e0674f" stroke-width="2.5"/>
        <text x="1225" y="105" font-size="32" fill="#f4ecdb" text-anchor="middle">Claude</text>
        <text x="1225" y="145" font-size="23" fill="#d69c88" text-anchor="middle">RAG + salida estructurada</text>

        <line x1="292" y1="117" x2="354" y2="117" stroke="#8a7c6c" stroke-width="2.5" marker-end="url(#f)"/>
        <line x1="652" y1="117" x2="714" y2="117" stroke="#8a7c6c" stroke-width="2.5" marker-end="url(#f)"/>
        <line x1="1012" y1="117" x2="1074" y2="117" stroke="#8a7c6c" stroke-width="2.5" marker-end="url(#f)"/>

        <text x="0" y="286" font-size="24" fill="#c17055" letter-spacing="3">MEMORIA</text>
        <rect x="0" y="304" width="470" height="120" rx="10" fill="#2e241b" stroke="#4fc4b4" stroke-width="2"/>
        <text x="235" y="352" font-size="30" fill="#4fc4b4" text-anchor="middle">Notion · 5 bases</text>
        <text x="235" y="392" font-size="22" fill="#8a7c6c" text-anchor="middle">pedidos · reservas · turnos · políticas · errores</text>

        <text x="560" y="286" font-size="24" fill="#c17055" letter-spacing="3">DECISIÓN HUMANA</text>
        <rect x="560" y="304" width="470" height="120" rx="10" fill="#2e241b" stroke="#e0674f" stroke-width="2.5" stroke-dasharray="8 5"/>
        <text x="795" y="352" font-size="30" fill="#f4ecdb" text-anchor="middle">El encargado aprueba</text>
        <text x="795" y="392" font-size="22" fill="#8a7c6c" text-anchor="middle">moviendo un campo en Notion</text>

        <text x="1120" y="286" font-size="24" fill="#c17055" letter-spacing="3">SALIDA</text>
        <rect x="1120" y="304" width="250" height="120" rx="10" fill="#2e241b" stroke="#4a3c30" stroke-width="2"/>
        <text x="1245" y="352" font-size="28" fill="#f4ecdb" text-anchor="middle">Telegram</text>
        <text x="1245" y="392" font-size="28" fill="#f4ecdb" text-anchor="middle">Gmail</text>

        <path d="M865,184 L865,244 L235,244 L235,298" fill="none" stroke="#8a7c6c" stroke-width="2.5" marker-end="url(#f)"/>
        <line x1="472" y1="364" x2="554" y2="364" stroke="#8a7c6c" stroke-width="2.5" marker-end="url(#f)"/>
        <line x1="1032" y1="364" x2="1114" y2="364" stroke="#8a7c6c" stroke-width="2.5" marker-end="url(#f)"/>
      </svg>`,
  },
  {
    archivo: '04-rag',
    html: `
      <div class="marca">Lo que escribe la IA</div>
      <div style="font-size:30px;color:#8a7c6c;margin-bottom:26px">
        El cliente escribió: <span style="color:#f4ecdb">«Cumpleaños, llevamos nuestra torta
        y una botella de champagne. Viene mi perro.»</span>
      </div>
      <div style="border-left:6px solid #e0674f;padding:34px 44px;background:#2a201700;font-size:35px;line-height:1.55">
        <span class="verde">La torta externa está permitida.</span><br>
        <span class="rojo">El champagne contradice la política de descorche.</span><br>
        <span class="rojo">El perro se acepta en terraza, no en el salón</span>
        <span style="color:#8a7c6c">— y pidió salón.</span>
      </div>
      <div style="margin-top:44px;font-size:28px;color:#8a7c6c">
        Confianza <span style="color:#f4ecdb">0,94</span>
        &nbsp;·&nbsp; Políticas citadas <span style="color:#f4ecdb">3</span>
        &nbsp;·&nbsp; Decisión <span class="rojo">revisión humana</span>
      </div>`,
  },
  {
    archivo: '05-numeros',
    html: `
      <div class="marca">En producción</div>
      <div style="display:flex;gap:90px;flex-wrap:wrap;max-width:1500px">
        ${[
          ['29', 'nodos orquestados'],
          ['23', 'políticas en el RAG'],
          ['5', 'bases relacionadas'],
          ['~10 s', 'de análisis por reserva'],
          ['$0,028', 'costo por reserva'],
          ['0', 'mensajes al cliente sin decisión humana'],
        ]
          .map(
            ([n, t]) => `<div style="min-width:390px;margin-bottom:56px">
              <div style="font-size:88px;font-weight:700;color:#e0674f;line-height:1">${n}</div>
              <div style="font-size:27px;color:#b9ab99;margin-top:12px">${t}</div>
            </div>`
          )
          .join('')}
      </div>`,
  },
  {
    archivo: '06-cierre',
    html: `
      <div class="marca">Arrecife</div>
      <h2>No automaticé al encargado.<br>Le saqué de encima<br>lo que <span class="rojo">no</span> necesitaba decidir.</h2>
      <p class="sub">El sistema resuelve solo lo simple y se detiene, siempre,
      antes de comprometer una mesa que el restaurante no quiere dar.</p>
      <div class="pie">github.com/MauricioRubino/ArreApp · arre-app.vercel.app</div>`,
  },
]

for (const placa of placas) {
  const archivoHtml = path.join(salida, `${placa.archivo}.html`)
  fs.writeFileSync(
    archivoHtml,
    `<!doctype html><html lang="es"><meta charset="utf-8"><style>${BASE}</style><body>${placa.html}</body></html>`
  )
  execFileSync(NAVEGADOR, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1920,1080',
    `--screenshot=${path.join(salida, placa.archivo + '.png')}`,
    'file:///' + archivoHtml.replace(/\\/g, '/'),
  ])
  console.log('  generada', placa.archivo + '.png')
}

console.log(`\n${placas.length} placas en ${path.relative(process.cwd(), salida)}`)
