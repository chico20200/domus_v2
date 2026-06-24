// src/api/pagos.types.ts
export interface PagoCredito {
  id: string
  caja_id: string
  credito_id: string
  numero_cuota: number
  monto_pagado: number
  // Campos legacy - algunos endpoints anteriores usan `monto` y `descripcion`
  monto?: number
  descripcion?: string
  saldo_antes: number
  saldo_despues: number
  fecha_pago: string
  registrado_por: string
  created_at?: string
  updated_at?: string
}

export interface CreatePagoRequest {
  credito_id: string
  numero_cuota: number
  monto_pagado: number
  saldo_antes: number
  saldo_despues: number
  fecha_pago?: string
}

export interface PagosResponse {
  pagos: PagoCredito[]
}

export interface PagoResponse {
  pago: PagoCredito
}

export interface CreatePagoResponse {
  message?: string
  pago: PagoCredito
  credito?: any
}
