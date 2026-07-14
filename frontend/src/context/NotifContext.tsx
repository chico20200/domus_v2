// src/context/NotifContext.tsx
import { createContext, useContext, useState, useCallback } from "react"

// ── Tipos ─────────────────────────────────────────────────────
export type ToastTipo = "exito" | "error" | "info" | "advertencia"

interface Toast {
  id:      string
  tipo:    ToastTipo
  mensaje: string
}

interface ConfirmOpts {
  titulo:       string
  mensaje?:     string
  labelOk?:     string
  labelCancel?: string
  peligroso?:   boolean   // ← botón rojo para acciones destructivas
}

interface ConfirmState extends ConfirmOpts {
  resolver: (ok: boolean) => void
}

interface NotifContextType {
  toast:   (tipo: ToastTipo, mensaje: string) => void
  confirm: (opts: ConfirmOpts) => Promise<boolean>
  // Estado interno — lo consume el renderer
  _toasts:  Toast[]
  _confirm: ConfirmState | null
  _quitarToast: (id: string) => void
}

const NotifContext = createContext<NotifContextType | null>(null)

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [toasts,      setToasts]      = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const quitarToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((tipo: ToastTipo, mensaje: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, tipo, mensaje }])
    // Se cierra solo a los 4 segundos
    setTimeout(() => quitarToast(id), 4000)
  }, [quitarToast])

  // Devuelve una promesa que se resuelve cuando el usuario elige
  const confirm = useCallback((opts: ConfirmOpts): Promise<boolean> => {
    return new Promise(resolver => {
      setConfirmState({ ...opts, resolver })
    })
  }, [])

  return (
    <NotifContext.Provider
      value={{
        toast,
        confirm,
        _toasts:  toasts,
        _confirm: confirmState,
        _quitarToast: quitarToast,
      }}
    >
      {children}
      <NotifRenderer onCerrarConfirm={() => setConfirmState(null)} />
    </NotifContext.Provider>
  )
}

export function useNotif() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error("useNotif debe usarse dentro de NotifProvider")
  return { toast: ctx.toast, confirm: ctx.confirm }
}

// Hook interno para el renderer
function useNotifInterno() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error("Fuera de NotifProvider")
  return ctx
}

// ── El renderer: dibuja toasts y el diálogo ───────────────────
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react"

const toastConfig: Record<ToastTipo, { icon: typeof CheckCircle; color: string; bg: string }> = {
  exito:       { icon: CheckCircle,   color: "var(--color-secondary_g)", bg: "rgba(106,178,62,0.12)" },
  error:       { icon: XCircle,       color: "var(--color-danger_r)",    bg: "rgba(217,97,70,0.12)"  },
  info:        { icon: Info,          color: "var(--color-primary_y)",   bg: "rgba(221,154,76,0.12)" },
  advertencia: { icon: AlertTriangle, color: "var(--color-primary_y)",   bg: "rgba(221,154,76,0.12)" },
}

function NotifRenderer({ onCerrarConfirm }: { onCerrarConfirm: () => void }) {
  const { _toasts, _confirm, _quitarToast } = useNotifInterno()

  function responder(ok: boolean) {
    _confirm?.resolver(ok)
    onCerrarConfirm()
  }

  return (
    <>
      {/* ── Toasts (esquina inferior derecha) ─────────────── */}
      <div
        style={{
          position:      "fixed",
          bottom:        "90px",   // arriba del botón del chatbot
          right:         "24px",
          zIndex:        60,
          display:       "flex",
          flexDirection: "column",
          gap:           "8px",
          pointerEvents: "none",
        }}
      >
        {_toasts.map(t => {
          const cfg = toastConfig[t.tipo]
          const Icon = cfg.icon
          return (
            <div
              key={t.id}
              style={{
                minWidth:      "280px",
                maxWidth:      "380px",
                display:       "flex",
                alignItems:    "flex-start",
                gap:           "10px",
                padding:       "12px 14px",
                borderRadius:  "10px",
                background:    "var(--bg-surface)",
                border:        "1px solid var(--border-base)",
                borderLeft:    `3px solid ${cfg.color}`,
                boxShadow:     "0 4px 16px rgba(0,0,0,0.12)",
                pointerEvents: "auto",
                animation:     "notifIn .2s ease-out",
              }}
            >
              <div
                style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: cfg.bg, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon size={13} style={{ color: cfg.color }} />
              </div>
              <p style={{ flex: 1, fontSize: "13px", lineHeight: 1.4, color: "var(--text-primary)", margin: 0 }}>
                {t.mensaje}
              </p>
              <button
                onClick={() => _quitarToast(t.id)}
                aria-label="Cerrar"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--text-muted)", padding: 0, flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Diálogo de confirmación ───────────────────────── */}
      {_confirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 70 }}
          onClick={() => responder(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
            style={{ background: "var(--bg-surface)", animation: "notifIn .15s ease-out" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                  background: _confirm.peligroso
                    ? "rgba(217,97,70,0.12)"
                    : "rgba(221,154,76,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <AlertTriangle
                  size={18}
                  style={{
                    color: _confirm.peligroso
                      ? "var(--color-danger_r)"
                      : "var(--color-primary_y)",
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                  {_confirm.titulo}
                </h3>
                {_confirm.mensaje && (
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {_confirm.mensaje}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => responder(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "transparent",
                  border:     "1px solid var(--border-base)",
                  color:      "var(--text-secondary)",
                  cursor:     "pointer",
                }}
              >
                {_confirm.labelCancel ?? "Cancelar"}
              </button>
              <button
                onClick={() => responder(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: _confirm.peligroso
                    ? "var(--color-danger_r)"
                    : "var(--color-primary_y)",
                  border: "none",
                  color:  "white",
                  cursor: "pointer",
                }}
              >
                {_confirm.labelOk ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animación de entrada */}
      <style>{`
        @keyframes notifIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}