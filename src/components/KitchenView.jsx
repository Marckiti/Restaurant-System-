import { useState, useEffect } from 'react'
import { ChefHat, Clock, Check, Flame, Wind, Package, UtensilsCrossed, FileText } from 'lucide-react'
import { formatCurrency } from '../logic.js'

export default function KitchenView({ kitchenQueue, onCompleteOrder }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const getElapsedMinutes = (timestamp) => {
    if (!timestamp) return 0
    const mins = Math.floor((now - timestamp) / 60000)
    return Math.max(0, mins)
  }

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <ChefHat size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              Comandas en Cocina
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Órdenes ordenadas por tiempo de espera
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-black">
          {kitchenQueue.length} {kitchenQueue.length === 1 ? 'pendiente' : 'pendientes'}
        </span>
      </div>

      {/* Ticket List */}
      {kitchenQueue.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 bg-white">
          <ChefHat size={44} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            Todo despachado
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            No hay órdenes pendientes en este momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {kitchenQueue.map(({ tableId, order, type }) => {
            const elapsed = getElapsedMinutes(order.arrivedAt)

            return (
              <div
                key={tableId}
                className="p-4 rounded-3xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {type}
                      </span>
                      <h3 className="text-xl font-black text-slate-900">{tableId}</h3>
                    </div>

                    <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                      <Clock size={13} />
                      <span>hace {elapsed} min</span>
                    </div>
                  </div>

                  {/* Items list with highlighted cooking modes and takeout tags */}
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.key}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-black text-slate-900 tabular-nums">
                                {item.qty}x
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {item.name}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                            {formatCurrency(item.unitPrice * item.qty)}
                          </span>
                        </div>

                        {/* Badges row: Takeout & Cooking Mode */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.serviceType === 'llevar' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-orange-600 text-white uppercase tracking-wide">
                              <Package size={12} />
                              PARA LLEVAR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                              <UtensilsCrossed size={12} />
                              En mesa
                            </span>
                          )}

                          {item.cooking && (
                            item.cooking === 'frito' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white uppercase">
                                <Flame size={12} />
                                FRITO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-sky-500 text-white uppercase">
                                <Wind size={12} />
                                AL VAPOR
                              </span>
                            )
                          )}
                        </div>

                        {/* Kitchen notes if any */}
                        {item.notes && (
                          <div className="mt-1 flex items-start gap-1 p-2 rounded-xl bg-amber-100/70 border border-amber-200 text-amber-950 text-xs font-semibold">
                            <FileText size={13} className="shrink-0 mt-0.5 text-amber-700" />
                            <span>Nota: &ldquo;{item.notes}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispatch Button */}
                <button
                  type="button"
                  onClick={() => onCompleteOrder(tableId)}
                  className="w-full min-h-[48px] py-2.5 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition hover:bg-emerald-500"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>Despachar Comanda (Listo)</span>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
