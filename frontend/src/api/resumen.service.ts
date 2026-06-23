// src/api/resumen.service.ts
import { apiClient }          from "./api.client"
import type { GetResumenResponse } from "./resumen.types"

export const resumenService = {
  async getResumen(cajaId: string): Promise<GetResumenResponse> {
    return apiClient.get<GetResumenResponse>(`/cajas/${cajaId}/resumen`)
  },
}