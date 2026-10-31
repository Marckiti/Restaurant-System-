import { useState } from 'react'
import { Plus, Minus, X, UtensilsCrossed, Package, Fish, FileText } from 'lucide-react'
import { formatCurrency } from '../logic.js'

export default function AlmejasModal({
  isOpen,
  unitPrice = 1.5,
  onConfirm,
  onClose,
}) {
  const [qty, setQty] = useState(1)
  const [serviceType, setServiceType] = useState('servir') // 'servir' | 'llevar'
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const total = unitPrice * qty

  const handleConfirm = () => {
    onConfirm({
      qty,
      unitPrice,
      serviceType,
      notes: notes.trim(),
    })
    setQty(1)
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
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 z-10 max-h-[90vh] overflow-y-auto">
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
              <Fish size={22} />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                Mariscos
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Almejas ($1.50)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Cerrar selección de almejas"
          >
            <X size={20} />
          </button>
        </div>

        {/* Destination: Servir o Llevar */}
        <div className="mb-4">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Destino del pedido:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setServiceType('servir')}
              className={`min-h-[46px] px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                serviceType === 'servir'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <UtensilsCrossed size={16} />
              <span>Para Servir</span>
            </button>

            <button
              type="button"
              onClick={() => setServiceType('llevar')}
              className={`min-h-[46px] px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                serviceType === 'llevar'
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Package size={16} />
              <span>Para Llevar (Sin recargo)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 ml-1">
            * Se informa a cocina para empaque adecuado.
          </p>
        </div>

        {/* Notes for Kitchen */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-slate-800">
            <FileText size={14} className="text-slate-500" />
            <span>Nota especial para cocina:</span>
          </div>
          <input
            type="text"
            placeholder="Ej. con limón aparte, bien caliente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[38px] px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
          />
        </div>

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 mb-4">
          <span className="text-xs font-semibold text-slate-700">Cantidad de porciones:</span>
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
            Agregar {qty} {qty === 1 ? 'Almeja' : 'Almejas'}{' '}
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
