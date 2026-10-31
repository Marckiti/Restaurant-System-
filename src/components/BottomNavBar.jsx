import { Utensils, ChefHat, Receipt, ShieldCheck } from 'lucide-react'

export default function BottomNavBar({
  currentView,
  onSelectView,
  userRole,
  kitchenQueueCount,
}) {
  const tabs = [
    {
      id: 'tables',
      label: 'Mesas',
      icon: Utensils,
      show: userRole !== 'cook',
    },
    {
      id: 'kitchen',
      label: 'Cocina',
      icon: ChefHat,
      badge: kitchenQueueCount > 0 ? kitchenQueueCount : null,
      show: true,
    },
    {
      id: 'report',
      label: 'Cierre',
      icon: Receipt,
      show: userRole === 'admin' || userRole === 'cashier',
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: ShieldCheck,
      show: userRole === 'admin',
    },
  ].filter((t) => t.show)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2">
      <div className="max-w-md mx-auto h-full flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentView === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              className={`relative min-h-[48px] flex-1 flex flex-col items-center justify-center transition active:scale-95 ${
                isActive ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 h-4 min-w-[16px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-6 rounded-full bg-slate-900" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
