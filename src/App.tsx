import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppDataProvider } from './state/AppDataContext';
import { ThemeProvider, useTheme } from './state/ThemeContext';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Trips } from './pages/Trips';
import { TripDetail } from './pages/TripDetail';
import { Settings } from './pages/Settings';

/** En Android, hace que el botón físico "atrás" navegue dentro de la app antes de salir de ella. */
function BackButtonHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);

  return null;
}

/** Pinta la barra de estado nativa según el tema elegido, en vez del gris/blanco por defecto. */
function StatusBarSetup() {
  const { theme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const isDark = theme === 'dark';
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    StatusBar.setBackgroundColor({ color: isDark ? '#101415' : '#eef1f4' }).catch(() => {});
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
  }, [theme]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <HashRouter>
          <BackButtonHandler />
          <StatusBarSetup />
          <div className="app-shell">
            <main className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/viajes" element={<Trips />} />
                <Route path="/viajes/:id" element={<TripDetail />} />
                <Route path="/configuracion" element={<Settings />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </HashRouter>
      </AppDataProvider>
    </ThemeProvider>
  );
}
