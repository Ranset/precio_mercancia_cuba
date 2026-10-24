import type { ModoPeso } from '../types';

/**
 * Formateo de números y montos.
 *
 * Se evita depender de Intl.NumberFormat con currency codes (p. ej. "CUP" no
 * siempre tiene datos ICU completos en todos los dispositivos Android), así que
 * el separador de miles se arma a mano y el símbolo de moneda se agrega como sufijo.
 */
function formatNumber(value: number, decimals = 2): string {
  if (!isFinite(value)) return (0).toFixed(decimals);
  const fixed = value.toFixed(decimals);
  const negative = fixed.startsWith('-');
  const [intPart, decPart] = (negative ? fixed.slice(1) : fixed).split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = negative ? '-' : '';
  return decPart ? `${sign}${withThousands}.${decPart}` : `${sign}${withThousands}`;
}

export const fmtNum = (value: number, decimals = 2): string => formatNumber(value, decimals);
export const fmtMXN = (value: number): string => `$${formatNumber(value)} MXN`;
export const fmtCUP = (value: number): string => `$${formatNumber(value)} CUP`;
export const fmtUSD = (value: number): string => `$${formatNumber(value)} USD`;
export const fmtKg = (value: number): string => `${formatNumber(value)} kg`;

/**
 * Equivalencia entre las dos formas de indicar el peso, como ayuda bajo el campo:
 * escribiendo el peso muestra los art/kg que salen, y escribiendo art/kg muestra los kg por artículo.
 */
export function fmtEquivalenciaPeso(modo: ModoPeso, articulosPorKg: number): string | undefined {
  if (!(articulosPorKg > 0) || !isFinite(articulosPorKg)) return undefined;
  if (modo === 'peso') {
    return `≈ ${formatNumber(articulosPorKg, articulosPorKg % 1 === 0 ? 0 : 2)} art/kg`;
  }
  // Los kg por artículo suelen ser fracciones chicas (0.0119): hasta 4 decimales, sin ceros de relleno.
  const kgPorArticulo = formatNumber(1 / articulosPorKg, 4).replace(/\.?0+$/, '');
  return `≈ ${kgPorArticulo} kg por artículo`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}
