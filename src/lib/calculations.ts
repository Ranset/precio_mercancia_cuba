import type { ModoPeso, Rates, Trip, TripItem } from '../types';

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
 *
 * Alternativa al "artículos por kg": si el artículo trae `pesoArticuloKg` (peso de una unidad en
 * kilogramos), la ganancia por artículo es GananciaKgUSD * PesoKg y PesoKg total = Cantidad * PesoKg.
 * Es la misma cuenta, pero sin pasar por 1/kg (inexacto en coma flotante) ni multiplicar el decimal
 * tal cual lo escribió el usuario (0.061 no existe exacto en binario): tras el redondeo a 10, ambas
 * cosas a veces suben el precio 10 CUP de más. Por eso el peso se "limpia" a 6 decimales (ver
 * `pesoMicro`) antes de multiplicar.
 */

/** Múltiplo al que se redondea hacia arriba el precio de venta en Cuba. */
export const MULTIPLO_REDONDEO = 10;

type ItemInput = Pick<
  TripItem,
  'cantidad' | 'costoArticuloMXN' | 'gananciaKgUSD' | 'articulosPorKg' | 'pesoArticuloKg'
>;
/** Precio unitario: no depende de la cantidad (útil para la vista previa de la Calculadora, antes de elegir cuántas unidades). */
type UnitPriceInput = Pick<TripItem, 'costoArticuloMXN' | 'gananciaKgUSD' | 'articulosPorKg' | 'pesoArticuloKg'>;

/** Escala a la que se "limpia" el peso escrito en kg: 1e6 = hasta 6 decimales (1 miligramo). */
const ESCALA_PESO = 1e6;

/** Devuelve el denominador tal cual si es utilizable (> 0), o NaN si no lo es. */
function safeDenominator(value: number): number {
  return value > 0 && isFinite(value) ? value : NaN;
}

/** El peso por unidad (kg) que el usuario escribió, si es utilizable; si no, undefined y se usa `articulosPorKg`. */
function pesoDirectoKg(item: Pick<TripItem, 'pesoArticuloKg'>): number | undefined {
  const kg = item.pesoArticuloKg;
  return typeof kg === 'number' && kg > 0 && isFinite(kg) ? kg : undefined;
}

/** `pesoKg` como entero en la escala de `ESCALA_PESO` (elimina el ruido binario de decimales como 0.061). */
function pesoMicro(pesoKg: number): number {
  return Math.round(pesoKg * ESCALA_PESO);
}

/** Artículos por kilogramo equivalentes a un artículo de `pesoKg` kilogramos (0 si el peso no sirve). */
export function articulosPorKgDesdePesoKg(pesoKg: number): number {
  return pesoKg > 0 && isFinite(pesoKg) ? 1 / pesoKg : 0;
}

/**
 * Convierte lo que el usuario tiene en el formulario (según el modo elegido) a los campos que se
 * guardan en el artículo. `pesoArticuloKg` va siempre como clave (undefined en el modo "art/kg")
 * para que, al editar un artículo, el modo anterior se borre en vez de quedarse pegado.
 */
export function resolverPesoArticulo(
  modo: ModoPeso,
  articulosPorKg: number | null,
  pesoArticuloKg: number | null,
): { articulosPorKg: number; pesoArticuloKg: number | undefined } {
  if (modo === 'peso') {
    const kg = pesoDirectoKg({ pesoArticuloKg: pesoArticuloKg ?? undefined });
    return { articulosPorKg: kg === undefined ? 0 : articulosPorKgDesdePesoKg(kg), pesoArticuloKg: kg };
  }
  return { articulosPorKg: articulosPorKg ?? 0, pesoArticuloKg: undefined };
}

export function calcCostoTotalMXN(item: Pick<TripItem, 'cantidad' | 'costoArticuloMXN'>): number {
  const total = item.cantidad * item.costoArticuloMXN;
  return isFinite(total) ? total : 0;
}

/** Precio de venta del artículo en Cuba, en CUP, SIN redondear (columna "Precio venta artículo"). */
export function calcPrecioVentaArticuloCUP(item: UnitPriceInput, rates: Rates): number {
  const tasaMXN = safeDenominator(rates.tasaMXN);
  if (!isFinite(tasaMXN)) return 0;

  const pesoKg = pesoDirectoKg(item);
  let gananciaArticuloCUP: number;
  if (pesoKg !== undefined) {
    gananciaArticuloCUP = ((item.gananciaKgUSD * pesoMicro(pesoKg)) / ESCALA_PESO) * rates.tasaCUP;
  } else {
    const articulosPorKg = safeDenominator(item.articulosPorKg);
    if (!isFinite(articulosPorKg)) return 0;
    gananciaArticuloCUP = (item.gananciaKgUSD / articulosPorKg) * rates.tasaCUP;
  }

  const costoCUP = (item.costoArticuloMXN / tasaMXN) * rates.tasaCUP;
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

/** Peso que representa la Cantidad de este artículo, en kilogramos (Cantidad ÷ Artículos por Kg, o Cantidad × peso por unidad). */
export function calcPesoKg(item: Pick<TripItem, 'cantidad' | 'articulosPorKg' | 'pesoArticuloKg'>): number {
  const pesoUnidadKg = pesoDirectoKg(item);
  if (pesoUnidadKg !== undefined) {
    const peso = (item.cantidad * pesoMicro(pesoUnidadKg)) / ESCALA_PESO;
    return isFinite(peso) ? peso : 0;
  }

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
