import { useState } from 'react';
import { useAppData } from '../state/AppDataContext';
import { useTheme } from '../state/ThemeContext';
import { DEFAULT_SETTINGS } from '../lib/defaults';
import { NumberField } from '../components/fields';
import { ConfirmDialog } from '../components/Modal';
import { BackupSection } from '../components/BackupSection';
import { APP_VERSION } from '../lib/version';
import { IconMoon, IconSun } from '../components/icons';

export function Settings() {
  const { settings, updateSettings, trips, deleteTrip } = useAppData();
  const { theme, setTheme } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Configuración</h1>
        <p className="page-subtitle">Valores por defecto para la Calculadora y para los viajes nuevos.</p>
      </header>

      <div className="card">
        <h3>Apariencia</h3>
        <div className="theme-toggle" role="radiogroup" aria-label="Tema">
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'light'}
            className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <IconSun /> Claro
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={theme === 'dark'}
            className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <IconMoon /> Oscuro
          </button>
        </div>
      </div>

      <div className="card stack">
        <NumberField
          label="Tasa del peso mexicano"
          value={settings.tasaMXN}
          onChange={(v) => updateSettings({ tasaMXN: v })}
          min={0}
          suffix="MXN por 1 USD"
          id="tasa-mxn"
        />
        <NumberField
          label="Tasa del peso cubano"
          value={settings.tasaCUP}
          onChange={(v) => updateSettings({ tasaCUP: v })}
          min={0}
          suffix="CUP por 1 USD"
          id="tasa-cup"
        />
        <NumberField
          label="Precio de la remesa"
          value={settings.precioRemesa}
          onChange={(v) => updateSettings({ precioRemesa: v })}
          min={0}
          suffix="CUP por 1 MXN"
          // hint="Cuántos pesos cubanos equivalen a 1 peso mexicano al convertir de vuelta el dinero de las ventas (por ejemplo, mediante un servicio de remesas)."
          id="precio-remesa"
        />
      </div>

      <p className="hint">
        Estos valores se usan en la Calculadora y como punto de partida al crear un viaje nuevo. Los viajes que ya
        existen conservan sus propias tasas: puedes editarlas desde cada viaje si lo necesitas. Los cambios aquí se
        guardan automáticamente en este dispositivo.
      </p>

      <BackupSection />

      <div className="card danger-zone">
        <h3>Zona de peligro</h3>
        <p>
          Borra todos los viajes y artículos guardados, y restablece esta configuración a sus valores por defecto.
          Considera exportar una copia de seguridad antes.
        </p>
        <button type="button" className="btn btn-danger" onClick={() => setConfirmReset(true)}>
          Borrar todos los datos
        </button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Borrar todos los datos"
        message={`Se eliminarán ${trips.length} viaje${trips.length === 1 ? '' : 's'} guardado${trips.length === 1 ? '' : 's'} y la configuración volverá a sus valores por defecto. Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          trips.forEach((t) => deleteTrip(t.id));
          updateSettings(DEFAULT_SETTINGS);
          setConfirmReset(false);
        }}
      />

      <p className="hint app-version">Precio Cuba · versión {APP_VERSION}</p>
    </div>
  );
}
