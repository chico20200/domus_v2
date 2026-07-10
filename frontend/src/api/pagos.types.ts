// src/api/pagos.types.ts
export interface PagoCredito {
  id:             string
  caja_id:        string
  credito_id:     string
  numero_cuota:   number
  monto_pagado:   number
  monto_capital:  number
  monto_interes:  number
  saldo_antes:    number
  saldo_despues:  number
  fecha_pago:     string
  created_at:     string
}

export type TipoPago = "completo" | "solo_capital" | "solo_interes"

export interface GetPagosResponse {
  pagos: PagoCredito[]
}

export interface RegistrarPagoResponse {
  message:  string
  pago:     PagoCredito
  desglose: {
    capital: number
    interes: number
    total:   number
  }
  saldo_pendiente: number
  credito_pagado:  boolean
}