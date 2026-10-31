import { Users, ChefHat, ShieldCheck, Sparkles, Share2 } from 'lucide-react'

const ROLES = [
  {
    id: 'cashier',
    label: 'Cajero / Mesero',
    desc: 'Tomar comandas en mesas, enviar a cocina y realizar cobros.',
    icon: Users,
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    id: 'cook',
    label: 'Cocinero',
    desc: 'Ver pedidos en tiempo real con preparaciones frito o al vapor.',
    icon: ChefHat,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    id: 'admin',
    label: 'Administrador',
    desc: 'Control total de mesas, precios del menú y cierre de caja.',
    icon: ShieldCheck,
    color: 'text-purple-600 bg-purple-50 border-purple-100',
  },
]

export default function RoleSelector({ onSelectRole, onOpenConnect }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ginita Restaurante
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sistema de comandas y punto de venta móvil
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sincronización multi-dispositivo activa</span>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Selecciona tu perfil de trabajo:
          </span>

          {ROLES.map((role) => {
            const Icon = role.icon
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role.id)}
                className="w-full p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-400 hover:bg-slate-50 text-left transition active:scale-[0.98] flex items-start gap-3.5 shadow-2xs"
              >
                <div
                  className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 ${role.color}`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {role.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {role.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {onOpenConnect && (
          <button
            type="button"
            onClick={onOpenConnect}
            className="w-full mt-4 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98]"
          >
            <Share2 size={16} className="text-teal-600" />
            <span>Conectar otro celular o cocina (QR / Enlace)</span>
          </button>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Diseñado para uso rápido con una sola mano en smartphones.
          </p>
        </div>
      </div>
    </div>
  )
}
