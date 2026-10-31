import { DollarSign, Fish, Utensils, CupSoda, Soup } from 'lucide-react'
import { PRODUCT_CATALOG } from '../logic.js'

export default function AdminPricesView({ basePrices, onUpdatePrice }) {
  const getProductIcon = (category) => {
    switch (category) {
      case 'Pescados':
      case 'Mariscos':
        return <Fish size={18} />
      case 'Bebidas':
        return <CupSoda size={18} />
      case 'Coladas':
        return <Soup size={18} />
      default:
        return <Utensils size={18} />
    }
  }

  return (
    <div className="space-y-4 pb-20 max-w-3xl mx-auto">
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Administración de Precios
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Modifica los precios base del catálogo de productos
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
        {PRODUCT_CATALOG.map((product) => {
          const currentPrice = Number(basePrices[product.id] ?? product.basePrice)

          return (
            <div
              key={product.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  {getProductIcon(product.category)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {product.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={currentPrice}
                  onChange={(e) => onUpdatePrice(product.id, Number(e.target.value))}
                  className="w-20 min-h-[38px] px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-right font-black text-xs text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
