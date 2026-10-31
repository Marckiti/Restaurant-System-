import { useState } from 'react'
import { Plus, Minus, X, Check, UtensilsCrossed, Package, Layers } from 'lucide-react'
import { formatCurrency } from '../logic.js'

const PORTIONS = [
  { id: 'porcion-papa', name: 'Porción de Papa', price: 1.0, icon: '🥔' },
  { id: 'porcion-tostado', name: 'Porción de Tostado', price: 0.5, icon: '🌽' },
  { id: 'porcion-curtido', name: 'Porción de Curtido', price: 0.5, icon: '🧅' },
]

export default function PortionModal({ isOpen, basePrices, onConfirm, onClose }) {
  const [selectedPortionId, setSelectedPortionId] = useState('porcion-papa')
  const [serviceType, setServiceType] = useState('servir') // 'servir' | 'llevar'
  const [qty, setQty] = useState(1)

  if (!isOpen) return null

  const selectedPortion = PORTIONS.find((p) => p.id === selectedPortionId) || PORTIONS[0]
  const unitPrice = Number(basePrices?.[selectedPortion.id] ?? selectedPortion.price)
  const total = unitPrice * qty

  const handleConfirm = () => {
    onConfirm({
      portionId: selectedPortion.id,
      name: selectedPortion.name,
      unitPrice,
      serviceType,
      qty,
    })
    setQty(1)
    setServiceType('servir')
    setSelectedPortionId('porcion-papa')
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
              <Layers size={22} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Acompañamientos
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Seleccionar Porción Extra
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Cerrar modal de porción"
          >
            <X size={20} />
          </button>
        </div>

        {/* Portion Types Options */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-slate-700 block">
            Elige la porción:
          </label>
          {PORTIONS.map((portion) => {
            const isSelected = selectedPortionId === portion.id
            const price = Number(basePrices?.[portion.id] ?? portion.price)

            return (
              <button
                key={portion.id}
                type="button"
                onClick={() => setSelectedPortionId(portion.id)}
                className={`w-full min-h-[50px] p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{portion.icon}</span>
                  <span className="text-sm font-bold text-slate-900">
                    {portion.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 tabular-nums">
                    {formatCurrency(price)}
                  </span>
                  {isSelected && (
                    <span className="h-5 w-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
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

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 mb-4">
          <span className="text-xs font-semibold text-slate-700">Cantidad:</span>
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
            Agregar {qty} {selectedPortion.name}{' '}
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
