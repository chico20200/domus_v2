// src/api/pagos.service.ts
import { apiClient } from "./api.client"
import type { AbonoResponse, PrepagoResponse, ProximaCuota } from "./pagos.types"
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
  async getProximaCuota(cajaId: string, creditoId: string): Promise<ProximaCuota> {
  return apiClient.get<ProximaCuota>(
    `/cajas/${cajaId}/creditos/${creditoId}/pagos/proxima-cuota`
  )
},
async prepagar(cajaId: string, creditoId: string): Promise<PrepagoResponse> {
  return apiClient.post<PrepagoResponse>(
    `/cajas/${cajaId}/creditos/${creditoId}/pagos/prepago`,
    {}
  )
},
async abonar(
  cajaId: string,
  creditoId: string,
  monto: number,
  motivo: string
): Promise<AbonoResponse> {
  return apiClient.post<AbonoResponse>(
    `/cajas/${cajaId}/creditos/${creditoId}/pagos/abono`,
    { monto, motivo }
  )
},
}

