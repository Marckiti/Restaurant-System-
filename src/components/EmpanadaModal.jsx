import { useState } from 'react'
import { Plus, Minus, X, UtensilsCrossed, Package, Utensils } from 'lucide-react'
import { formatCurrency } from '../logic.js'

const PRESETS = [
  { label: '1 Empanada', qty: 1, sub: '$0.25' },
  { label: '4 Empanadas', qty: 4, sub: '$1.00' },
  { label: '8 Empanadas', qty: 8, sub: '$2.00' },
  { label: '12 Empanadas', qty: 12, sub: '$3.00' },
]

export default function EmpanadaModal({
  isOpen,
  unitPrice = 0.25,
  onConfirm,
  onClose,
}) {
  const [qty, setQty] = useState(4)
  const [serviceType, setServiceType] = useState('servir') // 'servir' | 'llevar'

  if (!isOpen) return null

  const total = unitPrice * qty

  const handleConfirm = () => {
    onConfirm({
      qty,
      unitPrice,
      serviceType,
    })
    setQty(4)
    setServiceType('servir')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Card */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-10 max-h-[90vh] overflow-y-auto">
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
              <Utensils size={22} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Acciones Rápidas
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Empanadas de Viento
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Cerrar selección de empanadas"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Presets Grid */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Selecciona la cantidad rápido:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = qty === preset.qty
              return (
                <button
                  key={preset.qty}
                  type="button"
                  onClick={() => setQty(preset.qty)}
                  className={`min-h-[50px] p-2.5 rounded-2xl border text-center transition active:scale-95 flex flex-col justify-center items-center ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    {preset.label}
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 tabular-nums">
                    {preset.sub}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Destination: Servir o Llevar */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Destino:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setServiceType('servir')}
              className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                serviceType === 'servir'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <UtensilsCrossed size={14} />
              <span>Para Servir</span>
            </button>

            <button
              type="button"
              onClick={() => setServiceType('llevar')}
              className={`min-h-[42px] px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                serviceType === 'llevar'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Package size={14} />
              <span>Para Llevar</span>
            </button>
          </div>
        </div>

        {/* Quantity Stepper for any amount */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 mb-4">
          <span className="text-xs font-semibold text-slate-700">Ajuste manual:</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              disabled={qty <= 1}
              className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              aria-label="Restar uno"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-8 text-center text-base font-bold text-slate-900 tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((prev) => prev + 1)}
              className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center active:scale-95 shadow-xs"
              aria-label="Sumar uno"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-slate-900/10 active:scale-[0.98] transition hover:bg-slate-800"
        >
          <span>
            Agregar {qty} {qty === 1 ? 'Empanada' : 'Empanadas'}{' '}
            {serviceType === 'llevar' ? '(Llevar)' : ''}
          </span>
          <span className="tabular-nums font-black text-amber-300">
            {formatCurrency(total)}
          </span>
        </button>
      </div>
    </div>
  )
}
