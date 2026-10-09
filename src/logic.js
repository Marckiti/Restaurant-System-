export const PRODUCT_CATALOG = [
  { id: 'pescado-grande', name: 'Pescado Grande', category: 'Pescados', basePrice: 5.0, requiresCooking: true },
  { id: 'pescado-pequeno', name: 'Pescado Pequeño', category: 'Pescados', basePrice: 4.5, requiresCooking: true },
  { id: 'combo-morocho', name: 'Combo Morocho', category: 'Morocho', basePrice: 1.75 },
  { id: 'morocho', name: 'Solo Morocho', category: 'Morocho', basePrice: 1.25 },
  { id: 'empanada', name: 'Empanada suelta', category: 'Empanadas', basePrice: 0.25 },
  { id: 'almejas', name: 'Almejas', category: 'Mariscos', basePrice: 1.5 },
  { id: 'limonada-jarra', name: 'Limonada Jarra', category: 'Bebidas', basePrice: 2.0 },
  { id: 'limonada-media', name: 'Media Jarra', category: 'Bebidas', basePrice: 1.0 },
  { id: 'cola-personal', name: 'Cola Personal', category: 'Bebidas', basePrice: 0.5 },
  { id: 'cola-litro', name: 'Cola 1 Litro', category: 'Bebidas', basePrice: 2.0 },
  { id: 'cola-3lt', name: 'Cola 3 Litros', category: 'Bebidas', basePrice: 4.0 },
  { id: 'cerveza', name: 'Cerveza', category: 'Bebidas', basePrice: 3.75 },
  { id: 'combo-colada', name: 'Combo Colada Morada + 2 empanadas', category: 'Coladas', basePrice: 1.75 },
  { id: 'vaso-colada', name: 'Vaso de Colada Morada', category: 'Coladas', basePrice: 1.25 },
]

export const COOKING_MODES = ['frito', 'al vapor']
export const QUICK_ITEMS = [
  { key: 'quick-1', label: '+1 Empanada', qty: 1 },
  { key: 'quick-4', label: '+$1.00 (4)', qty: 4 },
  { key: 'quick-8', label: '+$2.00 (8)', qty: 8 },
]

export const DEFAULT_BASE_PRICES = Object.fromEntries(
  PRODUCT_CATALOG.map((product) => [product.id, product.basePrice]),
)

export const PRODUCT_MAP = Object.fromEntries(PRODUCT_CATALOG.map((product) => [product.id, product]))

export const buildInitialTables = () => {
  const interior = Array.from({ length: 12 }, (_, index) => ({
    id: `Mesa ${index + 1}`,
    type: 'Interior',
    order: null,
  }))

  const exterior = Array.from({ length: 3 }, (_, index) => ({
    id: `Exterior ${index + 1}`,
    type: 'Exterior',
    order: null,
  }))

  return [...interior, ...exterior]
}

export const money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })
export const formatCurrency = (value) => money.format(Number(value || 0))

export const getTodayLabel = () =>
  new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const isSunday = () => new Date().getDay() === 0

export const getProductPrice = (productId, basePrices) => {
  const base = Number(basePrices[productId] ?? 0)
  if (productId === 'combo-colada') return isSunday() ? 2.0 : base
  if (productId === 'vaso-colada') return isSunday() ? 1.5 : base
  return base
}

export const sumOrder = (order) =>
  order?.items?.reduce((total, item) => total + Number(item.unitPrice) * Number(item.qty), 0) || 0

export const getTableStatus = (table) => {
  if (!table.order) return 'free'
  if (table.order.paid || table.order.pendingPayment) return 'pending'
  return 'occupied'
}

export const getStatusStyles = (status) => {
  const map = {
    free: 'bg-emerald-500 text-white',
    occupied: 'bg-red-500 text-white',
    pending: 'bg-orange-500 text-white',
  }
  return map[status] || map.free
}

export const createOrder = () => ({
  id: `pedido-${Date.now()}`,
  arrivedAt: Date.now(),
  sentToKitchen: false,
  pendingPayment: false,
  paid: false,
  items: [],
})

export const buildDefaultState = () => ({
  userRole: null,
  selectedTableId: null,
  currentView: 'tables',
  tables: buildInitialTables(),
  basePrices: DEFAULT_BASE_PRICES,
  dailySales: [],
})

export const calculateDailySummary = (dailySales = []) => {
  const totals = {
    total: 0,
    efectivo: 0,
    transferencia: 0,
    Pescados: 0,
    Bebidas: 0,
    'Empanadas/Morocho': 0,
    Coladas: 0,
    Mariscos: 0,
  }

  dailySales.forEach((sale) => {
    const saleTotal = Number(sale.total || 0)
    totals.total += saleTotal

    const method = String(sale.paymentMethod || '').toLowerCase()
    if (method === 'efectivo') totals.efectivo += saleTotal
    if (method === 'transferencia') totals.transferencia += saleTotal

    sale.items.forEach((item) => {
      const value = Number(item.qty || 0) * Number(item.unitPrice || 0)
      const category = item.category === 'Morocho' || item.category === 'Empanadas' ? 'Empanadas/Morocho' : item.category
      if (category in totals) {
        totals[category] += value
      }
    })
  })

  return totals
}
