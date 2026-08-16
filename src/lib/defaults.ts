import type { Settings } from '../types';

/** Valores iniciales razonables; el usuario los ajusta en Configuración. */
export const DEFAULT_SETTINGS: Settings = {
  tasaMXN: 17,
  tasaCUP: 680,
  precioRemesa: 40,
};

export const GANANCIA_KG_DEFAULT = 20;
export const GANANCIA_KG_SLIDER_MIN = 15;
export const GANANCIA_KG_SLIDER_MAX = 50;
export const GANANCIA_KG_MANUAL_MIN = 0;
export const GANANCIA_KG_MANUAL_MAX = 10000;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Sugerencia de nombre para un viaje nuevo, ej. "Viaje agosto 2026". */
export function sugerirNombreViaje(date: Date = new Date()): string {
  return `Viaje ${MESES[date.getMonth()]} ${date.getFullYear()}`;
}
