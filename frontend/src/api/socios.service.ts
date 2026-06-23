// src/api/socios.service.ts
import { apiClient }             from "./api.client"
import type {
  GetSociosResponse,
  GetSocioResponse,
  CreateSocioRequest,
  SocioResponse,
} from "./socios.types"

export const sociosService = {
  async getSocios(cajaId: string): Promise<GetSociosResponse> {
    return apiClient.get<GetSociosResponse>(`/cajas/${cajaId}/socios`)
  },

  async getSocio(cajaId: string, socioId: string): Promise<GetSocioResponse> {
    return apiClient.get<GetSocioResponse>(`/cajas/${cajaId}/socios/${socioId}`)
  },

  async crear(cajaId: string, data: CreateSocioRequest): Promise<SocioResponse> {
    return apiClient.post<SocioResponse>(`/cajas/${cajaId}/socios`, data)
  },

  async actualizar(cajaId: string, socioId: string, data: Partial<CreateSocioRequest>): Promise<SocioResponse> {
    return apiClient.put<SocioResponse>(`/cajas/${cajaId}/socios/${socioId}`, data)
  },

  async desactivar(cajaId: string, socioId: string): Promise<{ message: string }> {
    return apiClient.delete(`/cajas/${cajaId}/socios/${socioId}`)
  },
}