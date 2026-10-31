import { memo } from 'react'
import { Clock, ChefHat, Check, DollarSign } from 'lucide-react'
import { getTableStatus, sumOrder, formatCurrency } from '../logic.js'

function TableCard({ table, isSelected, onClick }) {
  const status = getTableStatus(table)
  const order = table.order
  const itemsCount = order?.items?.reduce((sum, item) => sum + (Number(item.qty) || 0), 0) || 0
  const orderTotal = order ? sumOrder(order) : 0

  // Status visual variants - clean, professional, non-garish
  const getCardStyle = () => {
    if (status === 'free') {
      return 'border-slate-200/90 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
    }
    if (order?.paid) {
      return 'border-teal-300 bg-teal-50/50 text-teal-950'
    }
    if (order?.pendingPayment) {
      return 'border-indigo-300 bg-indigo-50/60 text-indigo-950'
    }
    // Occupied or in kitchen
    return 'border-amber-300 bg-amber-50/60 text-amber-950'
  }

  const getStatusBadge = () => {
    if (status === 'free') {
      return (
        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          Disponible
        </span>
      )
    }
    if (order?.paid) {
      return (
        <span className="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
          <Check size={12} strokeWidth={2.5} />
          Pagada
        </span>
      )
    }
    if (order?.pendingPayment) {
      return (
        <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
          <DollarSign size={12} strokeWidth={2.5} />
          Por cobrar
        </span>
      )
    }
    if (order?.sentToKitchen) {
      return (
        <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
          <ChefHat size={12} strokeWidth={2.5} />
          En cocina
        </span>
      )
    }
    return (
      <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
        <Clock size={12} strokeWidth={2.5} />
        Ocupada
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[96px] p-3.5 rounded-2xl border text-left shadow-xs transition-all active:scale-[0.98] flex flex-col justify-between ${
        isSelected
          ? 'ring-2 ring-slate-900 border-slate-900 shadow-md'
          : getCardStyle()
      }`}
    >
      {/* Top row: Type & Status */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          {table.type}
        </span>
        {getStatusBadge()}
      </div>

      {/* Center: Table Number */}
      <div className="my-1">
        <div className="text-xl font-black text-slate-900 tracking-tight">
          {table.id}
        </div>
      </div>

      {/* Bottom row: Order items count or Price */}
      <div className="flex items-center justify-between text-xs font-medium pt-1 border-t border-slate-100/80 w-full">
        {status === 'free' ? (
          <span className="text-slate-400 text-[11px]">Toca para abrir</span>
        ) : (
          <>
            <span className="text-slate-600 text-[11px] font-semibold">
              {itemsCount} {itemsCount === 1 ? 'plato' : 'platos'}
            </span>
            <span className="text-slate-900 font-bold tabular-nums">
              {formatCurrency(orderTotal)}
            </span>
          </>
        )}
      </div>
    </button>
  )
}

export default memo(TableCard)
