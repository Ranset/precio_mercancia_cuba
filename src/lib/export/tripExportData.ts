import type { Trip } from '../../types';
import { calcularItem, calcularTotalesViaje } from '../calculations';
import type { TotalesViaje } from '../calculations';

export interface TripExportRow {
  producto: string;
  cantidad: number;
  articulosPorKg: number;
  gananciaKgUSD: number;
  costoArticuloMXN: number;
  costoTotalMXN: number;
  precioVentaArticuloCUP: number;
  precioEnCubaCorregido: number;
  precioTotalCUP: number;
  pesoKg: number;
}

export interface TripExportData {
  rows: TripExportRow[];
  totales: TotalesViaje;
}

/** Junta, para un viaje, los mismos montos que se ven en TripDetail — usado por los exportadores a PDF/Excel. */
export function buildTripExportData(trip: Trip): TripExportData {
  const rows: TripExportRow[] = trip.items.map((item) => ({
    producto: item.producto,
    cantidad: item.cantidad,
    articulosPorKg: item.articulosPorKg,
    gananciaKgUSD: item.gananciaKgUSD,
    costoArticuloMXN: item.costoArticuloMXN,
    ...calcularItem(item, trip),
  }));

  return { rows, totales: calcularTotalesViaje(trip) };
}
