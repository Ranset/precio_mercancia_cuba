import type { Rates, Trip, TripItem } from '../types';

/**
 * Motor de cálculo. Replica exactamente las fórmulas del Excel original
 * ("Mercancía Ale.xlsx"), verificadas fila por fila:
 *
 *   CostoTotal        = Cantidad * CostoArticuloMXN                       (col. F)
 *   PrecioVentaCUP    = (CostoArticuloMXN / TasaMXN * TasaCUP)
 *                       + (GananciaKgUSD / ArticulosPorKg * TasaCUP)      (col. G)
 *   PrecioEnCuba      = CEILING(PrecioVentaCUP, 10)                       (col. H)
 *   PrecioTotalCUP    = Cantidad * PrecioEnCuba                          (col. I)
 *
 *   InversionTotalMXN       = SUMA(CostoTotal de todos los artículos)     (F22)
 *   MontoTotalViajeCUP      = SUMA(PrecioTotalCUP de todos los artículos) (I22)
 *   VentaTotalConvertidaMXN = MontoTotalViajeCUP / PrecioRemesa           (I23)
 *   GananciaMXN             = VentaTotalConvertidaMXN - InversionTotalMXN (I24)
 *
 * PesoKg (no viene del Excel original, se agregó después) = Cantidad / ArticulosPorKg:
 * si 1 kg trae 2 artículos y se agregan 3, esos 3 pesan 3/2 = 1.5 kg.
 */

/** Múltiplo al que se redondea hacia arriba el precio de venta en Cuba. */
export const MULTIPLO_REDONDEO = 10;

type ItemInput = Pick<TripItem, 'cantidad' | 'costoArticuloMXN' | 'gananciaKgUSD' | 'articulosPorKg'>;
/** Precio unitario: no depende de la cantidad (útil para la vista previa de la Calculadora, antes de elegir cuántas unidades). */
type UnitPriceInput = Pick<TripItem, 'costoArticuloMXN' | 'gananciaKgUSD' | 'articulosPorKg'>;

/** Devuelve el denominador tal cual si es utilizable (> 0), o NaN si no lo es. */
function safeDenominator(value: number): number {
  return value > 0 && isFinite(value) ? value : NaN;
}

export function calcCostoTotalMXN(item: Pick<TripItem, 'cantidad' | 'costoArticuloMXN'>): number {
  const total = item.cantidad * item.costoArticuloMXN;
  return isFinite(total) ? total : 0;
}

/** Precio de venta del artículo en Cuba, en CUP, SIN redondear (columna "Precio venta artículo"). */
export function calcPrecioVentaArticuloCUP(item: UnitPriceInput, rates: Rates): number {
  const tasaMXN = safeDenominator(rates.tasaMXN);
  const articulosPorKg = safeDenominator(item.articulosPorKg);
  if (!isFinite(tasaMXN) || !isFinite(articulosPorKg)) return 0;

  const costoCUP = (item.costoArticuloMXN / tasaMXN) * rates.tasaCUP;
  const gananciaArticuloCUP = (item.gananciaKgUSD / articulosPorKg) * rates.tasaCUP;
  const total = costoCUP + gananciaArticuloCUP;
  return isFinite(total) ? total : 0;
}

/** Redondea hacia arriba al próximo múltiplo de 10 (equivalente a =CEILING(precio,10)). */
export function calcPrecioEnCubaCorregido(precioVentaArticuloCUP: number): number {
  if (!isFinite(precioVentaArticuloCUP) || precioVentaArticuloCUP <= 0) return 0;
  return Math.ceil(precioVentaArticuloCUP / MULTIPLO_REDONDEO) * MULTIPLO_REDONDEO;
}

export function calcPrecioTotalCUP(cantidad: number, precioEnCubaCorregido: number): number {
  const total = cantidad * precioEnCubaCorregido;
  return isFinite(total) ? total : 0;
}

/** Peso que representa la Cantidad de este artículo, en kilogramos (Cantidad ÷ Artículos por Kg). */
export function calcPesoKg(item: Pick<TripItem, 'cantidad' | 'articulosPorKg'>): number {
  const articulosPorKg = safeDenominator(item.articulosPorKg);
  if (!isFinite(articulosPorKg)) return 0;
  const peso = item.cantidad / articulosPorKg;
  return isFinite(peso) ? peso : 0;
}

export interface ItemCalculado {
  costoTotalMXN: number;
  precioVentaArticuloCUP: number;
  precioEnCubaCorregido: number;
  precioTotalCUP: number;
  pesoKg: number;
}

/** Calcula, a partir de los campos que edita el usuario, todos los montos derivados de un artículo. */
export function calcularItem(item: ItemInput, rates: Rates): ItemCalculado {
  const costoTotalMXN = calcCostoTotalMXN(item);
  const precioVentaArticuloCUP = calcPrecioVentaArticuloCUP(item, rates);
  const precioEnCubaCorregido = calcPrecioEnCubaCorregido(precioVentaArticuloCUP);
  const precioTotalCUP = calcPrecioTotalCUP(item.cantidad, precioEnCubaCorregido);
  const pesoKg = calcPesoKg(item);
  return { costoTotalMXN, precioVentaArticuloCUP, precioEnCubaCorregido, precioTotalCUP, pesoKg };
}

export interface TotalesViaje {
  inversionTotalMXN: number;
  montoTotalViajeCUP: number;
  ventaTotalConvertidaMXN: number;
  gananciaMXN: number;
  pesoTotalKg: number;
}

/** Calcula los totales agregados de un viaje completo a partir de sus artículos y sus propias tasas. */
export function calcularTotalesViaje(trip: Trip): TotalesViaje {
  let inversionTotalMXN = 0;
  let montoTotalViajeCUP = 0;
  let pesoTotalKg = 0;

  for (const item of trip.items) {
    const calculado = calcularItem(item, trip);
    inversionTotalMXN += calculado.costoTotalMXN;
    montoTotalViajeCUP += calculado.precioTotalCUP;
    pesoTotalKg += calculado.pesoKg;
  }

  const precioRemesa = safeDenominator(trip.precioRemesa);
  const ventaTotalConvertidaMXN = isFinite(precioRemesa) ? montoTotalViajeCUP / precioRemesa : 0;
  const gananciaMXN = ventaTotalConvertidaMXN - inversionTotalMXN;

  return { inversionTotalMXN, montoTotalViajeCUP, ventaTotalConvertidaMXN, gananciaMXN, pesoTotalKg };
}
