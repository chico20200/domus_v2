// src/api/socios.types.ts
export interface Socio {
  id:            string
  caja_id:       string
  cedula:        string
  nombre:        string
  apellido:      string
  telefono:      string
  email:         string
  direccion:     string
  fecha_ingreso: string
  activo:        boolean
  created_at:    string
}

export interface GetSociosResponse {
  socios: Socio[]
}

export interface GetSocioResponse {
  socio: Socio
}

export interface CreateSocioRequest {
  nombre:         string
  apellido:       string
  cedula:         string
  telefono?:      string
  email?:         string
  direccion?:     string
  fecha_ingreso?: string
}

export interface SocioResponse {
  message: string
  socio:   Socio
}