// src/pages/DashboardPage.tsx
import { useState, useEffect }   from "react"
import { useNavigate }           from "react-router-dom"
import {
  Wallet, Users, CreditCard,
  TrendingUp, ArrowDownCircle, ArrowUpCircle
} from "lucide-react"
import { AppLayout }             from "../components/layout/AppLayout"
import { Card }                  from "../components/UI/Card"
import { useCaja }               from "../context/CajaContext"
import { resumenService }        from "../api/resumen.service"
import type {ResumenCaja, TransaccionReciente} from "../api/resumen.types"

// Formatea montos como $1,234.56
function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-EC", {
    style:    "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(monto)
}

// Formatea fecha relativa
function formatFecha(fecha: string): string {
  const d    = new Date(fecha)
  const hoy  = new Date()
  const diff = Math.floor((hoy.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Hoy"
  if (diff === 1) return "Ayer"
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

export default function DashboardPage() {
  const navigate            = useNavigate()
  const { cajaActiva }      = useCaja()

  const [resumen,       setResumen]       = useState<ResumenCaja | null>(null)
  const [transacciones, setTransacciones] = useState<TransaccionReciente[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState("")

  useEffect(() => {
    // Si no hay caja activa, redirige a selección
    if (!cajaActiva) {
      navigate("/cajas", { replace: true })
      return
    }

    const cajaId = cajaActiva.id

    async function cargar() {
      try {
        const response = await resumenService.getResumen(cajaId)
        setResumen(response.resumen)
        setTransacciones(response.transaccionesRecientes)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el dashboard")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [cajaActiva?.id, navigate])

  if (loading) {
    return (
      <AppLayout titulo="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Cargando dashboard...
          </p>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout titulo="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-sm" style={{ color: "var(--color-danger_r)" }}>{error}</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout titulo="Dashboard">

      {/* Saludo */}
      <div className="mb-6">
        <h2
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {cajaActiva?.nombre}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Resumen general de la caja
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <Card
          label="Saldo total en ahorros"
          value={formatMonto(resumen?.saldoTotal ?? 0)}
          icon={Wallet}
          acento
        />
        <Card
          label="Socios activos"
          value={resumen?.totalSocios ?? 0}
          subtext={`${resumen?.totalMiembros ?? 0} miembros del sistema`}
          icon={Users}
        />
        <Card
          label="Créditos activos"
          value={resumen?.creditosActivos ?? 0}
          subtext={formatMonto(resumen?.saldoPendiente ?? 0) + " pendiente"}
          icon={CreditCard}
        />
        <Card
          label="Por cobrar"
          value={formatMonto(resumen?.saldoPendiente ?? 0)}
          subtext="en créditos activos"
          icon={TrendingUp}
        />
      </div>

      {/* Transacciones recientes */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border:     "1px solid var(--border-base)",
        }}
      >
        {/* Header de la tabla */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-base)" }}
        >
          <h3
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Movimientos recientes
          </h3>
          <button
            className="text-xs hover:underline"
            style={{ color: "var(--color-primary_y)" }}
            onClick={() => navigate("/ahorros")}
          >
            Ver todos
          </button>
        </div>

        {/* Sin transacciones */}
        {transacciones.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Aún no hay movimientos registrados en esta caja
            </p>
          </div>
        )}

        {/* Lista de transacciones */}
        {transacciones.length > 0 && (
          <div>
            {transacciones.map(t => {
              const socio    = t.cuentas_ahorro?.socios
              const nombre   = socio
                ? `${socio.nombre} ${socio.apellido}`
                : "Sin socio"
              const esDeposito = t.tipo === "deposito"

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border-base)" }}
                >
                  {/* Ícono tipo */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: esDeposito
                        ? "rgba(106,178,62,0.12)"
                        : "rgba(217,97,70,0.12)"
                    }}
                  >
                    {esDeposito
                      ? <ArrowDownCircle size={16} style={{ color: "var(--color-secondary_g)" }} />
                      : <ArrowUpCircle   size={16} style={{ color: "var(--color-danger_r)" }} />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {nombre}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {esDeposito ? "Depósito" : "Retiro"} · {formatFecha(t.created_at)}
                    </p>
                  </div>

                  {/* Monto */}
                  <span
                    className="text-sm font-medium flex-shrink-0"
                    style={{
                      color: esDeposito
                        ? "var(--color-secondary_g)"
                        : "var(--color-danger_r)"
                    }}
                  >
                    {esDeposito ? "+" : "-"}{formatMonto(t.monto)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </AppLayout>
  )
}