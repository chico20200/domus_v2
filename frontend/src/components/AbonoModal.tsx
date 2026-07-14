// src/components/AbonoModal.tsx
import { useState, useEffect } from "react"
import { HandCoins, AlertTriangle } from "lucide-react"
import { Button }       from "./Button"
import { Field }        from "./Field"
import { pagosService } from "../api/pagos.service"
import type { ProximaCuota } from "../api/pagos.types"

function formatMonto(m: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency", currency: "USD", minimumFractionDigits: 2
  }).format(m)
}

// Motivos frecuentes — el tesorero elige o escribe uno
const MOTIVOS = [
  "Dificultad económica temporal",
  "Enfermedad o gasto médico",
  "Pérdida o reducción de ingresos",
  "Emergencia familiar",
  "Otro (especificar)",
]

interface Props {
  cajaId:      string
  creditoId:   string
  nombreSocio?: string
  procesando?: boolean
  onConfirmar: (monto: number, motivo: string) => void
  onCancelar:  () => void
}

export function AbonoModal({
  cajaId, creditoId, nombreSocio, procesando = false,
  onConfirmar, onCancelar
}: Props) {
  const [cuota,       setCuota]       = useState<ProximaCuota | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [monto,       setMonto]       = useState("")
  const [motivoSel,   setMotivoSel]   = useState("")
  const [motivoOtro,  setMotivoOtro]  = useState("")
  const [error,       setError]       = useState<string | undefined>(undefined)

  useEffect(() => {
    async function cargar() {
      try {
        const res = await pagosService.getProximaCuota(cajaId, creditoId)
        setCuota(res)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [cajaId, creditoId])

  const pendienteCuota = cuota?.falta_total ?? 0

  // Simula cómo se aplicaría el abono
  const simulacion = (() => {
    const m = parseFloat(monto)
    if (!m || isNaN(m) || m <= 0 || !cuota?.pendiente) return null
    const fc = cuota.falta_capital ?? 0
    const capital = Math.min(m, fc)
    const interes = +(m - capital).toFixed(2)
    return {
      capital: +capital.toFixed(2),
      interes: interes > 0 ? interes : 0,
      restante: +(pendienteCuota - m).toFixed(2),
    }
  })()

  function handleConfirmar() {
    const m = parseFloat(monto)
    if (!m || isNaN(m) || m <= 0) {
      setError("Ingresa un monto válido mayor a 0")
      return
    }
    if (m > pendienteCuota + 0.001) {
      setError(`El abono no puede superar lo pendiente de la cuota (${formatMonto(pendienteCuota)})`)
      return
    }
    const motivo = motivoSel === "Otro (especificar)" ? motivoOtro.trim() : motivoSel
    if (!motivo) {
      setError("Selecciona o describe el motivo del abono")
      return
    }
    setError(undefined)
    onConfirmar(m, motivo)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
        style={{ background: "var(--bg-surface)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Encabezado */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(221,154,76,0.12)" }}
          >
            <HandCoins size={18} style={{ color: "var(--color-primary_y)" }} />
          </div>
          <div>
            <h3 className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
              Abono parcial
            </h3>
            {nombreSocio && (
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{nombreSocio}</p>
            )}
          </div>
        </div>

        {loading && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
            Cargando cuota...
          </p>
        )}

        {!loading && cuota?.pendiente && (
          <>
            {/* Contexto de la cuota */}
            <div className="rounded-lg p-3 text-xs flex flex-col gap-1"
              style={{ background: "var(--bg-base)" }}
            >
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>
                  Cuota #{cuota.numero_cuota} de {cuota.total_cuotas}
                </span>
                {cuota.vencida && (
                  <span style={{ color: "var(--color-danger_r)" }}>Vencida</span>
                )}
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>Pendiente de la cuota</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                  {formatMonto(pendienteCuota)}
                </span>
              </div>
            </div>

            {/* Monto */}
            <Field
              label="Monto a abonar ($)"
              type="number"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              placeholder="0.00"
              required
            />

            {/* Simulación de cómo se aplica */}
            {simulacion && (
              <div className="rounded-lg p-3 text-xs flex flex-col gap-1"
                style={{ background: "rgba(106,178,62,0.08)", border: "1px solid var(--border-base)" }}
              >
                <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  Se aplicará así:
                </p>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>A capital</span>
                  <span style={{ color: "var(--color-secondary_g)" }}>
                    {formatMonto(simulacion.capital)}
                  </span>
                </div>
                {simulacion.interes > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>A interés</span>
                    <span style={{ color: "var(--color-primary_y)" }}>
                      {formatMonto(simulacion.interes)}
                    </span>
                  </div>
                )}
                {simulacion.restante > 0.001 && (
                  <div className="flex justify-between pt-1 mt-1"
                    style={{ borderTop: "1px solid var(--border-base)" }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>Quedará pendiente</span>
                    <span style={{ color: "var(--color-danger_r)" }}>
                      {formatMonto(simulacion.restante)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Motivo del abono <span style={{ color: "var(--color-danger_r)" }}>*</span>
              </label>
              <select
                value={motivoSel}
                onChange={e => setMotivoSel(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  background: "var(--bg-base)",
                  border:     "1px solid var(--border-base)",
                  color:      "var(--text-primary)",
                }}
              >
                <option value="">Selecciona un motivo...</option>
                {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {motivoSel === "Otro (especificar)" && (
              <Field
                label="Describe el motivo"
                type="text"
                value={motivoOtro}
                onChange={e => setMotivoOtro(e.target.value)}
                placeholder="Ej: Retraso en el pago de su empleador"
                required
              />
            )}

            {/* Advertencia */}
            <div className="rounded-lg px-3 py-2 text-xs flex gap-2"
              style={{
                background: "rgba(221,154,76,0.1)",
                border:     "1px solid rgba(221,154,76,0.25)",
              }}
            >
              <AlertTriangle size={14} style={{ color: "var(--color-primary_y)", flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                El abono se aplica primero al capital. La cuota seguirá pendiente hasta cubrirla completa.
              </p>
            </div>

            {error && (
              <p className="text-xs" style={{ color: "var(--color-danger_r)" }}>{error}</p>
            )}
          </>
        )}

        {!loading && !cuota?.pendiente && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {cuota?.mensaje ?? "No hay cuotas pendientes."}
          </p>
        )}

        <div className="flex gap-3">
          {!loading && cuota?.pendiente && (
            <Button
              label="Registrar abono"
              variant="primary"
              loading={procesando}
              onClick={handleConfirmar}
            />
          )}
          <Button label="Cancelar" variant="secondary" onClick={onCancelar} />
        </div>
      </div>
    </div>
  )
}