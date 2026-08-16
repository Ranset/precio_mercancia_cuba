import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'precio_cuba_theme_v1';
const DEFAULT_THEME: Theme = 'dark';

const BG_BY_THEME: Record<Theme, string> = {
  dark: '#101415',
  light: '#eef1f4',
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Tema claro/oscuro elegido a mano en Configuración (no sigue el tema del
 * sistema). Se guarda aparte de AppData (no de settings/trips), para que
 * "Borrar todos los datos" no lo reinicie sin querer.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  // false hasta terminar de leer lo guardado. Sin esto, el efecto que persiste
  // dispararía en el primer render con el valor por defecto y pisaría
  // cualquier preferencia ya guardada antes de que la lectura llegara a tiempo.
  const [hydrated, setHydrated] = useState(false);

  // Carga la preferencia guardada (si nunca se eligió nada, se queda en el default).
  useEffect(() => {
    let cancelled = false;
    Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (cancelled) return;
      if (value === 'light' || value === 'dark') setTheme(value);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Aplica el tema al documento y actualiza el color de la barra del navegador.
  // Corre siempre (incluso antes de hidratar), para que se vea el default sin parpadeos.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', BG_BY_THEME[theme]);
  }, [theme]);

  // Solo guarda una vez hidratado (ver comentario arriba).
  useEffect(() => {
    if (!hydrated) return;
    Preferences.set({ key: STORAGE_KEY, value: theme }).catch(() => {});
  }, [theme, hydrated]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
