// src/api/reportes.types.ts
import type { Ciclo, CicloResumen } from "./ciclos.types"

export interface FilaMes {
  mes:           string
  capital_total: number
  interes_mes:   number
  tasa_mes:      number
  saldos:        Record<string, number>
  reparto:       Record<string, number>
}

export interface InteresSocio {
  socio_id:      string
  nombre:        string
  cedula:        string
  saldo_final:   number
  por_mes:       { mes: string; interes: number }[]
  interes_total: number
}

export interface DistribucionResponse {
  caja: {
    id:     string
    nombre: string
  }
  ciclo:              Ciclo           // ← el ciclo que se está viendo
  ciclos_disponibles: CicloResumen[]  // ← todos los ciclos para el selector
  meses:              FilaMes[]
  por_socio:          InteresSocio[]
  interes_total:      number
  tasa_acumulada:     number
  validacion: {
    interes_generado:  number
    interes_repartido: number
    diferencia:        number
    cuadra:            boolean
  }
}

export interface EstadoCajaResponse {
  ciclo: {
    numero: number
    label:  string
    inicio: string
    fin:    string
  }
  total_ahorros:      number
  interes_recaudado:  number    // del ciclo seleccionado
  capital_recuperado: number    // del ciclo seleccionado
  interes_historico:  number    // acumulado de toda la caja
  por_cobrar:         number
  interes_condonado:  number
  en_caja:            number
  creditos: {
    total:      number
    activos:    number
    pagados:    number
    pendientes: number
    vencidos:   number
  }
}