// src/api/resumen.types.ts
export interface ResumenCaja {
  totalMiembros:   number
  totalSocios:     number
  saldoTotal:      number
  creditosActivos: number
  saldoPendiente:  number
}

export interface TransaccionReciente {
  id:          string
  tipo:        "deposito" | "retiro"
  monto:       number
  descripcion: string
  created_at:  string
  cuentas_ahorro?: {
    socios?: {
      nombre:   string
      apellido: string
    }
  }
}

export interface GetResumenResponse {
  caja: {
    id:          string
    nombre:      string
    descripcion: string
    created_at:  string
  }
  rol:                    string
  resumen:                ResumenCaja
  transaccionesRecientes: TransaccionReciente[]
}

