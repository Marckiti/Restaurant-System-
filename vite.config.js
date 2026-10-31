import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { getSharedState, updateSharedState, getDbStatus } from './src/db-sync.js'

import { Server as SocketIOServer } from 'socket.io'

function posApiPlugin() {
  return {
    name: 'pos-api-plugin',
    configureServer(server) {
      let io = null
      if (server.httpServer) {
        io = new SocketIOServer(server.httpServer, {
          cors: { origin: '*' },
        })

        io.on('connection', async (socket) => {
          try {
            const current = await getSharedState()
            socket.emit('state:update', current)
          } catch {
            // ignore
          }

          socket.on('state:update', async (incoming) => {
            try {
              const saved = await updateSharedState(incoming)
              io.emit('state:update', saved)
            } catch {
              // ignore
            }
          })
        })
      }

      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/state') {
          if (req.method === 'GET') {
            try {
              const state = await getSharedState()
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(state))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              try {
                const incoming = JSON.parse(body)
                const saved = await updateSharedState(incoming)
                if (io) {
                  io.emit('state:update', saved)
                }
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ ok: true, savedAt: saved.updatedAt }))
              } catch (err) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: err.message }))
              }
            })
            return
          }
        }

        if (req.url === '/api/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getDbStatus()))
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), posApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
