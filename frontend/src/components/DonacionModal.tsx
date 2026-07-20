// src/components/DonacionModal.tsx
import { useState, useEffect, useRef } from "react"
import { Heart, X } from "lucide-react"
import { Button }   from "./Button"
import { Field }    from "./Field"

interface DonacionModalProps {
  onCerrar: () => void
}

// Declara el objeto global de PayPal para TypeScript
declare global {
  interface Window {
    paypal?: any
  }
}

const BASE_URL = import.meta.env.VITE_API_URL

export function DonacionModal({ onCerrar }: DonacionModalProps) {
  const [monto,     setMonto]     = useState("5.00")
  const [paso,      setPaso]      = useState<"monto" | "pago">("monto")
  const [mensaje,   setMensaje]   = useState<string | undefined>(undefined)
  const [error,     setError]     = useState<string | undefined>(undefined)
  // const [sdkListo, setSdkListo] = useState(false)
  const paypalRef = useRef<HTMLDivElement>(null)

  
  // Renderiza el botón de PayPal cuando pasamos al paso de pago
  useEffect(() => {
    if (paso !== "pago" || !window.paypal || !paypalRef.current) return

    // Limpia render anterior
    paypalRef.current.innerHTML = ""

    window.paypal.Buttons({
      // 1. Crea la orden llamando a NUESTRO backend
      createOrder: async () => {
        const res = await fetch(`${BASE_URL}/donaciones/crear-orden`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monto: parseFloat(monto) }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        return data.orderID
      },

      // 2. Cuando el usuario aprueba, captura llamando a NUESTRO backend
      onApprove: async (data: { orderID: string }) => {
        const res = await fetch(`${BASE_URL}/donaciones/capturar-orden`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderID: data.orderID }),
        })
        const result = await res.json()
        if (res.ok) {
          setMensaje(result.message)
        } else {
          setError(result.error || "Error al procesar el pago")
        }
      },

      onError: () => {
        setError("Ocurrió un error con PayPal. Intenta de nuevo.")
      },
    }).render(paypalRef.current)
  }, [paso, monto])

  function continuarAPago() {
    const montoNum = parseFloat(monto)
    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido")
      return
    }
    setError(undefined)
    setPaso("pago")
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4 relative"
        style={{ background: "var(--bg-surface)" }}
      >
        {/* Cerrar */}
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(217,97,70,0.12)" }}
          >
            <Heart size={18} style={{ color: "var(--color-danger_r)" }} />
          </div>
          <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
            Apoya a Domus
          </h3>
        </div>

        {/* Mensaje de éxito */}
        {mensaje && (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: "var(--color-secondary_g)" }}>
              ✓ {mensaje}
            </p>
            <Button label="Cerrar" variant="secondary" onClick={onCerrar} />
          </div>
        )}

        {/* Paso 1: elegir monto */}
        {!mensaje && paso === "monto" && (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Tu donación ayuda a mantener el proyecto. ¡Gracias por tu apoyo!
            </p>

            {/* Montos rápidos */}
            <div className="flex gap-2">
              {["5.00", "10.00", "20.00"].map(m => (
                <button
                  key={m}
                  onClick={() => setMonto(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{
                    background: monto === m ? "var(--color-primary_y)" : "var(--bg-base)",
                    color:      monto === m ? "white" : "var(--text-primary)",
                    border:     "1px solid var(--border-base)",
                  }}
                >
                  ${m}
                </button>
              ))}
            </div>

            <Field
              label="Otro monto (USD)"
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
            />

            {error && (
              <p className="text-xs" style={{ color: "var(--color-danger_r)" }}>{error}</p>
            )}

            <Button label="Continuar" variant="primary" onClick={continuarAPago} />
          </>
        )}

        {/* Paso 2: botón de PayPal */}
        {!mensaje && paso === "pago" && (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Donarás <strong>${parseFloat(monto).toFixed(2)} USD</strong>
            </p>
            <div ref={paypalRef}></div>
            {error && (
              <p className="text-xs" style={{ color: "var(--color-danger_r)" }}>{error}</p>
            )}
            <button
              onClick={() => setPaso("monto")}
              className="text-xs hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              ← Cambiar monto
            </button>
          </>
        )}
      </div>
    </div>
  )
}