import { useState, useMemo } from 'react'
import {
  X,
  Plus,
  Minus,
  Trash2,
  Fish,
  Utensils,
  CupSoda,
  ChevronRight,
  Send,
  CreditCard,
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  Check,
  ChefHat,
} from 'lucide-react'
import {
  PRODUCT_CATALOG,
  formatCurrency,
  getProductPrice,
  sumOrder,
} from '../logic.js'

const SECTIONS = [
  { id: 'pescados', label: 'Pescados & Mariscos', icon: Fish },
  { id: 'morocho', label: 'Morocho & Coladas', icon: Utensils },
  { id: 'bebidas', label: 'Bebidas', icon: CupSoda },
]

export default function TableOrderDrawer({
  table,
  basePrices,
  onClose,
  onAddProduct,
  onOpenCookingModal,
  onOpenPortionModal,
  onOpenEmpanadaModal,
  onOpenAlmejasModal,
  onUpdateQty,
  onRemoveItem,
  onSendToKitchen,
  onOpenPayment,
  onReleaseTable,
}) {
  const [activeSection, setActiveSection] = useState('pescados')
  const [activeTab, setActiveTab] = useState('menu') // 'menu' | 'comanda'

  const order = table?.order
  const items = order?.items || []
  const orderTotal = sumOrder(order)
  const itemsCount = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  const unSentItems = items.filter((item) => !item.sent)
  const unSentCount = unSentItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  const hasUnSentItems = unSentCount > 0

  // Filter products by the 3 main requested categories (Pescados, Morocho, Bebidas)
  const sectionProducts = useMemo(() => {
    return PRODUCT_CATALOG.filter(
      (p) => p.section === activeSection && !p.hiddenInCatalog,
    )
  }, [activeSection])

  const handleProductClick = (product) => {
    if (product.requiresCooking) {
      // Pescados (grande, pequeño) -> abre flotante de pescado con Frito/Vapor, Para Llevar y Notas
      const price = getProductPrice(product.id, basePrices)
      onOpenCookingModal({ ...product, price })
    } else if (product.isPortionSelector) {
      // Porciones -> abre flotante para seleccionar Papa, Tostado o Curtido
      onOpenPortionModal()
    } else if (product.isEmpanada) {
      // Empanadas -> abre flotante rápido de cantidades (+1, +4, +8, +12)
      onOpenEmpanadaModal()
    } else if (product.isAlmejas) {
      // Almejas -> abre flotante de almejas con opción de llevar y notas
      onOpenAlmejasModal()
    } else {
      // Bebidas, combos morocho, coladas directos
      onAddProduct(product.id, 1)
    }
  }

  if (!table) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div className="relative w-full sm:max-w-xl h-[92vh] sm:h-[86vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden border border-slate-200">
        {/* Top Handle on Mobile */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Drawer Header */}
        <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {table.id}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                {table.type}
              </span>
              {order?.paid && (
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-teal-100 text-teal-800">
                  Pagada
                </span>
              )}
              {order?.sentToKitchen && !order?.paid && (
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-900">
                  En cocina
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {itemsCount === 0
                ? 'Mesa lista para tomar pedido'
                : `${itemsCount} ${itemsCount === 1 ? 'producto' : 'productos'} en la orden`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Cerrar comanda"
          >
            <X size={20} />
          </button>
        </header>

        {/* Quick Mode Switcher: [Menú del Restaurante] vs [Comanda Actual] */}
        <div className="px-4 pt-2 pb-1 border-b border-slate-100 flex items-center gap-2 shrink-0 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'menu'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80'
            }`}
          >
            <Plus size={14} />
            <span>Menú & Agregar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comanda')}
            className={`flex-1 min-h-[40px] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'comanda'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Ver Comanda ({itemsCount})</span>
            {itemsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {formatCurrency(orderTotal)}
              </span>
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {activeTab === 'menu' ? (
            <div className="space-y-4">
              {/* 3 Main Requested Categories Tabs */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Categoría
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
                  {SECTIONS.map((sec) => {
                    const Icon = sec.icon
                    const isSelected = activeSection === sec.id

                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSection(sec.id)}
                        className={`min-h-[40px] px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={15} />
                        <span className="truncate">{sec.label.split('&')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Products Grid for Active Category */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-900">
                    {activeSection === 'pescados'
                      ? 'Pescados, Almejas & Porciones'
                      : activeSection === 'morocho'
                        ? 'Morocho, Coladas & Empanadas'
                        : 'Limonadas, Colas, Aguas & Cervezas'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Toca para configurar u ordenar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sectionProducts.map((product) => {
                    const price = getProductPrice(product.id, basePrices)
                    const isFish = product.requiresCooking
                    const isPortion = product.isPortionSelector
                    const isEmpanada = product.isEmpanada
                    const isAlmejas = product.isAlmejas

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductClick(product)}
                        className={`min-h-[64px] p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition active:scale-[0.98] ${
                          isFish
                            ? 'border-amber-200/90 bg-amber-50/50 hover:bg-amber-100/60'
                            : isPortion
                              ? 'border-purple-200/90 bg-purple-50/40 hover:bg-purple-100/60'
                              : isEmpanada
                                ? 'border-orange-200/90 bg-orange-50/40 hover:bg-orange-100/60'
                                : isAlmejas
                                  ? 'border-teal-200/90 bg-teal-50/40 hover:bg-teal-100/60'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isFish
                                ? 'bg-amber-100 text-amber-800'
                                : isPortion
                                  ? 'bg-purple-100 text-purple-800'
                                  : isEmpanada
                                    ? 'bg-orange-100 text-orange-800'
                                    : isAlmejas
                                      ? 'bg-teal-100 text-teal-800'
                                      : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isFish || isAlmejas ? (
                              <Fish size={18} strokeWidth={2.2} />
                            ) : isPortion ? (
                              <Layers size={18} strokeWidth={2.2} />
                            ) : (
                              <Utensils size={18} strokeWidth={2.2} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {product.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {isFish
                                ? '⚡ Frito/Vapor · Llevar/Mesa'
                                : isPortion
                                  ? '🥔 Papa · 🌽 Tostado · 🧅 Curtido'
                                  : isEmpanada
                                    ? '⚡ Selección rápida de cantidad'
                                    : isAlmejas
                                      ? '⚡ Para servir o llevar'
                                      : product.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isPortion && (
                            <span className="text-xs font-black text-slate-900 tabular-nums">
                              {formatCurrency(price)}
                            </span>
                          )}
                          <span className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Plus size={14} />
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* COMANDA VIEW */
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingBag size={40} className="mx-auto mb-3 opacity-40 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-600">
                    No hay productos en esta mesa todavía.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cambia a la pestaña &ldquo;Menú & Agregar&rdquo; para tomar el pedido.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Ver menú</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-sm font-bold text-slate-900">
                              {item.name}
                            </span>

                            {/* Takeout vs Dine-in Badge */}
                            {item.serviceType === 'llevar' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 uppercase">
                                <Package size={11} />
                                Para Llevar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                En Mesa
                              </span>
                            )}

                            {/* Cooking Mode Badge */}
                            {item.cooking && (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${
                                  item.cooking === 'frito'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-sky-100 text-sky-900'
                                }`}
                              >
                                {item.cooking}
                              </span>
                            )}

                            {/* Sent to Kitchen Badge */}
                            {item.sent ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check size={10} strokeWidth={3} />
                                Enviado a cocina
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Pendiente envío
                              </span>
                            )}
                          </div>

                          {/* Notes for Kitchen */}
                          {item.notes && (
                            <p className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-1">
                              Nota: &ldquo;{item.notes}&rdquo;
                            </p>
                          )}

                          <div className="text-xs text-slate-500 tabular-nums">
                            {formatCurrency(item.unitPrice)} c/u
                            {item.takeoutExtra ? ' (+$0.25 envase)' : ''}
                          </div>
                        </div>

                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {formatCurrency(item.unitPrice * item.qty)}
                        </span>
                      </div>

                      {/* Stepper & Delete */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.key, -1)}
                            className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold active:scale-95"
                            aria-label={`Restar ${item.name}`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold text-slate-900 tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.key, 1)}
                            className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold active:scale-95"
                            aria-label={`Sumar ${item.name}`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.key)}
                          className="min-h-[36px] px-2.5 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl flex items-center gap-1 active:scale-95 transition"
                        >
                          <Trash2 size={14} />
                          <span>Quitar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer with Summary and Big Waiter Action Button */}
        <footer className="p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Total de la mesa
              </span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {formatCurrency(orderTotal)}
              </span>
            </div>

            {itemsCount > 0 && activeTab === 'menu' && (
              <button
                type="button"
                onClick={() => setActiveTab('comanda')}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <span>{itemsCount} ítems en comanda</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons based on state */}
          <div className="grid gap-2">
            {/* 1. Only show Enviar a Cocina if there are items NOT yet sent to kitchen */}
            {hasUnSentItems && !order?.paid && (
              <button
                type="button"
                onClick={onSendToKitchen}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 active:scale-[0.98] transition hover:bg-amber-500"
              >
                <Send size={16} />
                <span>
                  {order?.hasBeenSent
                    ? `Enviar ${unSentCount} nuevo(s) ítem(s) a Cocina`
                    : `Enviar Pedido a Cocina (${unSentCount})`}
                </span>
              </button>
            )}

            {/* 2. Informative banner when all current items have already been sent to kitchen */}
            {!hasUnSentItems && itemsCount > 0 && !order?.paid && (
              <div className="p-1 rounded-2xl">
                {order?.sentToKitchen ? (
                  <div className="text-amber-900 bg-amber-50 border border-amber-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                    <ChefHat size={16} className="text-amber-600" />
                    <span>Pedido en Cocina (En preparación)</span>
                  </div>
                ) : (
                  <div className="text-emerald-900 bg-emerald-50 border border-emerald-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold">
                    <Check size={16} className="text-emerald-600" />
                    <span>Pedido Despachado por Cocina</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. Collect payment button (only shown if there are items) */}
            {itemsCount > 0 && !order?.paid && (
              <button
                type="button"
                onClick={() => onOpenPayment(table.id)}
                className={`w-full min-h-[48px] py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition ${
                  !hasUnSentItems
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <CreditCard size={16} />
                <span>Cobrar Cuenta ({formatCurrency(orderTotal)})</span>
              </button>
            )}

            {/* 4. If paid, can release/vacate the table */}
            {order?.paid && (
              <button
                type="button"
                onClick={() => onReleaseTable(table.id)}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl border-2 border-slate-900 bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-slate-800"
              >
                <Sparkles size={16} />
                <span>Desocupar / Liberar Mesa</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
