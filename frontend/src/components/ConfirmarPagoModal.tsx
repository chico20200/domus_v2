// src/components/ConfirmarPagoModal.tsx
import { useState, useEffect } from "react"
import { Button }              from "./Button"
import { pagosService }        from "../api/pagos.service"
import type { TipoPago, ProximaCuota } from "../api/pagos.types"

function formatMonto(m: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency", currency: "USD", minimumFractionDigits: 2
  }).format(m)
}

const titulos: Record<TipoPago, string> = {
  completo:     "Pago completo de cuota",
  solo_capital: "Pago de solo capital",
  solo_interes: "Pago de solo interés",
}

interface Props {
  cajaId:       string
  creditoId:    string
  tipo:         TipoPago
  nombreSocio?: string
  onConfirmar:  () => void   // ejecuta el pago
  onCancelar:   () => void
  procesando?:  boolean
}

export function ConfirmarPagoModal({
  cajaId, creditoId, tipo, nombreSocio,
  onConfirmar, onCancelar, procesando = false
}: Props) {
  const [cuota,   setCuota]   = useState<ProximaCuota | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | undefined>(undefined)

  // El backend dice exactamente qué falta pagar
  useEffect(() => {
    async function cargar() {
      try {
        const res = await pagosService.getProximaCuota(cajaId, creditoId)
        setCuota(res)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar la cuota")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [cajaId, creditoId])

  // Calcula el desglose según el tipo de pago
  const desglose = (() => {
    if (!cuota?.pendiente) return null
    const capital = cuota.falta_capital ?? 0
    const interes = cuota.falta_interes ?? 0

    if (tipo === "solo_capital") return { capital, interes: 0,  total: capital }
    if (tipo === "solo_interes") return { capital: 0, interes,  total: interes }
    return { capital, interes, total: +(capital + interes).toFixed(2) }
  })()

  // Detecta si el pago no aplica (ej: pedir solo interés cuando ya está pagado)
  const sinNadaQuePagar = desglose !== null && desglose.total <= 0

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5 flex flex-col gap-4"
        style={{ background: "var(--bg-surface)" }}
      >
        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
          {titulos[tipo]}
        </h3>

        {loading && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
            Calculando cuota...
          </p>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--color-danger_r)" }}>{error}</p>
        )}

        {/* Crédito ya pagado */}
        {!loading && cuota && !cuota.pendiente && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {cuota.mensaje ?? "No hay cuotas pendientes."}
          </p>
        )}

        {/* Este tipo de pago no tiene nada que cobrar */}
        {!loading && sinNadaQuePagar && cuota?.pendiente && (
          <p className="text-sm" style={{ color: "var(--color-danger_r)" }}>
            {tipo === "solo_capital"
                ? `El capital de la cuota #${cuota.numero_cuota} ya está pagado.`
                : `El interés de la cuota #${cuota.numero_cuota} ya está pagado.`}
                {/* Después del párrafo de "Cuota #X de Y" */}
                {cuota.vencida && (
                <div className="rounded-lg px-3 py-2 text-xs"
                    style={{
                    background: "rgba(217,97,70,0.1)",
                    border:     "1px solid rgba(217,97,70,0.25)",
                    color:      "var(--color-danger_r)",
                    }}
                >
                    <strong>Cuota atrasada.</strong> Venció el {cuota.fecha_vencimiento}.
                </div>
                )}

                {cuota.cuotas_vencidas && cuota.cuotas_vencidas.length > 1 && (
                <p className="text-xs" style={{ color: "var(--color-danger_r)" }}>
                    Hay {cuota.cuotas_vencidas.length} cuotas vencidas en total.
                </p>
                )}
          </p>
        )}

        {/* Desglose real */}
        {!loading && cuota?.pendiente && desglose && !sinNadaQuePagar && (
          <>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {nombreSocio && <>Pago para <strong>{nombreSocio}</strong>. </>}
              Cuota <strong>#{cuota.numero_cuota}</strong> de {cuota.total_cuotas}
              {cuota.es_ultima && " (última)"}. Esta acción no se puede deshacer.
            </p>

            <div className="rounded-lg p-3 flex flex-col gap-1" style={{ background: "var(--bg-base)" }}>
              {desglose.capital > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Capital</span>
                  <span style={{ color: "var(--text-primary)" }}>{formatMonto(desglose.capital)}</span>
                </div>
              )}
              {desglose.interes > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Interés</span>
                  <span style={{ color: "var(--color-primary_y)" }}>{formatMonto(desglose.interes)}</span>
                </div>
              )}
              <div
                className="flex justify-between text-sm font-medium pt-1 mt-1"
                style={{ borderTop: "1px solid var(--border-base)", color: "var(--text-primary)" }}
              >
                <span>Total</span>
                <span>{formatMonto(desglose.total)}</span>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          {/* Solo muestra confirmar si realmente hay algo que pagar */}
          {!loading && cuota?.pendiente && !sinNadaQuePagar && (
            <Button
              label="Confirmar pago"
              variant="primary"
              loading={procesando}
              onClick={onConfirmar}
            />
          )}
          <Button label="Cerrar" variant="secondary" onClick={onCancelar} />
        </div>
      </div>
    </div>
  )
}