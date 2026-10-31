export const PRODUCT_CATALOG = [
  // 1. Categoría Pescados (Pescados grande/pequeño, Almejas, Porciones)
  {
    id: 'pescado-grande',
    name: 'Pescado Grande',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 5.0,
    requiresCooking: true,
    supportsTakeout: true,
  },
  {
    id: 'pescado-pequeno',
    name: 'Pescado Pequeño',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 4.5,
    requiresCooking: true,
    supportsTakeout: true,
  },
  {
    id: 'almejas',
    name: 'Almejas',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 1.5,
    isAlmejas: true,
    supportsTakeout: true,
  },
  {
    id: 'porciones',
    name: 'Porciones Extra (Papa, Tostado, Curtido)',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 1.0,
    isPortionSelector: true,
  },
  {
    id: 'porcion-papa',
    name: 'Porción de Papa',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 1.0,
    hiddenInCatalog: true,
  },
  {
    id: 'porcion-tostado',
    name: 'Porción de Tostado',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 0.5,
    hiddenInCatalog: true,
  },
  {
    id: 'porcion-curtido',
    name: 'Porción de Curtido',
    category: 'Pescados',
    section: 'pescados',
    basePrice: 0.5,
    hiddenInCatalog: true,
  },

  // 2. Categoría Morocho y Coladas (Combo morocho, Solo morocho, Coladas, Empanadas)
  {
    id: 'combo-morocho',
    name: 'Combo Morocho (con 2 empanadas)',
    category: 'Morocho',
    section: 'morocho',
    basePrice: 1.75,
  },
  {
    id: 'morocho',
    name: 'Solo Morocho',
    category: 'Morocho',
    section: 'morocho',
    basePrice: 1.25,
  },
  {
    id: 'combo-colada',
    name: 'Combo Colada Morada (con 2 empanadas)',
    category: 'Coladas',
    section: 'morocho',
    basePrice: 1.75,
  },
  {
    id: 'vaso-colada',
    name: 'Solo Colada Morada',
    category: 'Coladas',
    section: 'morocho',
    basePrice: 1.25,
  },
  {
    id: 'empanada',
    name: 'Empanadas',
    category: 'Empanadas',
    section: 'morocho',
    basePrice: 0.25,
    isEmpanada: true,
  },

  // 3. Categoría Bebidas (Limonadas, Colas, Aguas, Cervezas)
  {
    id: 'limonada-jarra',
    name: 'Limonada Jarra',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 2.0,
  },
  {
    id: 'limonada-media',
    name: 'Media Jarra Limonada',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 1.0,
  },
  {
    id: 'cola-personal',
    name: 'Cola Personal',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 0.5,
  },
  {
    id: 'cola-litro',
    name: 'Cola 1 Litro',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 2.0,
  },
  {
    id: 'cola-3lt',
    name: 'Cola 3 Litros',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 4.0,
  },
  {
    id: 'agua',
    name: 'Agua sin gas',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 0.5,
  },
  {
    id: 'agua-gas',
    name: 'Agua con gas',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 0.75,
  },
  {
    id: 'cerveza',
    name: 'Cerveza',
    category: 'Bebidas',
    section: 'bebidas',
    basePrice: 3.75,
  },
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

export const PRODUCT_MAP = Object.fromEntries(
  PRODUCT_CATALOG.map((product) => [product.id, product]),
)

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

export const money = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
})

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
  const base = Number(basePrices[productId] ?? PRODUCT_MAP[productId]?.basePrice ?? 0)
  if (productId === 'combo-colada') return isSunday() ? 2.0 : base
  if (productId === 'vaso-colada') return isSunday() ? 1.5 : base
  return base
}

export const sumOrder = (order) =>
  order?.items?.reduce(
    (total, item) => total + Number(item.unitPrice) * Number(item.qty),
    0,
  ) || 0

export const getTableStatus = (table) => {
  if (!table?.order || !Array.isArray(table.order.items) || table.order.items.length === 0) {
    return 'free'
  }
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
  arrivedAt: null,
  sentToKitchen: false,
  hasBeenSent: false,
  kitchenDispatched: false,
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
      let category = item.category
      if (category === 'Morocho' || category === 'Empanadas') {
        category = 'Empanadas/Morocho'
      }
      if (category in totals) {
        totals[category] += value
      } else if (category === 'Pescados') {
        totals.Pescados += value
      }
    })
  })

  return totals
}

export const calculateFishSummary = (dailySales = []) => {
  const summary = {
    totalUnits: 0,
    grandeUnits: 0,
    pequenoUnits: 0,
    fritoUnits: 0,
    vaporUnits: 0,
    servirUnits: 0,
    llevarUnits: 0,
    totalRevenue: 0,
  }

  dailySales.forEach((sale) => {
    (sale.items || []).forEach((item) => {
      const isFish =
        item.productId === 'pescado-grande' ||
        item.productId === 'pescado-pequeno' ||
        (item.category === 'Pescados' &&
          (item.name?.toLowerCase().includes('pescado') || item.cooking))

      if (isFish) {
        const qty = Number(item.qty || 0)
        summary.totalUnits += qty
        summary.totalRevenue += Number(item.unitPrice || 0) * qty

        const nameLower = (item.name || '').toLowerCase()
        if (item.productId === 'pescado-grande' || nameLower.includes('grande')) {
          summary.grandeUnits += qty
        } else if (
          item.productId === 'pescado-pequeno' ||
          nameLower.includes('pequeño') ||
          nameLower.includes('pequeno')
        ) {
          summary.pequenoUnits += qty
        }

        if (item.cooking === 'frito') {
          summary.fritoUnits += qty
        } else if (item.cooking === 'al vapor') {
          summary.vaporUnits += qty
        }

        if (item.serviceType === 'llevar') {
          summary.llevarUnits += qty
        } else {
          summary.servirUnits += qty
        }
      }
    })
  })

  return summary
}
