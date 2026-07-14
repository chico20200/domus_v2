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

export interface CuotaVencida {
  numero_cuota:      number
  fecha_vencimiento: string
  falta_total:       number
}

export interface PrepagoDisponible {
  numero_cuota:        number
  capital:             number
  interes_a_condonar:  number
}

export interface ProximaCuota {
  pendiente:          boolean
  numero_cuota?:      number
  total_cuotas?:      number
  es_ultima?:         boolean
  fecha_vencimiento?: string
  vencida?:           boolean
  falta_capital?:     number
  falta_interes?:     number
  falta_total?:       number
  cuotas_vencidas?:   CuotaVencida[]
  prepago_disponible?: PrepagoDisponible | null
  mensaje?:           string
}

export interface PrepagoResponse {
  message:           string
  cuota_prepagada:   number
  capital_pagado:    number
  interes_condonado: number
  saldo_pendiente:   number
  credito_pagado:    boolean
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
export interface AbonoResponse {
  message:  string
  aplicado: {
    cuota:   number
    capital: number
    interes: number
    total:   number
  }
  resta_en_cuota: {
    capital: number
    interes: number
    total:   number
  }
  saldo_pendiente: number
  credito_pagado:  boolean
}