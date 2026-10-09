import express from 'express'
import http from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Server } from 'socket.io'
import { buildDefaultState } from './src/logic.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const DATA_DIR = join(globalThis.process?.cwd?.() || '.', 'data')
const DATA_PATH = join(DATA_DIR, 'shared-state.json')

mkdirSync(DATA_DIR, { recursive: true })

const readSharedState = () => {
  try {
    const raw = readFileSync(DATA_PATH, 'utf8')
    if (!raw.trim()) return buildDefaultState()
    const parsed = JSON.parse(raw)
    return {
      ...buildDefaultState(),
      ...parsed,
      tables: Array.isArray(parsed.tables) ? parsed.tables : buildDefaultState().tables,
      dailySales: Array.isArray(parsed.dailySales) ? parsed.dailySales : [],
      basePrices: parsed.basePrices ? { ...buildDefaultState().basePrices, ...parsed.basePrices } : buildDefaultState().basePrices,
    }
  } catch {
    return buildDefaultState()
  }
}

let sharedState = readSharedState()

const persistSharedState = () => {
  writeFileSync(DATA_PATH, JSON.stringify(sharedState, null, 2), 'utf8')
}

app.get('/health', (_, res) => {
  res.json({ ok: true, tables: sharedState.tables.length, sales: sharedState.dailySales.length })
})

function broadcastState() {
  io.emit('state:update', sharedState)
}

io.on('connection', (socket) => {
  socket.emit('state:update', sharedState)

  socket.on('state:request', () => {
    socket.emit('state:update', sharedState)
  })

  socket.on('state:update', (incoming) => {
    if (!incoming || typeof incoming !== 'object') return
    sharedState = {
      ...buildDefaultState(),
      ...incoming,
      tables: Array.isArray(incoming.tables) ? incoming.tables : sharedState.tables,
      dailySales: Array.isArray(incoming.dailySales) ? incoming.dailySales : sharedState.dailySales,
      basePrices: incoming.basePrices ? { ...buildDefaultState().basePrices, ...incoming.basePrices } : sharedState.basePrices,
    }
    persistSharedState()
    broadcastState()
  })
})

const PORT = Number(globalThis.process?.env?.PORT || 3001)
const HOST = '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log(`Ginita POS sync server running on http://${HOST}:${PORT}`)
})
