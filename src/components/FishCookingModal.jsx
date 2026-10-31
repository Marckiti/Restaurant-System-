import { useState } from 'react'
import {
  Fish,
  Flame,
  Wind,
  Plus,
  Minus,
  X,
  Check,
  UtensilsCrossed,
  Package,
  FileText,
} from 'lucide-react'
import { formatCurrency } from '../logic.js'

const QUICK_SPECS = [
  'Curtido aparte',
  'Bien frito',
  'Poco frito',
  'Sin cebolla',
  'Sin tostado',
  'Bien dorado',
]

export default function FishCookingModal({ isOpen, product, onConfirm, onClose }) {
  const [cookingMode, setCookingMode] = useState('frito')
  const [serviceType, setServiceType] = useState('servir') // 'servir' | 'llevar'
  const [notes, setNotes] = useState('')
  const [qty, setQty] = useState(1)

  if (!isOpen || !product) return null

  const baseUnitPrice = product.price || product.basePrice || 0
  const takeoutExtra = serviceType === 'llevar' ? 0.25 : 0
  const finalUnitPrice = baseUnitPrice + takeoutExtra
  const total = finalUnitPrice * qty

  const handleToggleSpec = (spec) => {
    setNotes((prev) => {
      const parts = prev
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
      if (parts.includes(spec)) {
        return parts.filter((p) => p !== spec).join(', ')
      }
      return parts.length ? `${prev}, ${spec}` : spec
    })
  }

  const handleConfirm = () => {
    onConfirm({
      cookingMode,
      serviceType, // 'servir' | 'llevar'
      takeoutExtra,
      unitPrice: finalUnitPrice,
      notes: notes.trim(),
      qty,
    })
    // Reset state
    setQty(1)
    setCookingMode('frito')
    setServiceType('servir')
    setNotes('')
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
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-10 max-h-[92vh] overflow-y-auto">
        {/* Grab bar for touch */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
              <Fish size={24} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Preparación de Pescado
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {product.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Cerrar selección de preparación"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. Modalidad: Para Servir o Para Llevar */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Destino del pedido:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setServiceType('servir')}
              className={`min-h-[46px] p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
                serviceType === 'servir'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <UtensilsCrossed size={16} />
              <span>Para Servir (Mesa)</span>
            </button>

            <button
              type="button"
              onClick={() => setServiceType('llevar')}
              className={`min-h-[46px] p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
                serviceType === 'llevar'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Package size={16} />
              <span>Para Llevar (+ $0.25)</span>
            </button>
          </div>
          {serviceType === 'llevar' && (
            <p className="text-[11px] font-semibold text-orange-700 mt-1.5 ml-1">
              * Se incluye $0.25 por envase térmico para llevar.
            </p>
          )}
        </div>

        {/* 2. Cocción: Frito o Al Vapor */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Tipo de preparación:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* FRITO */}
            <button
              type="button"
              onClick={() => setCookingMode('frito')}
              className={`min-h-[80px] p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-[0.98] ${
                cookingMode === 'frito'
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-1.5 rounded-xl ${
                    cookingMode === 'frito'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <Flame size={16} />
                </div>
                {cookingMode === 'frito' && (
                  <span className="h-5 w-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Frito</span>
                <span className="text-[10px] text-slate-500 block">
                  Dorado y crujiente
                </span>
              </div>
            </button>

            {/* AL VAPOR */}
            <button
              type="button"
              onClick={() => setCookingMode('al vapor')}
              className={`min-h-[80px] p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-[0.98] ${
                cookingMode === 'al vapor'
                  ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/30'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-1.5 rounded-xl ${
                    cookingMode === 'al vapor'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <Wind size={16} />
                </div>
                {cookingMode === 'al vapor' && (
                  <span className="h-5 w-5 rounded-full bg-sky-600 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">Al vapor</span>
                <span className="text-[10px] text-slate-500 block">
                  Cocido jugoso
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Especificaciones para la cocina (Curtido aparte, bien frito, etc.) */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-slate-800">
            <FileText size={14} className="text-slate-500" />
            <span>Especificaciones para cocina:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {QUICK_SPECS.map((spec) => {
              const isSelected = notes.includes(spec)
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => handleToggleSpec(spec)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-semibold transition active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {spec}
                </button>
              )
            })}
          </div>

          <input
            type="text"
            placeholder="Nota personalizada (ej. sin sal, salsa aparte...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[38px] px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* 4. Cantidad Stepper */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 mb-4">
          <span className="text-xs font-semibold text-slate-700">Cantidad de platos:</span>
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
          className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-slate-900 text-white font-bold text-sm flex items-center justify-between shadow-lg shadow-slate-900/10 active:scale-[0.98] transition hover:bg-slate-800"
        >
          <span>
            Agregar {qty} {cookingMode === 'frito' ? 'Frito' : 'Al vapor'}{' '}
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
