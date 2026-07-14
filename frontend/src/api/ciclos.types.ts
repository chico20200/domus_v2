// src/api/ciclos.types.ts
export interface Ciclo {
  numero:  number
  inicio:  string
  fin:     string
  meses:   string[]
  label:   string
  cerrado: boolean
  actual:  boolean
}

export interface CicloResumen {
  numero:  number
  label:   string
  cerrado: boolean
  actual:  boolean
}

export interface ConfigCiclo {
  fecha_fundacion:  string
  mes_inicio_ciclo: number
  duracion_ciclo:   number
}

export interface GetCiclosResponse {
  configurado:  boolean
  config?:      ConfigCiclo
  ciclos:       Ciclo[]
  ciclo_actual: Ciclo | null
  mensaje?:     string
}

export interface GuardarCicloResponse {
  message:      string
  ciclos:       Ciclo[]
  ciclo_actual: Ciclo
}