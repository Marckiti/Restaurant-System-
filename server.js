import express from 'express'
import http from 'node:http'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server } from 'socket.io'
import { getSharedState, updateSharedState, getDbStatus } from './src/db-sync.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

app.use(express.json())

app.get('/api/status', (_, res) => {
  res.json(getDbStatus())
})

app.get('/api/state', async (_, res) => {
  try {
    const state = await getSharedState()
    res.json(state)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/state', async (req, res) => {
  try {
    const saved = await updateSharedState(req.body)
    io.emit('state:update', saved)
    res.json({ ok: true, savedAt: saved.updatedAt })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.get('/health', async (_, res) => {
  const state = await getSharedState()
  res.json({
    ok: true,
    tables: state.tables?.length || 0,
    sales: state.dailySales?.length || 0,
    db: getDbStatus(),
  })
})

function broadcastState(state) {
  io.emit('state:update', state)
}

io.on('connection', async (socket) => {
  const current = await getSharedState()
  socket.emit('state:update', current)

  socket.on('state:request', async () => {
    const state = await getSharedState()
    socket.emit('state:update', state)
  })

  socket.on('state:update', async (incoming) => {
    if (!incoming || typeof incoming !== 'object') return
    const updated = await updateSharedState(incoming)
    broadcastState(updated)
  })
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, 'dist')

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/api/') || req.path === '/health') {
      return next()
    }
    res.sendFile(join(DIST_DIR, 'index.html'))
  })
}

const PORT = Number(globalThis.process?.env?.PORT || 3000)
const HOST = '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log(`Ginita POS server running on http://${HOST}:${PORT}`)
})
