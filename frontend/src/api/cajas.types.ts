// src/api/cajas.types.ts
export interface Caja {
  id:          string
  nombre:      string
  descripcion: string
  creado_por:  string
  activa:      boolean
  created_at:  string
}

export interface MiCaja {
  id:          string
  nombre:      string
  descripcion: string
  rol:         "admin" | "tesorero" | "socio"
}

export interface GetMisCajasResponse {
  cajas: MiCaja[]
}

export interface CreateCajaRequest {
  nombre:      string
  descripcion?: string
}

export interface CreateCajaResponse {
  message: string
  caja:    Caja
}