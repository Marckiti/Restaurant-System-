import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { io } from 'socket.io-client'
import {
  Users,
  ChefHat,
  ShieldCheck,
  LogOut,
  Fish,
  Share2,
} from 'lucide-react'
import {
  DEFAULT_BASE_PRICES,
  PRODUCT_MAP,
  buildDefaultState,
  buildInitialTables,
  createOrder,
  getProductPrice,
  getTodayLabel,
} from './logic.js'

import TableCard from './components/TableCard.jsx'
import TableOrderDrawer from './components/TableOrderDrawer.jsx'
import FishCookingModal from './components/FishCookingModal.jsx'
import PortionModal from './components/PortionModal.jsx'
import EmpanadaModal from './components/EmpanadaModal.jsx'
import AlmejasModal from './components/AlmejasModal.jsx'
import PaymentModal from './components/PaymentModal.jsx'
import BottomNavBar from './components/BottomNavBar.jsx'
import KitchenView from './components/KitchenView.jsx'
import ReportView from './components/ReportView.jsx'
import AdminPricesView from './components/AdminPricesView.jsx'
import RoleSelector from './components/RoleSelector.jsx'
import ConnectDevicesModal from './components/ConnectDevicesModal.jsx'

const STORAGE_KEY = 'ginita-pos-v3'
const CHANNEL_KEY = 'ginita-pos-sync'
const SHARED_STATE_ID = 'ginita-pos-shared'
const SUPABASE_URL =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

const safeStorageRead = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Error al leer persistencia local:', error)
    return null
  }
}

const normalizeSharedState = (incoming) => {
  if (!incoming || typeof incoming !== 'object') return null
  return {
    tables: Array.isArray(incoming.tables) ? incoming.tables : [],
    dailySales: Array.isArray(incoming.dailySales) ? incoming.dailySales : [],
    basePrices: incoming.basePrices || DEFAULT_BASE_PRICES,
  }
}

export default function App() {
  const [state, setState] = useState(() => {
    const stored = safeStorageRead()
    if (stored) {
      return {
        ...buildDefaultState(),
        ...stored,
        tables: stored.tables?.length ? stored.tables : buildInitialTables(),
        basePrices: { ...DEFAULT_BASE_PRICES, ...(stored.basePrices || {}) },
        dailySales: stored.dailySales || [],
        userRole: stored.userRole || null,
        currentView: stored.currentView || 'tables',
      }
    }
    return buildDefaultState()
  })

  const syncChannelRef = useRef(null)
  const remoteSyncRef = useRef(false)
  const socketRef = useRef(null)
  const lastUpdateRef = useRef(0)
  const [dbStatus, setDbStatus] = useState(null)

  // Floating Modals state
  const [fishCookingSelection, setFishCookingSelection] = useState({
    isOpen: false,
    product: null,
  })
  const [portionModalOpen, setPortionModalOpen] = useState(false)
  const [empanadaModalOpen, setEmpanadaModalOpen] = useState(false)
  const [almejasModalOpen, setAlmejasModalOpen] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)

  const [paymentSelection, setPaymentSelection] = useState({
    isOpen: false,
    tableId: null,
    total: 0,
  })
  const [tableFilter, setTableFilter] = useState('all')

  // Apply state from external sync (socket, http poll, or broadcast channel)
  const applyIncomingState = useCallback((incoming) => {
    const normalized = normalizeSharedState(incoming)
    if (!normalized) return

    if (incoming.updatedAt && incoming.updatedAt <= lastUpdateRef.current) {
      return
    }
    if (incoming.updatedAt) {
      lastUpdateRef.current = incoming.updatedAt
    }

    remoteSyncRef.current = true
    setState((prev) => ({
      ...prev,
      tables: normalized.tables,
      dailySales: normalized.dailySales,
      basePrices: { ...DEFAULT_BASE_PRICES, ...normalized.basePrices },
    }))
  }, [])

  // Sync listener setup across all channels
  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const channel =
      'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_KEY) : null
    syncChannelRef.current = channel

    // 1. Initial HTTP fetch from MongoDB / server
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) applyIncomingState(data)
      })
      .catch(() => {})

    fetch('/api/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((status) => {
        if (status) setDbStatus(status)
      })
      .catch(() => {})

    // 2. Real-time Socket.io for instantaneous multi-device updates
    let socket = null
    try {
      socket = io({ transports: ['websocket', 'polling'], timeout: 4000 })
      socketRef.current = socket
      socket.on('state:update', (incoming) => {
        if (incoming) applyIncomingState(incoming)
      })
    } catch {
      // fallback to HTTP polling
    }

    // 3. Periodic polling interval (every 2.5s) to guarantee multi-device consistency
    const pollInterval = setInterval(() => {
      fetch('/api/state')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) applyIncomingState(data)
        })
        .catch(() => {})
    }, 2500)

    const statusInterval = setInterval(() => {
      fetch('/api/status')
        .then((res) => (res.ok ? res.json() : null))
        .then((status) => {
          if (status) setDbStatus(status)
        })
        .catch(() => {})
    }, 12000)

    // 4. Supabase fallback if configured
    const client = getSupabaseClient()
    const syncFromSupabase = async () => {
      if (!client) return
      const { data, error } = await client
        .from('pos_state')
        .select('payload')
        .eq('id', SHARED_STATE_ID)
        .maybeSingle()

      if (!error && data?.payload) {
        applyIncomingState(data.payload)
      }

      const supabaseChannel = client
        .channel('ginita-pos-shared')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pos_state',
            filter: `id=eq.${SHARED_STATE_ID}`,
          },
          (payload) => {
            if (payload.new?.payload) {
              applyIncomingState(payload.new.payload)
            }
          },
        )
        .subscribe()

      return () => {
        supabaseChannel.unsubscribe()
      }
    }

    const cleanupSupabase = syncFromSupabase()

    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === 'GINITA_POS_SYNC' && event.data.state) {
          applyIncomingState(event.data.state)
        }
      }
    }

    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          applyIncomingState(JSON.parse(event.newValue))
        } catch (error) {
          console.error('Error al sincronizar con almacenamiento:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      if (socket) socket.disconnect()
      socketRef.current = null
      clearInterval(pollInterval)
      clearInterval(statusInterval)
      cleanupSupabase?.then((cleanup) => cleanup && cleanup())
      syncChannelRef.current = null
      window.removeEventListener('storage', handleStorage)
    }
  }, [applyIncomingState])

  // Sync state outbound to local storage, broadcast channel, Socket.io, and backend DB API
  useEffect(() => {
    if (typeof window === 'undefined') return

    const now = Date.now()
    const sharedState = {
      tables: state.tables,
      dailySales: state.dailySales,
      basePrices: state.basePrices,
      updatedAt: now,
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, ...sharedState }),
    )

    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({
        type: 'GINITA_POS_SYNC',
        state: sharedState,
      })
    }

    if (remoteSyncRef.current) {
      remoteSyncRef.current = false
      return
    }

    lastUpdateRef.current = now

    // 1. Broadcast via Socket.io
    if (socketRef.current?.connected) {
      socketRef.current.emit('state:update', sharedState)
    }

    // 2. Save to Node backend and MongoDB Atlas
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sharedState),
    }).catch(() => {})

    // 3. Optional Supabase sync
    const client = getSupabaseClient()
    if (client) {
      client
        .from('pos_state')
        .upsert(
          {
            id: SHARED_STATE_ID,
            payload: sharedState,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .then(() => undefined)
        .catch(() => undefined)
    }
  }, [state])

  // Computed data
  const selectedTable = useMemo(
    () => state.tables.find((t) => t.id === state.selectedTableId) || null,
    [state.tables, state.selectedTableId],
  )

  const kitchenQueue = useMemo(
    () =>
      state.tables
        .filter((table) => table.order && table.order.sentToKitchen && !table.order.paid)
        .map((table) => ({
          tableId: table.id,
          order: table.order,
          type: table.type,
        }))
        .sort((a, b) => a.order.arrivedAt - b.order.arrivedAt),
    [state.tables],
  )

  // Filtered tables for the grid
  const filteredTables = useMemo(() => {
    if (tableFilter === 'interior') {
      return state.tables.filter((t) => t.type === 'Interior')
    }
    if (tableFilter === 'exterior') {
      return state.tables.filter((t) => t.type === 'Exterior')
    }
    if (tableFilter === 'occupied') {
      return state.tables.filter(
        (t) => t.order && Array.isArray(t.order.items) && t.order.items.length > 0,
      )
    }
    return state.tables
  }, [state.tables, tableFilter])

  // Table action handlers
  const handleOpenTable = useCallback((tableId) => {
    setState((prev) => ({
      ...prev,
      selectedTableId: tableId,
      tables: prev.tables.map((t) => {
        if (t.id !== tableId) return t
        return t.order ? t : { ...t, order: createOrder() }
      }),
    }))
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTableId: null,
      tables: prev.tables.map((t) => {
        // If table order has 0 items, clean it up completely so it's not occupied
        if (
          t.id === prev.selectedTableId &&
          t.order &&
          (!Array.isArray(t.order.items) || t.order.items.length === 0)
        ) {
          return { ...t, order: null }
        }
        return t
      }),
    }))
  }, [])

  // Adding product directly (non-cooking items like beverages or morocho)
  const handleAddProduct = useCallback((productId, customQty = 1) => {
    setState((prev) => {
      if (!prev.selectedTableId) return prev
      const product = PRODUCT_MAP[productId]
      if (!product) return prev

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== prev.selectedTableId) return table

          const order = table.order || createOrder()
          const key = productId
          const nextItems = [...order.items]
          const existingIndex = nextItems.findIndex((item) => item.key === key)
          const unitPrice = getProductPrice(productId, prev.basePrices)

          if (existingIndex >= 0) {
            nextItems[existingIndex] = {
              ...nextItems[existingIndex],
              qty: Number(nextItems[existingIndex].qty || 0) + customQty,
              unitPrice,
            }
          } else {
            nextItems.push({
              key,
              productId,
              name: product.name,
              qty: customQty,
              unitPrice,
              category: product.category,
              cooking: null,
              serviceType: 'servir',
              takeoutExtra: 0,
              notes: null,
            })
          }

          return {
            ...table,
            order: {
              ...order,
              items: nextItems,
            },
          }
        }),
      }
    })
  }, [])

  // 1. Confirming Fish with cooking mode, takeout (+$0.25), and kitchen notes
  const handleConfirmCooking = useCallback(
    ({ cookingMode, serviceType, takeoutExtra, unitPrice, notes, qty }) => {
      if (!fishCookingSelection.product) return

      const product = fishCookingSelection.product
      const productId = product.id

      setState((prev) => {
        if (!prev.selectedTableId) return prev

        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.id !== prev.selectedTableId) return table

            const order = table.order || createOrder()
            const key = `${productId}:${cookingMode}:${serviceType}:${notes || 'std'}`
            const nextItems = [...order.items]
            const existingIndex = nextItems.findIndex((item) => item.key === key)

            if (existingIndex >= 0) {
              nextItems[existingIndex] = {
                ...nextItems[existingIndex],
                qty: Number(nextItems[existingIndex].qty || 0) + qty,
                unitPrice,
              }
            } else {
              nextItems.push({
                key,
                productId,
                name: product.name,
                qty,
                unitPrice,
                category: product.category,
                cooking: cookingMode,
                serviceType,
                takeoutExtra,
                notes,
              })
            }

            return {
              ...table,
              order: {
                ...order,
                items: nextItems,
              },
            }
          }),
        }
      })

      setFishCookingSelection({ isOpen: false, product: null })
    },
    [fishCookingSelection.product],
  )

  // 2. Confirming Portion (Papa, Tostado, Curtido)
  const handleConfirmPortion = useCallback(
    ({ portionId, name, unitPrice, serviceType, qty }) => {
      setState((prev) => {
        if (!prev.selectedTableId) return prev

        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.id !== prev.selectedTableId) return table

            const order = table.order || createOrder()
            const key = `${portionId}:${serviceType}`
            const nextItems = [...order.items]
            const existingIndex = nextItems.findIndex((item) => item.key === key)

            if (existingIndex >= 0) {
              nextItems[existingIndex] = {
                ...nextItems[existingIndex],
                qty: Number(nextItems[existingIndex].qty || 0) + qty,
                unitPrice,
              }
            } else {
              nextItems.push({
                key,
                productId: portionId,
                name,
                qty,
                unitPrice,
                category: 'Pescados',
                cooking: null,
                serviceType,
                takeoutExtra: 0,
                notes: null,
              })
            }

            return {
              ...table,
              order: {
                ...order,
                items: nextItems,
              },
            }
          }),
        }
      })

      setPortionModalOpen(false)
    },
    [],
  )

  // 3. Confirming Empanadas fast quantity
  const handleConfirmEmpanada = useCallback(
    ({ qty, unitPrice, serviceType }) => {
      setState((prev) => {
        if (!prev.selectedTableId) return prev

        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.id !== prev.selectedTableId) return table

            const order = table.order || createOrder()
            const key = `empanada:${serviceType}`
            const nextItems = [...order.items]
            const existingIndex = nextItems.findIndex((item) => item.key === key)

            if (existingIndex >= 0) {
              nextItems[existingIndex] = {
                ...nextItems[existingIndex],
                qty: Number(nextItems[existingIndex].qty || 0) + qty,
                unitPrice,
              }
            } else {
              nextItems.push({
                key,
                productId: 'empanada',
                name: 'Empanadas',
                qty,
                unitPrice,
                category: 'Empanadas',
                cooking: null,
                serviceType,
                takeoutExtra: 0,
                notes: null,
              })
            }

            return {
              ...table,
              order: {
                ...order,
                items: nextItems,
              },
            }
          }),
        }
      })

      setEmpanadaModalOpen(false)
    },
    [],
  )

  // 4. Confirming Almejas with takeout option
  const handleConfirmAlmejas = useCallback(
    ({ qty, unitPrice, serviceType, notes }) => {
      setState((prev) => {
        if (!prev.selectedTableId) return prev

        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.id !== prev.selectedTableId) return table

            const order = table.order || createOrder()
            const key = `almejas:${serviceType}:${notes || 'std'}`
            const nextItems = [...order.items]
            const existingIndex = nextItems.findIndex((item) => item.key === key)

            if (existingIndex >= 0) {
              nextItems[existingIndex] = {
                ...nextItems[existingIndex],
                qty: Number(nextItems[existingIndex].qty || 0) + qty,
                unitPrice,
              }
            } else {
              nextItems.push({
                key,
                productId: 'almejas',
                name: 'Almejas',
                qty,
                unitPrice,
                category: 'Pescados',
                cooking: null,
                serviceType,
                takeoutExtra: 0,
                notes,
              })
            }

            return {
              ...table,
              order: {
                ...order,
                items: nextItems,
              },
            }
          }),
        }
      })

      setAlmejasModalOpen(false)
    },
    [],
  )

  // Updating quantity of item in order
  const handleUpdateQty = useCallback((itemKey, delta) => {
    setState((prev) => {
      if (!prev.selectedTableId) return prev

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== prev.selectedTableId || !table.order) return table

          const items = table.order.items
            .map((item) => {
              if (item.key !== itemKey) return item
              const nextQty = Number(item.qty || 0) + delta
              return nextQty <= 0 ? null : { ...item, qty: nextQty }
            })
            .filter(Boolean)

          return {
            ...table,
            order: {
              ...table.order,
              items,
            },
          }
        }),
      }
    })
  }, [])

  // Removing an item from the order
  const handleRemoveItem = useCallback((itemKey) => {
    setState((prev) => {
      if (!prev.selectedTableId) return prev

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== prev.selectedTableId || !table.order) return table

          return {
            ...table,
            order: {
              ...table.order,
              items: table.order.items.filter((item) => item.key !== itemKey),
            },
          }
        }),
      }
    })
  }, [])

  // Send table order to kitchen
  const handleSendToKitchen = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedTableId) return prev

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== prev.selectedTableId || !table.order) return table

          // Mark all items as sent
          const updatedItems = (table.order.items || []).map((item) => ({
            ...item,
            sent: true,
          }))

          return {
            ...table,
            order: {
              ...table.order,
              items: updatedItems,
              sentToKitchen: true,
              hasBeenSent: true,
              kitchenDispatched: false,
              pendingPayment: false,
              paid: false,
              arrivedAt: table.order.arrivedAt || Date.now(),
            },
          }
        }),
        selectedTableId: null,
      }
    })
  }, [])

  // Kitchen marks order dispatched
  const handleCompleteKitchenOrder = useCallback((tableId) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => {
        if (table.id !== tableId || !table.order) return table
        return {
          ...table,
          order: {
            ...table.order,
            sentToKitchen: false,
            kitchenDispatched: true,
            pendingPayment: true,
            paid: false,
          },
        }
      }),
    }))
  }, [])

  // Open payment modal
  const handleOpenPayment = useCallback(
    (tableId) => {
      const table = state.tables.find((t) => t.id === tableId)
      if (!table?.order) return

      const total = table.order.items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * Number(item.qty),
        0,
      )

      setPaymentSelection({
        isOpen: true,
        tableId,
        total,
      })
    },
    [state.tables],
  )

  // Confirm payment
  const handleConfirmPayment = useCallback(
    (paymentMethod) => {
      const tableId = paymentSelection.tableId
      if (!tableId) return

      setState((prev) => {
        const table = prev.tables.find((t) => t.id === tableId)
        if (!table?.order) return prev

        const total = table.order.items.reduce(
          (sum, item) => sum + Number(item.unitPrice) * Number(item.qty),
          0,
        )

        const saleEntry = {
          id: `venta-${Date.now()}`,
          tableId,
          total,
          paymentMethod,
          createdAt: Date.now(),
          items: table.order.items.map((i) => ({ ...i })),
        }

        return {
          ...prev,
          tables: prev.tables.map((t) => {
            if (t.id !== tableId) return t
            return {
              ...t,
              order: {
                ...t.order,
                pendingPayment: false,
                paid: true,
                sentToKitchen: false,
              },
            }
          }),
          dailySales: [...prev.dailySales, saleEntry],
          selectedTableId: null,
        }
      })
    },
    [paymentSelection.tableId],
  )

  // Release/vacate table
  const handleReleaseTable = useCallback((tableId) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.map((t) => {
        if (t.id !== tableId) return t
        return { ...t, order: null }
      }),
      selectedTableId: null,
    }))
  }, [])

  // Reset daily sales
  const handleResetDay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dailySales: [],
      currentView: 'tables',
    }))
  }, [])

  // Admin updates base price
  const handleUpdatePrice = useCallback((productId, newPrice) => {
    setState((prev) => ({
      ...prev,
      basePrices: {
        ...prev.basePrices,
        [productId]: newPrice,
      },
    }))
  }, [])

  // Role selection
  const handleSelectRole = useCallback((role) => {
    setState((prev) => ({
      ...prev,
      userRole: role,
      currentView: role === 'cook' ? 'kitchen' : 'tables',
    }))
  }, [])

  if (!state.userRole) {
    return (
      <>
        <RoleSelector
          onSelectRole={handleSelectRole}
          onOpenConnect={() => setConnectModalOpen(true)}
        />
        <ConnectDevicesModal
          isOpen={connectModalOpen}
          onClose={() => setConnectModalOpen(false)}
          dbStatus={dbStatus}
        />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-16">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-2xs">
            <Fish size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-none tracking-tight">
              Ginita POS
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
              {getTodayLabel()}
            </span>
          </div>
        </div>

        {/* Role & Switch Button */}
        <div className="flex items-center gap-2">
          {/* Real-time Multi-device Sync / Connect button */}
          <button
            type="button"
            onClick={() => setConnectModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 active:scale-95 shadow-2xs"
            title="Conectar varios celulares / Ver código QR"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Share2 size={13} className="text-emerald-700" />
            <span className="hidden sm:inline">Conectar Celulares</span>
            <span className="sm:hidden text-[10px]">Conectar</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
            {state.userRole === 'cashier' ? (
              <Users size={13} />
            ) : state.userRole === 'cook' ? (
              <ChefHat size={13} />
            ) : (
              <ShieldCheck size={13} />
            )}
            <span>
              {state.userRole === 'cashier'
                ? 'Mesero'
                : state.userRole === 'cook'
                  ? 'Cocinero'
                  : 'Admin'}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setState((prev) => ({ ...prev, userRole: null }))}
            className="min-h-[38px] px-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-100 active:scale-95 transition flex items-center gap-1.5 shadow-2xs"
            title="Cambiar perfil"
          >
            <LogOut size={14} />
            <span className="text-[11px] font-bold">Cambiar</span>
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 p-3.5 sm:p-5 max-w-5xl mx-auto w-full">
        {state.currentView === 'tables' && (
          <div className="space-y-3.5">
            {/* Quick Filter Bar for Tables */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60">
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
                    tableFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({state.tables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('interior')}
                  className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
                    tableFilter === 'interior'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Interior (12)
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('exterior')}
                  className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
                    tableFilter === 'exterior'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Exterior (3)
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('occupied')}
                  className={`min-h-[36px] px-3 rounded-xl text-xs font-bold transition active:scale-95 ${
                    tableFilter === 'occupied'
                      ? 'bg-white text-amber-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ocupadas (
                    {
                      state.tables.filter(
                        (t) =>
                          t.order &&
                          Array.isArray(t.order.items) &&
                          t.order.items.length > 0,
                      ).length
                    }
                  )
                </button>
              </div>
            </div>

            {/* Tables Touch Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {filteredTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  isSelected={state.selectedTableId === table.id}
                  onClick={() => handleOpenTable(table.id)}
                />
              ))}
            </div>
          </div>
        )}

        {state.currentView === 'kitchen' && (
          <KitchenView
            kitchenQueue={kitchenQueue}
            onCompleteOrder={handleCompleteKitchenOrder}
          />
        )}

        {state.currentView === 'report' && (
          <ReportView
            dailySales={state.dailySales}
            onResetDay={handleResetDay}
          />
        )}

        {state.currentView === 'admin' && (
          <AdminPricesView
            basePrices={state.basePrices}
            onUpdatePrice={handleUpdatePrice}
          />
        )}
      </main>

      {/* Floating Bottom Sheet Menu for Waiter when Table is tapped */}
      {selectedTable && (
        <TableOrderDrawer
          table={selectedTable}
          basePrices={state.basePrices}
          onClose={handleCloseDrawer}
          onAddProduct={handleAddProduct}
          onOpenCookingModal={(product) =>
            setFishCookingSelection({ isOpen: true, product })
          }
          onOpenPortionModal={() => setPortionModalOpen(true)}
          onOpenEmpanadaModal={() => setEmpanadaModalOpen(true)}
          onOpenAlmejasModal={() => setAlmejasModalOpen(true)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onSendToKitchen={handleSendToKitchen}
          onOpenPayment={handleOpenPayment}
          onReleaseTable={handleReleaseTable}
        />
      )}

      {/* 1. Floating Modal for Fish Cooking selection (Frito vs Al vapor + Para Llevar + Notas) */}
      <FishCookingModal
        isOpen={fishCookingSelection.isOpen}
        product={fishCookingSelection.product}
        onConfirm={handleConfirmCooking}
        onClose={() => setFishCookingSelection({ isOpen: false, product: null })}
      />

      {/* 2. Floating Modal for Extra Portions (Papa, Tostado, Curtido) */}
      <PortionModal
        isOpen={portionModalOpen}
        basePrices={state.basePrices}
        onConfirm={handleConfirmPortion}
        onClose={() => setPortionModalOpen(false)}
      />

      {/* 3. Floating Modal for Fast Empanada Quantities (+1, +4, +8, +12) */}
      <EmpanadaModal
        isOpen={empanadaModalOpen}
        unitPrice={getProductPrice('empanada', state.basePrices)}
        onConfirm={handleConfirmEmpanada}
        onClose={() => setEmpanadaModalOpen(false)}
      />

      {/* 4. Floating Modal for Almejas with Takeout and Notes */}
      <AlmejasModal
        isOpen={almejasModalOpen}
        unitPrice={getProductPrice('almejas', state.basePrices)}
        onConfirm={handleConfirmAlmejas}
        onClose={() => setAlmejasModalOpen(false)}
      />

      {/* 5. Payment Modal */}
      <PaymentModal
        isOpen={paymentSelection.isOpen}
        tableId={paymentSelection.tableId}
        total={paymentSelection.total}
        onConfirmPayment={handleConfirmPayment}
        onClose={() =>
          setPaymentSelection({ isOpen: false, tableId: null, total: 0 })
        }
      />

      {/* 6. Multi-Device Connect & QR Code Modal */}
      <ConnectDevicesModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        dbStatus={dbStatus}
      />

      {/* Fixed Bottom Navigation Bar for Mobile Thumb Ergonomics */}
      <BottomNavBar
        currentView={state.currentView}
        onSelectView={(view) =>
          setState((prev) => ({ ...prev, currentView: view }))
        }
        userRole={state.userRole}
        kitchenQueueCount={kitchenQueue.length}
      />
    </div>
  )
}
