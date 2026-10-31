import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  X,
  Copy,
  Check,
  Smartphone,
  ChefHat,
  Receipt,
  Share2,
  RefreshCw,
  Wifi,
  Fish,
} from 'lucide-react'

export default function ConnectDevicesModal({ isOpen, onClose, dbStatus }) {
  const [qrUrl, setQrUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [testingPing, setTestingPing] = useState(false)
  const [pingResult, setPingResult] = useState(null)
  const shareUrl =
    typeof window !== 'undefined' ? window.location.href.split('#')[0] : ''

  useEffect(() => {
    if (!isOpen || !shareUrl) return

    QRCode.toDataURL(shareUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => setQrUrl(dataUrl))
      .catch((err) => console.error('Error generando QR:', err))
  }, [isOpen, shareUrl])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  const handleShareWhatsApp = () => {
    if (!shareUrl) return
    const text = `Sistema Ginita Restaurante (Mesero / Cocina / Caja): ${shareUrl}`
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  const handleTestPing = async () => {
    setTestingPing(true)
    setPingResult(null)
    const start = Date.now()
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      const elapsed = Date.now() - start
      setPingResult({
        ok: res.ok,
        ms: elapsed,
        message: data.mongoStatusMessage || 'Sincronización activa',
      })
    } catch (err) {
      setPingResult({
        ok: false,
        ms: 0,
        message: 'No se pudo conectar al servidor: ' + err.message,
      })
    } finally {
      setTestingPing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 my-auto text-slate-900 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Conectar varios celulares
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sin configurar contraseñas ni bases de datos complicadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition active:scale-95"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cloud Status Pill */}
        <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-900">
              {dbStatus?.syncEngine || 'Servidor Central Ginita (Nube)'} activo
            </span>
          </div>
          <button
            type="button"
            onClick={handleTestPing}
            disabled={testingPing}
            className="px-2.5 py-1 rounded-xl bg-white text-emerald-800 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition flex items-center gap-1 shadow-2xs"
          >
            <RefreshCw size={12} className={testingPing ? 'animate-spin' : ''} />
            <span>{testingPing ? 'Probando...' : 'Probar conexión'}</span>
          </button>
        </div>

        {pingResult && (
          <div
            className={`mt-2 p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
              pingResult.ok
                ? 'bg-slate-50 text-slate-700 border-slate-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <Wifi size={14} className={pingResult.ok ? 'text-emerald-600' : 'text-rose-600'} />
            <span>
              {pingResult.ok
                ? `¡Conexión instantánea! Respondió en ${pingResult.ms} ms. Todo pedido se refleja al instante.`
                : pingResult.message}
            </span>
          </div>
        )}

        {/* QR Code and Instructions */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs shrink-0 text-center">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Escanear con otro celular"
                className="w-36 h-36 object-contain rounded-lg"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                Generando QR...
              </div>
            )}
            <span className="text-[10px] font-bold text-slate-500 mt-1 block">
              Apunta la cámara del celular
            </span>
          </div>

          <div className="flex-1 w-full space-y-2 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Enlace de tu restaurante:
            </span>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 truncate select-all">
              {shareUrl || 'Cargando enlace...'}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className={`flex-1 min-h-[40px] px-3 rounded-xl font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="min-h-[40px] px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-2xs"
                title="Compartir por WhatsApp"
              >
                <Share2 size={15} />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Roles explanation for restaurant staff */}
        <div className="mt-5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            ¿Cómo usarlo en el restaurante?
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-100 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-sky-800 font-bold text-xs">
                <Smartphone size={15} />
                <span>Meseros</span>
              </div>
              <p className="text-[11px] text-sky-900 leading-snug">
                Eligen <strong>Mesero</strong>. Toman comandas en mesas (pescados, empanadas, bebidas) y envían a cocina.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                <ChefHat size={15} />
                <span>Cocina</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-snug">
                Eligen <strong>Cocinero</strong>. Ven los tickets de inmediato (frito o al vapor, porciones y notas) en tiempo real.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs">
                <Receipt size={15} />
                <span>Caja</span>
              </div>
              <p className="text-[11px] text-purple-900 leading-snug">
                Eligen <strong>Cajero</strong>. Cobran las mesas y en el <strong>Cierre de caja</strong> ven cuántos pescados se vendieron.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Fish size={14} className="text-teal-600" />
            <span>Ginita POS · Sincronización instantánea</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
