import type { AppData, Settings, Trip, TripItem } from '../types';

/** Forma del archivo .json de copia de seguridad (además de lo que guarda AppData). */
export interface BackupFile {
  version: 1;
  exportedAt: string;
  settings: Settings;
  trips: Trip[];
}

export interface ParsedBackup extends AppData {
  /** Fecha en la que se generó el archivo, si el archivo la trae (para mostrarla antes de restaurar). */
  exportedAt?: string;
}

/** Arma el objeto que se guarda en el archivo exportado. */
export function buildBackup(settings: Settings, trips: Trip[]): BackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    trips,
  };
}

/**
 * Valida y convierte el contenido de un archivo de copia de seguridad a los tipos
 * internos de la app. Nunca confía en la forma del JSON: revisa campo por campo y
 * lanza un Error con un mensaje en español entendible si algo no cuadra.
 */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  if (!isRecord(raw)) {
    throw new Error('El archivo no tiene el formato esperado de una copia de seguridad.');
  }

  const settings = parseSettings(raw.settings);
  const trips = parseTrips(raw.trips);
  const exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : undefined;

  return { version: 1, settings, trips, exportedAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

function parseSettings(value: unknown): Settings {
  if (!isRecord(value)) throw new Error('Falta la configuración ("settings") en el archivo.');
  if (!isFiniteNumber(value.tasaMXN) || !isFiniteNumber(value.tasaCUP) || !isFiniteNumber(value.precioRemesa)) {
    throw new Error('La configuración del archivo tiene tasas inválidas.');
  }
  return { tasaMXN: value.tasaMXN, tasaCUP: value.tasaCUP, precioRemesa: value.precioRemesa };
}

function parseTrips(value: unknown): Trip[] {
  if (!Array.isArray(value)) throw new Error('Falta la lista de viajes ("trips") en el archivo.');
  return value.map((trip, index) => parseTrip(trip, index));
}

function parseTrip(value: unknown, index: number): Trip {
  if (!isRecord(value)) throw new Error(`El viaje #${index + 1} del archivo no es válido.`);
  const { id, nombre, createdAt, tasaMXN, tasaCUP, precioRemesa, items } = value;

  if (typeof id !== 'string' || typeof nombre !== 'string' || typeof createdAt !== 'string') {
    throw new Error(`El viaje #${index + 1} del archivo tiene campos básicos inválidos.`);
  }
  if (!isFiniteNumber(tasaMXN) || !isFiniteNumber(tasaCUP) || !isFiniteNumber(precioRemesa)) {
    throw new Error(`El viaje "${nombre}" del archivo tiene tasas inválidas.`);
  }
  if (!Array.isArray(items)) {
    throw new Error(`El viaje "${nombre}" del archivo no tiene una lista de artículos válida.`);
  }

  return {
    id,
    nombre,
    createdAt,
    tasaMXN,
    tasaCUP,
    precioRemesa,
    items: items.map((item, itemIndex) => parseItem(item, nombre, itemIndex)),
  };
}

function parseItem(value: unknown, tripName: string, index: number): TripItem {
  if (!isRecord(value)) throw new Error(`El artículo #${index + 1} del viaje "${tripName}" no es válido.`);
  const { id, producto, cantidad, articulosPorKg, gananciaKgUSD, costoArticuloMXN } = value;

  if (typeof id !== 'string' || typeof producto !== 'string') {
    throw new Error(`Un artículo del viaje "${tripName}" tiene campos inválidos.`);
  }
  if (
    !isFiniteNumber(cantidad) ||
    !isFiniteNumber(articulosPorKg) ||
    !isFiniteNumber(gananciaKgUSD) ||
    !isFiniteNumber(costoArticuloMXN)
  ) {
    throw new Error(`El artículo "${producto}" del viaje "${tripName}" tiene montos inválidos.`);
  }

  return { id, producto, cantidad, articulosPorKg, gananciaKgUSD, costoArticuloMXN };
}
