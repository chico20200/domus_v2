// src/api/pagos.service.ts
import { apiClient } from './api.client'
import type { PagosResponse, PagoResponse, CreatePagoRequest, CreatePagoResponse } from './pagos.types'

export const pagosService = {
  async getPagos(cajaId: string): Promise<PagosResponse> {
    return apiClient.get<PagosResponse>(`/cajas/${cajaId}/pagos`)
  },

  async getPago(cajaId: string, pagoId: string): Promise<PagoResponse> {
    return apiClient.get<PagoResponse>(`/cajas/${cajaId}/pagos/${pagoId}`)
  },

  async getPagosByCredito(cajaId: string, creditoId: string): Promise<PagosResponse> {
    return apiClient.get<PagosResponse>(`/cajas/${cajaId}/pagos/credito/${creditoId}`)
  },

  async crear(cajaId: string, data: CreatePagoRequest): Promise<CreatePagoResponse> {
    return apiClient.post<CreatePagoResponse>(`/cajas/${cajaId}/pagos`, data)
  },
}

export default pagosService
