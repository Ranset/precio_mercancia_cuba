/**
 * Tasas de cambio y parámetros de conversión.
 *
 * - tasaMXN: cuántos pesos mexicanos equivalen a 1 USD.
 * - tasaCUP: cuántos pesos cubanos equivalen a 1 USD.
 * - precioRemesa: cuántos pesos cubanos equivalen a 1 peso mexicano al convertir de
 *   vuelta a México el dinero de las ventas (ej. mediante un servicio de remesas).
 */
export interface Rates {
  tasaMXN: number;
  tasaCUP: number;
  precioRemesa: number;
}

/** Cómo indica el usuario el peso de un artículo en los formularios: artículos por kg, o peso de una unidad. */
export type ModoPeso = 'articulos' | 'peso';

/** Configuración global: valores por defecto para la Calculadora y para viajes nuevos. */
export type Settings = Rates;

/** Un artículo dentro de un viaje (fila del Excel original). */
export interface TripItem {
  id: string;
  producto: string;
  cantidad: number;
  /** Artículos por kilogramo, usado para prorratear la ganancia de envío. */
  articulosPorKg: number;
  /**
   * Peso de UN artículo en kilogramos, solo si el usuario lo escribió directamente en vez de
   * "artículos por kg". Cuando está presente, los cálculos usan este valor (evita el error de
   * coma flotante de 1 ÷ kg); `articulosPorKg` se guarda igual (= 1 ÷ pesoArticuloKg) solo
   * para mostrarlo y exportarlo. Su presencia también indica el modo con que se reabre el formulario.
   */
  pesoArticuloKg?: number;
  /** Ganancia deseada por kilogramo de envío, en USD. */
  gananciaKgUSD: number;
  /** Costo de compra de una unidad del artículo, en pesos mexicanos. */
  costoArticuloMXN: number;
}

/** Un viaje: conjunto de artículos comprados con las tasas vigentes en ese momento. */
export interface Trip extends Rates {
  id: string;
  nombre: string;
  createdAt: string;
  items: TripItem[];
}

/** Forma completa de los datos persistidos en el dispositivo. */
export interface AppData {
  version: 1;
  settings: Settings;
  trips: Trip[];
}
