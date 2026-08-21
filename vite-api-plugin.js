// Monta las funciones de api/ dentro del dev server de Vite.
//
// Sin esto, `npm run dev` sirve sólo el frontend y cualquier pedido muere
// con un 404 contra /api/orders — que es exactamente el síntoma de "No
// pudimos guardar tu pedido". Con esto, `npm run dev` alcanza para probar
// el flujo entero contra Notion de verdad.
//
// No reemplaza a `vercel dev`: emula lo justo del runtime de Vercel que
// usan estas funciones (req.body ya parseado, req.query, res.status().json()).

import fs from 'node:fs'
import path from 'node:path'

const API_DIR = path.resolve(process.cwd(), 'api')

async function leerBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const crudo = Buffer.concat(chunks).toString('utf8')
  if (!crudo) return {}
  try {
    return JSON.parse(crudo)
  } catch {
    return {}
  }
}

export function apiDevServer() {
  return {
    name: 'arrecife-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const [pathname, search = ''] = req.url.split('?')
        const nombre = pathname.slice('/api/'.length).replace(/\/+$/, '')
        const archivo = path.join(API_DIR, `${nombre}.js`)

        // Sólo se sirven funciones reales; _lib/ y rutas inventadas caen
        // al 404 de siempre.
        if (!archivo.startsWith(API_DIR) || nombre.startsWith('_') || !fs.existsSync(archivo)) {
          return next()
        }

        req.body = await leerBody(req)
        req.query = Object.fromEntries(new URLSearchParams(search))

        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return res
        }

        try {
          // ssrLoadModule recarga el módulo en caliente: se puede editar
          // api/ y probar sin reiniciar el server.
          const mod = await server.ssrLoadModule(archivo)
          await mod.default(req, res)
        } catch (error) {
          console.error(`[api-dev] ${nombre} falló:`, error)
          if (!res.headersSent) res.status(500).json({ error: 'error-en-la-funcion' })
        }
      })
    },
  }
}
