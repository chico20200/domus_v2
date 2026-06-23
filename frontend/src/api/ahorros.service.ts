// src/api/ahorros.service.ts
import { apiClient } from "./api.client"
import type {
  GetCuentasResponse,
  GetCuentaResponse,
  CuentaCreatedResponse,
  TransaccionResponse,
} from "./ahorros.types"

export const ahorrosService = {
  async getCuentas(cajaId: string): Promise<GetCuentasResponse> {
    return apiClient.get<GetCuentasResponse>(`/cajas/${cajaId}/cuentas`)
  },

  async getCuenta(cajaId: string, cuentaId: string): Promise<GetCuentaResponse> {
    return apiClient.get<GetCuentaResponse>(`/cajas/${cajaId}/cuentas/${cuentaId}`)
  },

  async getCuentasSocio(cajaId: string, socioId: string): Promise<GetCuentasResponse> {
    return apiClient.get<GetCuentasResponse>(`/cajas/${cajaId}/cuentas/socio/${socioId}`)
  },

  async abrirCuenta(cajaId: string, socioId: string): Promise<CuentaCreatedResponse> {
    return apiClient.post<CuentaCreatedResponse>(`/cajas/${cajaId}/cuentas`, { socio_id: socioId })
  },

  async depositar(cajaId: string, cuentaId: string, monto: number, descripcion?: string): Promise<TransaccionResponse> {
    return apiClient.post<TransaccionResponse>(
      `/cajas/${cajaId}/cuentas/${cuentaId}/deposito`,
      { monto, descripcion }
    )
  },

  async retirar(cajaId: string, cuentaId: string, monto: number, descripcion?: string): Promise<TransaccionResponse> {
    return apiClient.post<TransaccionResponse>(
      `/cajas/${cajaId}/cuentas/${cuentaId}/retiro`,
      { monto, descripcion }
    )
  },
}