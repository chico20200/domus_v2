// src/api/ahorros.types.ts
export interface CuentaAhorro {
  id:             string
  caja_id:        string
  socio_id:       string
  numero_cuenta:  string
  saldo:          number
  estado:         "activa" | "cerrada" | "suspendida"
  fecha_apertura: string
  socios?: {
    nombre:   string
    apellido: string
    cedula:   string
  }
}

export interface Transaccion {
  id:              string
  cuenta_id:       string
  tipo:            "deposito" | "retiro"
  monto:           number
  saldo_anterior:  number
  saldo_posterior: number
  descripcion:     string
  created_at:      string
}

export interface GetCuentasResponse   { cuentas:      CuentaAhorro[] }
export interface GetCuentaResponse    { cuenta:       CuentaAhorro; transacciones: Transaccion[] }
export interface CuentaCreatedResponse { message:     string; cuenta: CuentaAhorro }
export interface TransaccionResponse  {
  message:         string
  transaccion:     Transaccion
  saldo_anterior:  number
  saldo_posterior: number
}