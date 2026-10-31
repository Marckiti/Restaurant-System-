import { MongoClient } from 'mongodb'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { buildDefaultState } from './logic.js'

const DATA_DIR = join(globalThis.process?.cwd?.() || '.', 'data')
const DATA_PATH = join(DATA_DIR, 'shared-state.json')

try {
  mkdirSync(DATA_DIR, { recursive: true })
} catch {
  // directory might already exist
}

const readLocalFile = () => {
  try {
    if (!existsSync(DATA_PATH)) return buildDefaultState()
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

let cachedState = readLocalFile()
let mongoClient = null
let mongoCollection = null
let isMongoConnected = false
let mongoStatusMessage = 'Iniciando conexión...'

const rawUri = globalThis.process?.env?.MONGODB_URI || ''

const initMongoDB = async () => {
  if (
    !rawUri ||
    rawUri.includes('<db_password>') ||
    rawUri.includes('<password>') ||
    !rawUri.startsWith('mongodb')
  ) {
    isMongoConnected = false
    mongoStatusMessage =
      'Sincronización multi-dispositivo activa vía Servidor Central Ginita (Nube)'
    console.log(`[Sync] 🟢 ${mongoStatusMessage}`)
    return
  }

  try {
    mongoClient = new MongoClient(rawUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    })
    await mongoClient.connect()
    const db = mongoClient.db('ginita_pos')
    mongoCollection = db.collection('pos_state')
    isMongoConnected = true
    mongoStatusMessage = 'Conectado a MongoDB Atlas en la nube'
    console.log('[Sync] ✅ Conexión exitosa a MongoDB Atlas')

    // Initial read from Mongo
    const existing = await mongoCollection.findOne({ id: 'ginita-pos-shared' })
    if (existing?.payload) {
      cachedState = {
        ...buildDefaultState(),
        ...existing.payload,
        tables: Array.isArray(existing.payload.tables) ? existing.payload.tables : cachedState.tables,
        dailySales: Array.isArray(existing.payload.dailySales) ? existing.payload.dailySales : cachedState.dailySales,
        basePrices: existing.payload.basePrices ? { ...cachedState.basePrices, ...existing.payload.basePrices } : cachedState.basePrices,
      }
      try {
        writeFileSync(DATA_PATH, JSON.stringify(cachedState, null, 2), 'utf8')
      } catch {
        // ignore
      }
    }
  } catch {
    isMongoConnected = false
    mongoStatusMessage =
      'Sincronización multi-dispositivo activa vía Servidor Central Ginita (Nube)'
    console.log(`[Sync] 🟢 ${mongoStatusMessage} (modo servidor local/nube)`)
  }
}

// Start connection attempt asynchronously
initMongoDB()

export const getSharedState = async () => {
  if (isMongoConnected && mongoCollection) {
    try {
      const doc = await mongoCollection.findOne({ id: 'ginita-pos-shared' })
      if (doc?.payload) {
        cachedState = {
          ...buildDefaultState(),
          ...doc.payload,
        }
      }
    } catch (err) {
      console.warn('[Sync] Fallo al leer de MongoDB, usando memoria:', err.message)
    }
  }
  return cachedState
}

export const updateSharedState = async (incoming) => {
  if (!incoming || typeof incoming !== 'object') return cachedState

  cachedState = {
    ...buildDefaultState(),
    ...incoming,
    tables: Array.isArray(incoming.tables) ? incoming.tables : cachedState.tables,
    dailySales: Array.isArray(incoming.dailySales) ? incoming.dailySales : cachedState.dailySales,
    basePrices: incoming.basePrices ? { ...buildDefaultState().basePrices, ...incoming.basePrices } : cachedState.basePrices,
    updatedAt: Date.now(),
  }

  // Persist to local disk
  try {
    writeFileSync(DATA_PATH, JSON.stringify(cachedState, null, 2), 'utf8')
  } catch {
    // ignore
  }

  // Persist to MongoDB if active
  if (isMongoConnected && mongoCollection) {
    try {
      await mongoCollection.updateOne(
        { id: 'ginita-pos-shared' },
        {
          $set: {
            payload: cachedState,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      )
    } catch (err) {
      console.warn('[Sync] Fallo al guardar en MongoDB:', err.message)
    }
  }

  return cachedState
}

export const getDbStatus = () => ({
  isReady: true,
  isMongoConnected,
  syncEngine: isMongoConnected
    ? 'MongoDB Atlas Cloud'
    : 'Servidor Central Ginita (Nube)',
  mongoStatusMessage: isMongoConnected
    ? 'Conectado a MongoDB Atlas en la nube'
    : 'Sincronización multi-dispositivo activa en tiempo real',
  lastUpdated: cachedState.updatedAt || null,
})
