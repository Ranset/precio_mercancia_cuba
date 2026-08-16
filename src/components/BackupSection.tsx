import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAppData } from '../state/AppDataContext';
import type { ParsedBackup } from '../lib/backup';
import { buildBackup, parseBackup } from '../lib/backup';
import { formatDate } from '../lib/format';
import { ConfirmDialog } from './Modal';

function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Exportar todos los datos a un archivo .json y restaurarlos desde uno. */
export function BackupSection() {
  const { settings, trips, restoreAllData } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      // Import dinámico: reutiliza el mismo guardado/compartido multiplataforma
      // que ya usa la exportación de un viaje (web: descarga; Android: Share).
      const { saveOrShareFile } = await import('../lib/export/saveOrShare');
      const backup = buildBackup(settings, trips);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      await saveOrShareFile(`precio-cuba-copia-de-seguridad-${todayStamp()}.json`, blob);
    } catch (err) {
      console.error('[backup:export]', err);
      setExportError('No se pudo generar el archivo. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  }

  function handlePickFile() {
    setRestoreError(null);
    setRestored(false);
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // para poder elegir el mismo archivo otra vez si hace falta
    if (!file) return;

    setRestoreError(null);
    setRestored(false);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        setPendingRestore(parseBackup(String(reader.result ?? '')));
      } catch (err) {
        setRestoreError(err instanceof Error ? err.message : 'El archivo no es una copia de seguridad válida.');
      }
    };
    reader.onerror = () => setRestoreError('No se pudo leer el archivo.');
    reader.readAsText(file);
  }

  function confirmRestore() {
    if (!pendingRestore) return;
    restoreAllData(pendingRestore);
    setPendingRestore(null);
    setRestored(true);
  }

  const restoreMessage = pendingRestore
    ? [
        `El archivo tiene ${pendingRestore.trips.length} viaje${pendingRestore.trips.length === 1 ? '' : 's'}` +
          (pendingRestore.exportedAt ? ` y se exportó el ${formatDate(pendingRestore.exportedAt)}` : '') +
          '.',
        'Esto reemplazará todos los viajes y la configuración actuales; lo que tengas guardado ahora se perderá. Esta acción no se puede deshacer.',
      ].join(' ')
    : '';

  return (
    <div className="card stack">
      <div>
        <h3>Copia de seguridad</h3>
        <p className="hint">
          Exporta todos tus viajes y tu configuración a un archivo, para guardarlo o pasarlo a otro dispositivo.
          Restaurar un archivo reemplaza todos los datos actuales de la app.
        </p>
      </div>

      <button type="button" className="btn btn-secondary" disabled={exporting} onClick={handleExport}>
        {exporting ? 'Generando…' : 'Exportar todos los datos'}
      </button>
      {exportError && <p className="hint text-danger">{exportError}</p>}

      <button type="button" className="btn btn-secondary" onClick={handlePickFile}>
        Restaurar desde archivo
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        onChange={handleFileSelected}
      />
      {restoreError && <p className="hint text-danger">{restoreError}</p>}
      {restored && <p className="hint text-success">Datos restaurados correctamente.</p>}

      <ConfirmDialog
        open={pendingRestore !== null}
        title="Restaurar copia de seguridad"
        message={restoreMessage}
        confirmLabel="Restaurar"
        onCancel={() => setPendingRestore(null)}
        onConfirm={confirmRestore}
      />
    </div>
  );
}
