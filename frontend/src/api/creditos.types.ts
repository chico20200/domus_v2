// src/api/creditos.types.ts
export type EstadoCredito = 'pendiente' | 'activo' | 'pagado' | 'mora' | 'castigado'

export interface Credito {
  id:               string
  caja_id:          string
  socio_id:         string
  monto_solicitado: number
  tasa_interes:     number
  plazo_meses:      number
  monto_total:      number
  cuota_mensual:    number
  saldo_pendiente:  number
  estado:           EstadoCredito
  fecha_desembolso?: string | null
  fecha_vencimiento?: string | null
  aprobado_por?:    string | null
  created_at?:      string
  updated_at?:      string
  socios?: {
    nombre:   string
    apellido: string
    cedula?:  string
  }
}

export interface PagoCredito {
  id:             string
  credito_id:     string
  caja_id:        string
  socio_id:       string
  monto:          number
  descripcion:    string
  registrado_por: string
  created_at?:    string
  updated_at?:    string
}

// Responses
export interface GetCreditosResponse { creditos: Credito[] }
export interface GetCreditoResponse  { credito: Credito; pagos: PagoCredito[] }

export interface CreateCreditoRequest {
  socio_id:         string
  monto_solicitado: number
  tasa_interes:     number
  plazo_meses:      number
}

export interface CreateCreditoResponse {
  message: string
  credito: Credito
}

export interface PagoCreditoResponse {
  message: string
  pago:    PagoCredito
  credito?: Credito
}

export interface ChangeEstadoResponse {
  message: string
  credito: Credito
}
