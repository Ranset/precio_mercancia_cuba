import { useState } from 'react';
import type { Trip } from '../types';
import { Modal } from './Modal';

interface ExportTripModalProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
}

type ExportKind = 'excel' | 'pdf';

/** Deja elegir formato y genera + guarda/comparte el archivo del viaje. */
export function ExportTripModal({ open, onClose, trip }: ExportTripModalProps) {
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(kind: ExportKind) {
    setBusy(kind);
    setError(null);
    try {
      // Import dinámico: jsPDF/xlsx (y sus dependencias) pesan varios cientos de KB,
      // así que solo se descargan/evalúan la primera vez que de verdad se exporta algo,
      // no en cada arranque de la app.
      if (kind === 'excel') {
        const { exportTripToExcel } = await import('../lib/export/exportExcel');
        await exportTripToExcel(trip);
      } else {
        const { exportTripToPdf } = await import('../lib/export/exportPdf');
        await exportTripToPdf(trip);
      }
      onClose();
    } catch (err) {
      console.error(`[export:${kind}]`, err);
      setError('No se pudo generar el archivo. Inténtalo de nuevo.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Exportar viaje">
      <div className="stack">
        <p className="hint">
          Se exportarán los {trip.items.length} artículo{trip.items.length === 1 ? '' : 's'} de "{trip.nombre}", con
          sus montos calculados y el resumen del viaje.
        </p>

        <div className="export-options">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy !== null}
            onClick={() => handleExport('excel')}
          >
            {busy === 'excel' ? 'Generando…' : 'Excel (.xlsx)'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy !== null}
            onClick={() => handleExport('pdf')}
          >
            {busy === 'pdf' ? 'Generando…' : 'PDF'}
          </button>
        </div>

        {error && <p className="hint text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
