import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Rates, Settings, Trip, TripItem } from '../types';
import { loadAppData, saveAppData } from '../lib/storage';
import { newId } from '../lib/id';
import { DEFAULT_SETTINGS } from '../lib/defaults';

type Action =
  | { type: 'HYDRATE'; data: AppData }
  | { type: 'RESTORE_DATA'; data: AppData }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'CREATE_TRIP'; trip: Trip }
  | { type: 'RENAME_TRIP'; tripId: string; nombre: string }
  | { type: 'UPDATE_TRIP_RATES'; tripId: string; patch: Partial<Rates> }
  | { type: 'DELETE_TRIP'; tripId: string }
  | { type: 'ADD_ITEM'; tripId: string; item: TripItem }
  | { type: 'UPDATE_ITEM'; tripId: string; itemId: string; patch: Partial<Omit<TripItem, 'id'>> }
  | { type: 'DELETE_ITEM'; tripId: string; itemId: string };

const initialData: AppData = { version: 1, settings: { ...DEFAULT_SETTINGS }, trips: [] };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'HYDRATE':
    case 'RESTORE_DATA':
      return action.data;

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'CREATE_TRIP':
      return { ...state, trips: [action.trip, ...state.trips] };

    case 'RENAME_TRIP':
      return {
        ...state,
        trips: state.trips.map((t) => (t.id === action.tripId ? { ...t, nombre: action.nombre } : t)),
      };

    case 'UPDATE_TRIP_RATES':
      return {
        ...state,
        trips: state.trips.map((t) => (t.id === action.tripId ? { ...t, ...action.patch } : t)),
      };

    case 'DELETE_TRIP':
      return { ...state, trips: state.trips.filter((t) => t.id !== action.tripId) };

    case 'ADD_ITEM':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.tripId ? { ...t, items: [...t.items, action.item] } : t,
        ),
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.tripId
            ? { ...t, items: t.items.map((it) => (it.id === action.itemId ? { ...it, ...action.patch } : it)) }
            : t,
        ),
      };

    case 'DELETE_ITEM':
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.tripId ? { ...t, items: t.items.filter((it) => it.id !== action.itemId) } : t,
        ),
      };

    default:
      return state;
  }
}

export interface NewItemInput {
  producto: string;
  cantidad: number;
  articulosPorKg: number;
  /** Ver `TripItem.pesoArticuloKg`. Al editar, pasar la clave con `undefined` para quitar un peso guardado antes. */
  pesoArticuloKg?: number;
  gananciaKgUSD: number;
  costoArticuloMXN: number;
}

interface AppDataContextValue {
  settings: Settings;
  trips: Trip[];
  /** false mientras se están leyendo los datos guardados en el dispositivo. */
  hydrated: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Reemplaza TODOS los viajes y la configuración por los de una copia de seguridad importada. */
  restoreAllData: (data: AppData) => void;
  createTrip: (nombre: string, rates: Rates) => Trip;
  renameTrip: (tripId: string, nombre: string) => void;
  updateTripRates: (tripId: string, patch: Partial<Rates>) => void;
  deleteTrip: (tripId: string) => void;
  addItem: (tripId: string, item: NewItemInput) => void;
  updateItem: (tripId: string, itemId: string, patch: Partial<Omit<TripItem, 'id'>>) => void;
  deleteItem: (tripId: string, itemId: string) => void;
  getTrip: (tripId: string) => Trip | undefined;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialData);
  const [hydrated, setHydrated] = useState(false);

  // Carga inicial desde el almacenamiento del dispositivo.
  useEffect(() => {
    let cancelled = false;
    loadAppData().then((data) => {
      if (cancelled) return;
      dispatch({ type: 'HYDRATE', data });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Guarda cambios con un pequeño debounce, para no escribir en cada tecla.
  useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => {
      saveAppData(state);
    }, 300);
    return () => clearTimeout(handle);
  }, [state, hydrated]);

  const value = useMemo<AppDataContextValue>(() => {
    return {
      settings: state.settings,
      trips: state.trips,
      hydrated,

      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),

      restoreAllData: (data) => dispatch({ type: 'RESTORE_DATA', data }),

      createTrip: (nombre, rates) => {
        const trip: Trip = {
          id: newId(),
          nombre: nombre.trim() || 'Viaje sin nombre',
          createdAt: new Date().toISOString(),
          tasaMXN: rates.tasaMXN,
          tasaCUP: rates.tasaCUP,
          precioRemesa: rates.precioRemesa,
          items: [],
        };
        dispatch({ type: 'CREATE_TRIP', trip });
        return trip;
      },

      renameTrip: (tripId, nombre) => dispatch({ type: 'RENAME_TRIP', tripId, nombre }),

      updateTripRates: (tripId, patch) => dispatch({ type: 'UPDATE_TRIP_RATES', tripId, patch }),

      deleteTrip: (tripId) => dispatch({ type: 'DELETE_TRIP', tripId }),

      addItem: (tripId, item) => {
        dispatch({ type: 'ADD_ITEM', tripId, item: { id: newId(), ...item } });
      },

      updateItem: (tripId, itemId, patch) => dispatch({ type: 'UPDATE_ITEM', tripId, itemId, patch }),

      deleteItem: (tripId, itemId) => dispatch({ type: 'DELETE_ITEM', tripId, itemId }),

      getTrip: (tripId) => state.trips.find((t) => t.id === tripId),
    };
  }, [state, hydrated]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData debe usarse dentro de <AppDataProvider>');
  return ctx;
}
