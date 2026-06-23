// src/api/cajas.service.ts
import { apiClient }           from "./api.client"
import type {
  GetMisCajasResponse,
  CreateCajaRequest,
  CreateCajaResponse,
} from "./cajas.types"

export const cajasService = {
  async getMisCajas(): Promise<GetMisCajasResponse> {
    return apiClient.get<GetMisCajasResponse>("/cajas/mis-cajas")
  },

  async crear(data: CreateCajaRequest): Promise<CreateCajaResponse> {
    return apiClient.post<CreateCajaResponse>("/cajas", data)
  },
}