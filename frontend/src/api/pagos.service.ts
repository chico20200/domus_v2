// src/api/pagos.service.ts
import { apiClient } from "./api.client"
import type {
  GetPagosResponse,
  RegistrarPagoResponse,
  TipoPago,
} from "./pagos.types"

export const pagosService = {
  async getPagos(cajaId: string, creditoId: string): Promise<GetPagosResponse> {
    return apiClient.get<GetPagosResponse>(
      `/cajas/${cajaId}/creditos/${creditoId}/pagos`
    )
  },

  async registrarPago(
    cajaId: string,
    creditoId: string,
    tipoPago: TipoPago
  ): Promise<RegistrarPagoResponse> {
    return apiClient.post<RegistrarPagoResponse>(
      `/cajas/${cajaId}/creditos/${creditoId}/pagos`,
      { tipo_pago: tipoPago }
    )
  },
}