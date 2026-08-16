import { Preferences } from '@capacitor/preferences';
import type { AppData } from '../types';
import { DEFAULT_SETTINGS } from './defaults';

const STORAGE_KEY = 'precio_cuba_data_v1';

function emptyData(): AppData {
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, trips: [] };
}

/**
 * Lee los datos guardados en el dispositivo (SharedPreferences en Android,
 * localStorage en la web) y los normaliza. Si no hay nada guardado o el
 * contenido está corrupto, devuelve datos vacíos en vez de fallar.
 */
export async function loadAppData(): Promise<AppData> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) return emptyData();

    const parsed = JSON.parse(value) as Partial<AppData> | null;
    if (!parsed || typeof parsed !== 'object') return emptyData();

    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
    };
  } catch (err) {
    console.error('[storage] No se pudieron leer los datos guardados, se usan valores por defecto.', err);
    return emptyData();
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(data) });
  } catch (err) {
    console.error('[storage] No se pudieron guardar los datos.', err);
  }
}
