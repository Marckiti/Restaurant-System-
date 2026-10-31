import { useState } from 'react'
import { X, CreditCard, Banknote, QrCode, Check } from 'lucide-react'
import { formatCurrency } from '../logic.js'

export default function PaymentModal({
  isOpen,
  tableId,
  total,
  onConfirmPayment,
  onClose,
}) {
  const [method, setMethod] = useState('efectivo') // 'efectivo' | 'transferencia'
  const [cashGiven, setCashGiven] = useState(total)

  if (!isOpen) return null

  const change = Math.max(0, cashGiven - total)
  const quickCashOptions = [total, 5, 10, 20, 50].filter(
    (amt, index, self) => amt >= total && self.indexOf(amt) === index
  )

  const handleConfirm = () => {
    onConfirmPayment(method)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-5 z-10 max-h-[90vh] overflow-y-auto">
        {/* Grab bar for mobile */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cobro de Cuenta
            </span>
            <h3 className="text-xl font-black text-slate-900">{tableId}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            aria-label="Cerrar modal de pago"
          >
            <X size={20} />
          </button>
        </div>

        {/* Total to Pay */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total a pagar:</span>
            <span className="text-2xl font-black tabular-nums text-white">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <CreditCard size={22} />
          </div>
        </div>

        {/* Payment Method Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMethod('efectivo')}
            className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              method === 'efectivo'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <Banknote size={18} />
            <span>Efectivo</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('transferencia')}
            className={`min-h-[48px] py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
              method === 'transferencia'
                ? 'border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/20'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <QrCode size={18} />
            <span>Transferencia</span>
          </button>
        </div>

        {/* Method Details */}
        {method === 'efectivo' ? (
          <div className="space-y-3 mb-5">
            <span className="text-xs font-bold text-slate-600 block">
              Calculadora de cambio rápido:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickCashOptions.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashGiven(amt)}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-bold border transition active:scale-95 ${
                    cashGiven === amt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {amt === total ? 'Exacto' : formatCurrency(amt)}
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Cambio a entregar:</span>
              <span className="text-base font-black text-emerald-700 tabular-nums">
                {formatCurrency(change)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 text-center">
              <p className="text-xs font-bold text-sky-950">
                Cuenta de ahorros Yolanda Morales
              </p>
              <p className="text-sm font-black text-sky-800 tracking-wider">
                14158468
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
              <img
                src="/qr.png"
                alt="Código QR para transferencia bancaria"
                className="h-44 w-44 object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Confirm Payment Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[50px] py-3.5 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition hover:bg-emerald-500"
        >
          <Check size={18} strokeWidth={2.5} />
          <span>
            Confirmar Pago ({method === 'efectivo' ? 'Efectivo' : 'Transferencia'})
          </span>
        </button>
      </div>
    </div>
  )
}
