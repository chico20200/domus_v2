// src/api/amortizacion.types.ts
export interface AbonoRegistrado {
  monto: number;
  motivo: string;
  fecha_pago: string;
}

export interface MovimientoPago {
  monto: number;
  capital: number;
  interes: number;
  es_abono: boolean;
  es_prepago: boolean;
  motivo: string | null;
  fecha_pago: string;
}

export interface FilaAmortizacion {
  numero_cuota: number;
  capital: number;
  interes: number;
  cuota: number;
  saldo_restante: number;
  fecha_vencimiento: string | null;
  capital_pagado: number;
  interes_pagado: number;
  falta_capital: number;
  falta_interes: number;
  interes_condonado: number;
  pagada: boolean;
  parcial: boolean;
  vencida: boolean;
  es_prepago: boolean;
  fecha_pago: string | null;
  movimientos: MovimientoPago[]; // ← nuevo
  abonos: MovimientoPago[];
  tiene_abonos: boolean;
  es_fraccionada: boolean; // ← nuevo
}

export interface GetAmortizacionResponse {
  credito: {
    id: string;
    socio?: { nombre: string; apellido: string; cedula?: string };
    monto_solicitado: number;
    tasa_interes: number;
    plazo_meses: number;
    monto_total: number;
    interes_total: number;
    estado: string;
    saldo_pendiente: number;
    fecha_desembolso: string | null;
  };
  tabla: FilaAmortizacion[];
  resumen: {
    capital_pagado: number;
    interes_pagado: number;
    interes_condonado: number;
    cuotas_pagadas: number;
    cuotas_vencidas: number;
    cuotas_totales: number;
    total_abonos: number;
  };
}
