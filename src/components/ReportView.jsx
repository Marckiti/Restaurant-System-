import { useState } from 'react'
import {
  Banknote,
  QrCode,
  DollarSign,
  RotateCcw,
  Fish,
  Utensils,
  CupSoda,
  Soup,
} from 'lucide-react'
import {
  formatCurrency,
  calculateDailySummary,
  calculateFishSummary,
  getTodayLabel,
} from '../logic.js'

export default function ReportView({ dailySales, onResetDay }) {
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const summary = calculateDailySummary(dailySales)
  const fishSummary = calculateFishSummary(dailySales)

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Top Header Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {getTodayLabel()}
            </span>
            <h2 className="text-xl font-black text-slate-900">
              Cierre de Caja Diario
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmReset(true)}
            className="min-h-[38px] px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            <RotateCcw size={14} />
            <span>Reiniciar Día</span>
          </button>
        </div>

        {/* Main Revenue Card */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Total Recaudado Hoy
            </span>
            <span className="text-3xl font-black tabular-nums text-white">
              {formatCurrency(summary.total)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {dailySales.length} {dailySales.length === 1 ? 'venta registrada' : 'ventas registradas'}
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
            <DollarSign size={26} />
          </div>
        </div>
      </div>

      {/* Payment Methods Split */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50">
              <Banknote size={18} />
            </div>
            <span className="text-xs font-bold">Efectivo</span>
          </div>
          <span className="text-xl font-black text-slate-900 tabular-nums block">
            {formatCurrency(summary.efectivo)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-sky-700 mb-2">
            <div className="p-1.5 rounded-lg bg-sky-50">
              <QrCode size={18} />
            </div>
            <span className="text-xs font-bold">Transferencia</span>
          </div>
          <span className="text-xl font-black text-slate-900 tabular-nums block">
            {formatCurrency(summary.transferencia)}
          </span>
        </div>
      </div>

      {/* FISH SUMMARY SECTION - Requested by user */}
      <div className="p-4 rounded-3xl bg-white border border-amber-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Fish size={20} strokeWidth={2.3} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Resumen de Pescados Vendidos
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                Control de inventario y despacho de cocina
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">Total pescados:</span>
            <span className="text-xl font-black text-amber-700 tabular-nums">
              {fishSummary.totalUnits} {fishSummary.totalUnits === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Tamaños */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Por Tamaño
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Grandes:</span>
                <span className="font-black text-slate-900 tabular-nums">
                  {fishSummary.grandeUnits}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Pequeños:</span>
                <span className="font-black text-slate-900 tabular-nums">
                  {fishSummary.pequenoUnits}
                </span>
              </div>
            </div>
          </div>

          {/* Cocción */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-800/80 block mb-1">
              Preparación
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900">Fritos:</span>
                <span className="font-black text-amber-950 tabular-nums">
                  {fishSummary.fritoUnits}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-800">Al vapor:</span>
                <span className="font-black text-sky-950 tabular-nums">
                  {fishSummary.vaporUnits}
                </span>
              </div>
            </div>
          </div>

          {/* Destino */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Modalidad
            </span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">En mesa:</span>
                <span className="font-black text-slate-900 tabular-nums">
                  {fishSummary.servirUnits}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-orange-700">Para llevar:</span>
                <span className="font-black text-orange-950 tabular-nums">
                  {fishSummary.llevarUnits}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Recaudación total por pescados:</span>
          <span className="font-black text-slate-900 tabular-nums">
            {formatCurrency(fishSummary.totalRevenue)}
          </span>
        </div>
      </div>

      {/* Sales by Category */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Ventas por Categoría
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Fish size={15} className="text-amber-700" />
              Pescados
            </span>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {formatCurrency(summary.Pescados)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Utensils size={15} className="text-amber-600" />
              Empanadas & Morocho
            </span>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {formatCurrency(summary['Empanadas/Morocho'])}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <CupSoda size={15} className="text-sky-600" />
              Bebidas
            </span>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {formatCurrency(summary.Bebidas)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Soup size={15} className="text-purple-600" />
              Coladas
            </span>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {formatCurrency(summary.Coladas)}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Fish size={15} className="text-teal-600" />
              Mariscos
            </span>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {formatCurrency(summary.Mariscos)}
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Day */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowConfirmReset(false)}
          />
          <div className="relative bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 z-10">
            <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw size={24} />
            </div>
            <h4 className="text-base font-black text-slate-900 text-center mb-1">
              ¿Reiniciar ventas del día?
            </h4>
            <p className="text-xs text-slate-500 text-center mb-5">
              Esta acción pondrá en cero las ventas registradas para comenzar una nueva jornada.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDay()
                  setShowConfirmReset(false)
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-red-600 text-white font-bold text-xs"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
