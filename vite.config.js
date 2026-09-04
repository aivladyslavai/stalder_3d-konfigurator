import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { processOfferRequest, readJsonBody } from './api/offer.js'

function offerApiPlugin(env) {
  const handle = async (req, res, next) => {
    const path = req.url?.split('?')[0]
    if (path !== '/api/offer') return next()

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    try {
      const body = await readJsonBody(req)
      const result = await processOfferRequest(body, env)
      res.statusCode = result.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result.body))
    } catch (err) {
      console.error('[offer]', err)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Senden fehlgeschlagen. Bitte später erneut versuchen.' }))
    }
  }

  return {
    name: 'offer-api',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), offerApiPlugin(env)],
  }
})
