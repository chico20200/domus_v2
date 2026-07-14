// src/api/ciclos.service.ts
import { apiClient } from "./api.client"
import type {
  GetCiclosResponse,
  ConfigCiclo,
  GuardarCicloResponse,
} from "./ciclos.types"

export const ciclosService = {
  async getCiclos(cajaId: string): Promise<GetCiclosResponse> {
    return apiClient.get<GetCiclosResponse>(`/cajas/${cajaId}/ciclos`)
  },

  async guardarConfig(cajaId: string, config: ConfigCiclo): Promise<GuardarCicloResponse> {
    return apiClient.put<GuardarCicloResponse>(
      `/cajas/${cajaId}/configuracion-ciclo`,
      config
    )
  },
}