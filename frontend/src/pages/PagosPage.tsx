// src/pages/PagosPage.tsx
import { useState, useEffect }  from "react"
import { useNavigate }          from "react-router-dom"
import {
   Wallet, Coins, Search, CheckCircle
} from "lucide-react"
import { AppLayout }            from "../components/layout/AppLayout"
import { Button }               from "../components/Button"
import { useCaja }              from "../context/CajaContext"
import { creditosService }      from "../api/creditos.service"
import { pagosService }         from "../api/pagos.service"
import type { Credito }         from "../api/creditos.types"
import type { TipoPago }        from "../api/pagos.types"
import { ConfirmarPagoModal } from "../components/ConfirmarPagoModal"
import { useNotif } from "../context/NotifContext"
  
function formatMonto(m: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency", currency: "USD", minimumFractionDigits: 2
  }).format(m)
}

export default function PagosPage() {
  const navigate       = useNavigate()
  const { cajaActiva } = useCaja()

  const [creditos,     setCreditos]     = useState<Credito[]>([])
  const [loading,      setLoading]      = useState(true)
  const [procesando,   setProcesando]   = useState<string | null>(null)  // id del crédito que se procesa
  const [busqueda,     setBusqueda]     = useState("")
  const [confirmacion, setConfirmacion] = useState<{ credito: Credito; tipo: TipoPago } | null>(null)
  const { toast } = useNotif()

  useEffect(() => {
    if (!cajaActiva) { navigate("/cajas", { replace: true }); return }
    cargarCreditos()
  }, [cajaActiva])

  async function cargarCreditos() {
    setLoading(true)
    try {
      const res = await creditosService.getCreditos(cajaActiva!.id)
      // Solo créditos activos — son los únicos que aceptan pagos
      setCreditos(res.creditos.filter(c => c.estado === "activo"))
    } finally {
      setLoading(false)
    }
  }

  async function ejecutarPago() {
  if (!confirmacion) return
  const { credito, tipo } = confirmacion
  setConfirmacion(null)
  setProcesando(credito.id)
  try {
    const res = await pagosService.registrarPago(cajaActiva!.id, credito.id, tipo)
    await cargarCreditos()
    const nombre = credito.socios ? `${credito.socios.nombre} ${credito.socios.apellido}` : "el socio"
    toast("exito", res.credito_pagado
      ? `Crédito de ${nombre} pagado por completo`
      : "Pago registrado correctamente"
    )
  } catch (err) {
    toast("error", err instanceof Error ? err.message : "Error al registrar pago")
  } finally {
    setProcesando(null)
  }
}

  // Filtro por nombre de socio
  const creditosFiltrados = creditos.filter(c => {
    const nombre = `${c.socios?.nombre ?? ""} ${c.socios?.apellido ?? ""}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase())
  })

  return (
    <AppLayout titulo="Pagos">
      <div className="flex flex-col gap-4">

        {/* Buscador */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Buscar por socio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: "var(--bg-surface)",
              border:     "1px solid var(--border-base)",
              color:      "var(--text-primary)",
            }}
          />
        </div>

        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {creditosFiltrados.length} crédito{creditosFiltrados.length !== 1 ? "s" : ""} activo{creditosFiltrados.length !== 1 ? "s" : ""} con pagos pendientes
        </p>

        {/* Lista de créditos activos */}
        {loading && (
          <div
            className="rounded-xl px-5 py-10 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Cargando créditos...</p>
          </div>
        )}

        {!loading && creditosFiltrados.length === 0 && (
          <div
            className="rounded-xl px-5 py-10 text-center"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
          >
            <CheckCircle size={32} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {busqueda
                ? "No se encontraron créditos con ese socio"
                : "No hay créditos activos con pagos pendientes"}
            </p>
          </div>
        )}

        {!loading && creditosFiltrados.map(c => {
          const socio = c.socios
          const enProceso = procesando === c.id
          return (
            <div
              key={c.id}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-base)" }}
            >
              {/* Info del crédito */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
                  style={{ background: "rgba(221,154,76,0.12)", color: "var(--color-primary_y)" }}
                >
                  {socio ? `${socio.nombre[0]}${socio.apellido[0]}` : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {socio ? `${socio.nombre} ${socio.apellido}` : "Sin socio"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Cuota: {formatMonto(c.cuota_mensual)} · {c.plazo_meses}m · {c.tasa_interes}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Saldo</p>
                  <p className="text-sm font-medium" style={{ color: "var(--color-danger_r)" }}>
                    {formatMonto(c.saldo_pendiente)}
                  </p>
                </div>
              </div>

              {/* Botones de pago */}
              <div className="flex gap-2">
                <Button
                  label="Pago completo"
                  variant="primary"
                  icon={Wallet}
                  loading={enProceso}
                  onClick={() => setConfirmacion({ credito: c, tipo: "completo" })}
                />
                <Button
                  label="Solo capital"
                  variant="secondary"
                  icon={Coins}
                  loading={enProceso}
                  onClick={() => setConfirmacion({ credito: c, tipo: "solo_capital" })}
                />
                <Button
                  label="Solo interés"
                  variant="secondary"
                  icon={Coins}
                  loading={enProceso}
                  onClick={() => setConfirmacion({ credito: c, tipo: "solo_interes" })}
                />
              </div>
            </div>
          )
        })}

      </div>

      {/* Modal de confirmación */}
      {confirmacion && cajaActiva && (
        <ConfirmarPagoModal
          cajaId={cajaActiva.id}
          creditoId={confirmacion.credito.id}
          tipo={confirmacion.tipo}
          nombreSocio={
            confirmacion.credito.socios
              ? `${confirmacion.credito.socios.nombre} ${confirmacion.credito.socios.apellido}`
              : undefined
          }
          procesando={procesando === confirmacion.credito.id}
          onConfirmar={ejecutarPago}
          onCancelar={() => setConfirmacion(null)}
        />
      )}
    </AppLayout>
  )
}