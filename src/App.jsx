import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ChefHat, Clock3, CreditCard, LogOut, ShieldCheck, Sparkles, Users } from 'lucide-react'
import {
  COOKING_MODES,
  DEFAULT_BASE_PRICES,
  PRODUCT_CATALOG,
  PRODUCT_MAP,
  QUICK_ITEMS,
  buildDefaultState,
  buildInitialTables,
  calculateDailySummary,
  createOrder,
  formatCurrency,
  getProductPrice,
  getStatusStyles,
  getTableStatus,
  getTodayLabel,
  sumOrder,
} from './logic.js'

const STORAGE_KEY = 'ginita-pos-v1'
const CHANNEL_KEY = 'ginita-pos-sync'
const SHARED_STATE_ID = 'ginita-pos-shared'
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

const USER_OPTIONS = [
  { id: 'cashier', label: 'Cajero / Mesero', icon: Users },
  { id: 'cook', label: 'Cocinero', icon: ChefHat },
  { id: 'admin', label: 'Administrador', icon: ShieldCheck },
]

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
    console.error('No se pudo leer persistencia local:', error)
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

const TableButton = memo(function TableButton({ table, status, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.99] ${
        isActive ? 'border-slate-900 ring-2 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
      } ${getStatusStyles(status)}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.12em]">
        <span>{table.type}</span>
        <span>{status === 'free' ? 'Disponible' : status === 'occupied' ? 'Ocupada' : 'Cobro'}</span>
      </div>
      <div className="text-2xl font-black">{table.id}</div>
      <div className="mt-2 text-xs font-semibold opacity-90">
        {table.order ? `${table.order.items.length} ítems` : 'Sin pedido'}
      </div>
    </button>
  )
})

function App() {
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
      }
    }

    return buildDefaultState()
  })

  const syncChannelRef = useRef(null)
  const remoteSyncRef = useRef(false)
  const [selectedCooking, setSelectedCooking] = useState('frito')
  const [paymentSelection, setPaymentSelection] = useState({ open: false, tableId: null, total: 0, method: null })
  const [showProductPicker, setShowProductPicker] = useState(false)

  const applyIncomingState = useCallback((incoming) => {
    const normalized = normalizeSharedState(incoming)
    if (!normalized) return

    remoteSyncRef.current = true

    setState((prev) => {
      const next = {
        ...buildDefaultState(),
        ...prev,
        tables: normalized.tables,
        dailySales: normalized.dailySales,
        basePrices: { ...DEFAULT_BASE_PRICES, ...normalized.basePrices },
      }

      return next
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_KEY) : null
    syncChannelRef.current = channel

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

      return () => { supabaseChannel.unsubscribe() }
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
          console.error('No se pudo sincronizar el estado:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      cleanupSupabase?.then((cleanup) => cleanup && cleanup())
      syncChannelRef.current = null
      window.removeEventListener('storage', handleStorage)
    }
  }, [applyIncomingState])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sharedState = {
      tables: state.tables,
      dailySales: state.dailySales,
      basePrices: state.basePrices,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, ...sharedState }))

    if (syncChannelRef.current) {
      syncChannelRef.current.postMessage({ type: 'GINITA_POS_SYNC', state: sharedState })
    }

    if (remoteSyncRef.current) {
      remoteSyncRef.current = false
      return
    }

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

  const selectedTable = useMemo(
    () => state.tables.find((table) => table.id === state.selectedTableId) || null,
    [state.tables, state.selectedTableId],
  )

  const productPrices = useMemo(
    () => Object.fromEntries(PRODUCT_CATALOG.map((product) => [product.id, getProductPrice(product.id, state.basePrices)])),
    [state.basePrices],
  )

  const kitchenQueue = useMemo(
    () =>
      state.tables
        .filter((table) => table.order && table.order.sentToKitchen)
        .map((table) => ({
          tableId: table.id,
          order: table.order,
          type: table.type,
        }))
        .sort((a, b) => a.order.arrivedAt - b.order.arrivedAt),
    [state.tables],
  )

  const reportBreakdown = useMemo(() => calculateDailySummary(state.dailySales), [state.dailySales])
  const todaysRevenue = reportBreakdown.total

  const openTable = useCallback((tableId) => {
    setState((prev) => ({
      ...prev,
      selectedTableId: tableId,
      currentView: 'tables',
      tables: prev.tables.map((table) => {
        if (table.id !== tableId) return table
        return table.order ? table : { ...table, order: createOrder() }
      }),
    }))
  }, [])

  const updateSelectedTable = useCallback((updater) => {
    setState((prev) => {
      if (!prev.selectedTableId) return prev

      return {
        ...prev,
        tables: prev.tables.map((table) => {
          if (table.id !== prev.selectedTableId) return table
          return updater(table)
        }),
      }
    })
  }, [])

  const addProductToOrder = useCallback(
    (productId, customQty = 1) => {
      setState((prev) => {
        if (!prev.selectedTableId) return prev

        const product = PRODUCT_MAP[productId]
        if (!product) return prev

        return {
          ...prev,
          tables: prev.tables.map((table) => {
            if (table.id !== prev.selectedTableId) return table

            const order = table.order || createOrder()
            const key = product.requiresCooking ? `${productId}:${selectedCooking}` : productId
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
                cooking: product.requiresCooking ? selectedCooking : null,
              })
            }

            return {
              ...table,
              order: {
                ...order,
                items: nextItems,
                sentToKitchen: false,
                pendingPayment: false,
                paid: false,
              },
            }
          }),
        }
      })
    },
    [selectedCooking],
  )

  const updateItemQty = useCallback(
    (productKey, delta) => {
      updateSelectedTable((table) => {
        if (!table.order) return table

        const items = table.order.items
          .map((item) => {
            if (item.key !== productKey) return item
            const nextQty = Number(item.qty || 0) + delta
            if (nextQty <= 0) return null
            return { ...item, qty: nextQty }
          })
          .filter(Boolean)

        return {
          ...table,
          order: {
            ...table.order,
            items,
            sentToKitchen: false,
            pendingPayment: false,
            paid: false,
          },
        }
      })
    },
    [updateSelectedTable],
  )

  const removeItem = useCallback(
    (productKey) => {
      updateSelectedTable((table) => {
        if (!table.order) return table
        return {
          ...table,
          order: {
            ...table.order,
            items: table.order.items.filter((item) => item.key !== productKey),
            sentToKitchen: false,
            pendingPayment: false,
            paid: false,
          },
        }
      })
    },
    [updateSelectedTable],
  )

  const sendToKitchen = useCallback(() => {
    updateSelectedTable((table) => {
      if (!table.order || !table.order.items.length) return table
      return {
        ...table,
        order: {
          ...table.order,
          sentToKitchen: true,
          pendingPayment: false,
          paid: false,
          arrivedAt: table.order.arrivedAt || Date.now(),
        },
      }
    })
  }, [updateSelectedTable])

  const completeKitchenOrder = useCallback((tableId) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => {
        if (table.id !== tableId) return table
        if (!table.order) return table

        return {
          ...table,
          order: {
            ...table.order,
            sentToKitchen: false,
            pendingPayment: true,
            paid: false,
          },
        }
      }),
    }))
  }, [])

  const finalizePayment = useCallback((tableId, paymentMethod) => {
    setState((prev) => {
      const table = prev.tables.find((item) => item.id === tableId)
      if (!table?.order) return prev

      const total = sumOrder(table.order)
      const saleEntry = {
        id: `venta-${Date.now()}`,
        tableId,
        total,
        paymentMethod,
        createdAt: Date.now(),
        items: table.order.items.map((item) => ({ ...item })),
      }

      return {
        ...prev,
        tables: prev.tables.map((item) => {
          if (item.id !== tableId) return item
          return {
            ...item,
            order: {
              ...item.order,
              pendingPayment: true,
              paid: true,
              sentToKitchen: false,
            },
          }
        }),
        dailySales: [...prev.dailySales, saleEntry],
        selectedTableId: tableId,
      }
    })
  }, [])

  const releaseTable = useCallback((tableId) => {
    setState((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => {
        if (table.id !== tableId) return table
        return { ...table, order: null }
      }),
      selectedTableId: null,
    }))
  }, [])

  const setRole = useCallback((role) => {
    setState((prev) => ({
      ...prev,
      userRole: role,
      currentView: role === 'cook' ? 'kitchen' : 'tables',
    }))
  }, [])

  const resetDay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dailySales: [],
      currentView: 'tables',
    }))
  }, [])

  const currentOrderTotal = useMemo(
    () => (selectedTable?.order ? sumOrder(selectedTable.order) : 0),
    [selectedTable],
  )

  const closePayment = useCallback(() => {
    setPaymentSelection({ open: false, tableId: null, total: 0, method: null })
  }, [])

  const openPayment = useCallback(
    (tableId) => {
      setPaymentSelection({ open: true, tableId, total: currentOrderTotal, method: null })
    },
    [currentOrderTotal],
  )

  if (!state.userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50 md:p-10">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-cyan-200">
              <Sparkles size={18} />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Sistema POS</span>
            </div>
            <h1 className="text-3xl font-black text-white md:text-5xl">Ginita Restaurante</h1>
            <p className="mt-3 text-slate-300">Selecciona el perfil para continuar.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {USER_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className="group rounded-2xl border border-slate-700 bg-slate-800 p-5 text-left transition active:scale-[0.98] hover:border-cyan-400 hover:bg-slate-700"
              >
                <div className="mb-4 inline-flex rounded-xl bg-cyan-500/15 p-3 text-cyan-300">
                  <Icon size={28} />
                </div>
                <h2 className="text-xl font-bold text-white">{label}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {id === 'cashier'
                    ? 'Tomar pedidos, cobrar y gestionar mesas.'
                    : id === 'cook'
                      ? 'Ver órdenes activas por prioridad.'
                      : 'Configurar productos y precios.'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const showAdminPanel = state.userRole === 'admin' && state.currentView === 'admin'
  const showKitchenView = state.userRole === 'cook' || state.currentView === 'kitchen'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-4 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Restaurante local</p>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">Ginita POS</h1>
            </div>
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, userRole: null }))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-700">
              {getTodayLabel()}
            </div>

            {state.userRole !== 'cook' && (
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, currentView: 'tables' }))}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  state.currentView === 'tables' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Mesas
              </button>
            )}

            {(state.userRole === 'cashier' || state.userRole === 'admin' || state.userRole === 'cook') && (
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, currentView: 'kitchen' }))}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  state.currentView === 'kitchen' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cocina
              </button>
            )}

            {(state.userRole === 'admin' || state.userRole === 'cashier') && (
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, currentView: 'report' }))}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  state.currentView === 'report' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cierre día
              </button>
            )}

            {state.userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, currentView: 'admin' }))}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  state.currentView === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
        {showKitchenView && !showAdminPanel && state.currentView !== 'report' ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Vista de cocina</p>
                  <h2 className="text-xl font-black text-slate-900">Pedidos activos</h2>
                </div>
                <div className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white">
                  {kitchenQueue.length} pendientes
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {kitchenQueue.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 shadow-sm">
                  No hay órdenes pendientes.
                </div>
              ) : (
                kitchenQueue.map(({ tableId, order, type }) => (
                  <div key={tableId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{type}</p>
                        <h3 className="text-lg font-black text-slate-900">{tableId}</h3>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700">
                        <Clock3 size={14} />
                        {new Date(order.arrivedAt).toLocaleTimeString('es-EC', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {item.qty}x {item.name}
                              {item.cooking ? ` • ${item.cooking}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-500">{item.category}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(item.unitPrice * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => completeKitchenOrder(tableId)}
                      className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition active:scale-[0.99] hover:bg-emerald-500"
                    >
                      Despachar / Completado
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : state.currentView === 'report' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Cierre del día</p>
                <h2 className="text-xl font-black text-slate-900">Resumen financiero</h2>
              </div>
              <button
                type="button"
                onClick={resetDay}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Reiniciar ventas del día
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl bg-slate-900 p-4 text-white">
                <p className="text-sm text-slate-300">Total recaudado</p>
                <p className="mt-2 text-2xl font-black">{formatCurrency(todaysRevenue)}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-sm text-emerald-700">Efectivo</p>
                <p className="mt-2 text-xl font-black text-emerald-900">{formatCurrency(reportBreakdown.efectivo)}</p>
              </div>
              <div className="rounded-2xl bg-cyan-50 p-4 ring-1 ring-cyan-100">
                <p className="text-sm text-cyan-700">Transferencia</p>
                <p className="mt-2 text-xl font-black text-cyan-900">{formatCurrency(reportBreakdown.transferencia)}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                <p className="text-sm text-amber-700">Pescados</p>
                <p className="mt-2 text-xl font-black text-amber-900">{formatCurrency(reportBreakdown.Pescados)}</p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
                <p className="text-sm text-violet-700">Bebidas</p>
                <p className="mt-2 text-xl font-black text-violet-900">{formatCurrency(reportBreakdown.Bebidas)}</p>
              </div>
            </div>
          </div>
        ) : showAdminPanel ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Panel administrador</p>
                <h2 className="text-xl font-black text-slate-900">Ajuste de precios</h2>
              </div>
            </div>

            <div className="space-y-2">
              {PRODUCT_CATALOG.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{product.name}</p>
                    <p className="text-[11px] text-slate-500">{product.category}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={Number(state.basePrices[product.id] || 0)}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setState((prev) => ({
                        ...prev,
                        basePrices: {
                          ...prev.basePrices,
                          [product.id]: value,
                        },
                      }))
                    }}
                    className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-2 text-right text-sm font-bold text-slate-900 outline-none focus:border-cyan-400"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Estado de mesas</p>
                  <h2 className="text-xl font-black text-slate-900">Control operativo</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Libre</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-red-500" />Ocupada</span>
                  <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-orange-500" />Pendiente</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {state.tables.map((table) => (
                  <TableButton
                    key={table.id}
                    table={table}
                    status={getTableStatus(table)}
                    isActive={selectedTable?.id === table.id}
                    onClick={() => openTable(table.id)}
                  />
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {selectedTable ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pedido actual</p>
                      <h3 className="text-xl font-black text-slate-900">{selectedTable.id}</h3>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-700">
                      {selectedTable.order?.paid ? 'Cobrado' : selectedTable.order?.pendingPayment ? 'Pendiente' : 'Abierto'}
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {COOKING_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSelectedCooking(mode)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                          selectedCooking === mode ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {mode === 'frito' ? 'Frito' : 'Al vapor'}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowProductPicker(true)}
                      className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] hover:bg-cyan-500"
                    >
                      Agregar producto
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-100 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Acciones rápidas</span>
                      <span>Empanadas</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {QUICK_ITEMS.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => addProductToOrder('empanada', item.qty)}
                          className="rounded-xl bg-white px-2 py-2 text-xs font-bold text-slate-700"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-base font-black text-slate-900">Detalle</h4>
                      <div className="rounded-xl bg-white px-2 py-1 text-[11px] font-bold text-slate-700">
                        {selectedTable.order?.items.length || 0} items
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedTable.order?.items.length ? (
                        selectedTable.order.items.map((item) => (
                          <div key={item.key} className="rounded-xl bg-white p-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-slate-800">
                                {item.name}
                                {item.cooking ? ` (${item.cooking})` : ''}
                              </span>
                              <span className="text-sm font-black text-slate-900">{formatCurrency(item.unitPrice * item.qty)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => updateItemQty(item.key, -1)} className="h-7 w-7 rounded-lg bg-slate-200 font-black text-slate-800">-</button>
                                <span className="min-w-7 text-center text-sm font-bold text-slate-900">{item.qty}</span>
                                <button type="button" onClick={() => updateItemQty(item.key, 1)} className="h-7 w-7 rounded-lg bg-slate-900 font-black text-white">+</button>
                              </div>
                              <button type="button" onClick={() => removeItem(item.key)} className="text-[10px] font-bold uppercase tracking-wide text-red-600">Eliminar</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-center text-sm text-slate-500">Todavía no hay productos en la mesa.</p>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-900 p-3 text-white">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300">Total</span>
                        <span className="text-xl font-black">{formatCurrency(currentOrderTotal)}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {!selectedTable.order?.paid && selectedTable.order && selectedTable.order.items.length > 0 && (
                        <button
                          type="button"
                          onClick={sendToKitchen}
                          className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] hover:bg-red-500"
                        >
                          Enviar a Cocina
                        </button>
                      )}

                      {(selectedTable.order?.sentToKitchen || selectedTable.order?.pendingPayment) && !selectedTable.order?.paid && (
                        <button
                          type="button"
                          onClick={() => openPayment(selectedTable.id)}
                          className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition active:scale-[0.99] hover:bg-emerald-500"
                        >
                          Cobrar
                        </button>
                      )}

                      {selectedTable.order?.paid && (
                        <button
                          type="button"
                          onClick={() => releaseTable(selectedTable.id)}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                        >
                          Desocupar mesa
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-slate-500">
                  Selecciona una mesa para abrir el pedido.
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      {showProductPicker && selectedTable && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="flex h-full max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Catálogo</p>
                <h3 className="text-lg font-black text-slate-900">Agregar producto a {selectedTable.id}</h3>
              </div>
              <button type="button" onClick={() => setShowProductPicker(false)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">Listo</button>
            </div>

            <div className="grid gap-2 overflow-y-auto p-3 sm:grid-cols-2">
              {PRODUCT_CATALOG.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductToOrder(product.id, 1)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900">{product.name}</div>
                    <div className="text-[11px] text-slate-500">{product.category}</div>
                  </div>
                  <div className="text-sm font-black text-slate-900">{formatCurrency(productPrices[product.id])}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {paymentSelection.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 p-3">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-4 shadow-2xl">
            {!paymentSelection.method ? (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Cobro</p>
                    <h3 className="text-xl font-black text-slate-900">Total: {formatCurrency(paymentSelection.total)}</h3>
                  </div>
                  <button type="button" onClick={() => setPaymentSelection({ open: false, tableId: null, total: 0, method: null })} className="text-sm font-bold text-slate-500">Cerrar</button>
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      finalizePayment(paymentSelection.tableId, 'efectivo')
                      closePayment()
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-base font-black text-white"
                  >
                    <CreditCard size={18} />
                    Efectivo
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSelection((prev) => ({ ...prev, method: 'transferencia' }))}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-4 text-base font-black text-white"
                  >
                    <CreditCard size={18} />
                    Transferencia
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Transferencia</p>
                    <h3 className="text-base font-black text-slate-900">Cuenta de ahorros Yolanda Morales  14158468</h3>
                  </div>
                  <button type="button" onClick={() => setPaymentSelection({ open: false, tableId: null, total: 0, method: null })} className="text-sm font-bold text-slate-500">Cerrar</button>
                </div>

                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <img src="/qr.png" alt="Código QR para transferencia" className="mx-auto h-56 w-56 rounded-xl object-cover" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    finalizePayment(paymentSelection.tableId, 'transferencia')
                    closePayment()
                  }}
                  className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-base font-black text-white"
                >
                  Confirmar pago por transferencia
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
