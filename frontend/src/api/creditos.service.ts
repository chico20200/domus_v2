// src/api/creditos.service.ts
import { apiClient } from './api.client'
import type {
  GetCreditosResponse,
  GetCreditoResponse,
  CreateCreditoRequest,
  CreateCreditoResponse,
  // PagoCreditoResponse,
  ChangeEstadoResponse,
} from './creditos.types'

export const creditosService = {
  async getCreditos(cajaId: string): Promise<GetCreditosResponse> {
    return apiClient.get<GetCreditosResponse>(`/cajas/${cajaId}/creditos`)
  },

  async getCredito(cajaId: string, creditoId: string): Promise<GetCreditoResponse> {
    return apiClient.get<GetCreditoResponse>(`/cajas/${cajaId}/creditos/${creditoId}`)
  },

  async getCreditosSocio(cajaId: string, socioId: string): Promise<GetCreditosResponse> {
    return apiClient.get<GetCreditosResponse>(`/cajas/${cajaId}/creditos/socio/${socioId}`)
  },

  async crear(cajaId: string, data: CreateCreditoRequest): Promise<CreateCreditoResponse> {
    return apiClient.post<CreateCreditoResponse>(`/cajas/${cajaId}/creditos`, data)
  },

  async aprobar(cajaId: string, creditoId: string, fecha_desembolso?: string): Promise<CreateCreditoResponse> {
    return apiClient.put<CreateCreditoResponse>(`/cajas/${cajaId}/creditos/${creditoId}/aprobar`, { fecha_desembolso })
  },

  // async pago(cajaId: string, creditoId: string, monto: number, descripcion?: string): Promise<PagoCreditoResponse> {
  //   return apiClient.post<PagoCreditoResponse>(`/cajas/${cajaId}/creditos/${creditoId}/pago`, { monto, descripcion })
  // },

  async cambiarEstado(cajaId: string, creditoId: string, estado: string): Promise<ChangeEstadoResponse> {
    return apiClient.put<ChangeEstadoResponse>(`/cajas/${cajaId}/creditos/${creditoId}/estado`, { estado })
  },
}
