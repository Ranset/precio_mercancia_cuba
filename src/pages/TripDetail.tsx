import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../state/AppDataContext';
import type { TripItem } from '../types';
import { calcularItem, calcularTotalesViaje } from '../lib/calculations';
import { fmtCUP, fmtKg, fmtMXN, fmtNum, formatDate } from '../lib/format';
import { EmptyState } from '../components/EmptyState';
import { TripRatesEditor } from '../components/TripRatesEditor';
import { ItemEditSheet } from '../components/ItemEditSheet';
import { ExportTripModal } from '../components/ExportTripModal';
import { TrendValue } from '../components/TrendValue';
import { ConfirmDialog } from '../components/Modal';
import { IconArrowLeft, IconChevronDown, IconPlus, IconShare, IconTrash } from '../components/icons';

export function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, renameTrip, updateTripRates, deleteTrip, addItem, updateItem, deleteItem } = useAppData();
  const trip = id ? getTrip(id) : undefined;

  const [showRates, setShowRates] = useState(false);
  const [editingItem, setEditingItem] = useState<TripItem | 'new' | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [confirmDeleteTrip, setConfirmDeleteTrip] = useState(false);
  const [nombreDraft, setNombreDraft] = useState(trip?.nombre ?? '');

  useEffect(() => {
    setNombreDraft(trip?.nombre ?? '');
  }, [trip?.id, trip?.nombre]);

  if (!trip) {
    return (
      <div className="page">
        <p>Este viaje ya no existe.</p>
        <Link to="/viajes" className="back-link">
          <IconArrowLeft /> Volver a Viajes
        </Link>
      </div>
    );
  }

  const totales = calcularTotalesViaje(trip);
  const editingExisting = editingItem && editingItem !== 'new' ? editingItem : undefined;

  return (
    <div className="page">
      <Link to="/viajes" className="back-link">
        <IconArrowLeft /> Viajes
      </Link>

      <header className="trip-detail-header">
        <div className="trip-detail-header-top">
          <input
            className="trip-title-input"
            value={nombreDraft}
            onChange={(e) => setNombreDraft(e.target.value)}
            onBlur={() => {
              const nombre = nombreDraft.trim() || trip.nombre;
              setNombreDraft(nombre);
              if (nombre !== trip.nombre) renameTrip(trip.id, nombre);
            }}
            aria-label="Nombre del viaje"
          />
          <button type="button" className="icon-btn" aria-label="Exportar viaje" onClick={() => setShowExport(true)}>
            <IconShare />
          </button>
          <button
            type="button"
            className="icon-btn danger"
            aria-label="Eliminar viaje"
            onClick={() => setConfirmDeleteTrip(true)}
          >
            <IconTrash />
          </button>
        </div>
        <p className="page-subtitle">Creado el {formatDate(trip.createdAt)}</p>
      </header>

      <div className="card">
        <button type="button" className="collapsible-toggle" onClick={() => setShowRates((v) => !v)}>
          <span className="label-caps">Tasas de este viaje</span>
          <IconChevronDown className={showRates ? 'rotated' : undefined} />
        </button>
        {showRates && (
          <>
            <TripRatesEditor trip={trip} onChange={(patch) => updateTripRates(trip.id, patch)} />
            <p className="hint">
              Estas tasas son propias de este viaje: cambiarlas recalcula todos sus artículos, pero no afecta a otros
              viajes ni a Configuración.
            </p>
          </>
        )}
      </div>

      <div className="section-header">
        <h2 className="label-caps">Artículos ({trip.items.length})</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem('new')}>
          <IconPlus /> Agregar
        </button>
      </div>

      {trip.items.length === 0 ? (
        <EmptyState title="Sin artículos todavía" message="Agrega el primero con el botón de arriba." />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Art/Kg</th>
                <th>Peso (Kg)</th>
                <th>Ganancia Kg (USD)</th>
                <th>Costo (MXN)</th>
                <th>Costo Total (MXN)</th>
                <th>Venta (CUP)</th>
                <th>Precio Cuba (CUP)</th>
                <th>Total (CUP)</th>
              </tr>
            </thead>
            <tbody>
              {trip.items.map((item) => {
                const c = calcularItem(item, trip);
                return (
                  <tr key={item.id} onClick={() => setEditingItem(item)}>
                    <td className="cell-producto">{item.producto}</td>
                    <td>{fmtNum(item.cantidad, item.cantidad % 1 === 0 ? 0 : 2)}</td>
                    <td>{fmtNum(item.articulosPorKg, 0)}</td>
                    <td>{fmtNum(c.pesoKg, 2)}</td>
                    <td>{fmtNum(item.gananciaKgUSD)}</td>
                    <td>{fmtNum(item.costoArticuloMXN)}</td>
                    <td>{fmtNum(c.costoTotalMXN)}</td>
                    <td>{fmtNum(c.precioVentaArticuloCUP)}</td>
                    <td>{fmtNum(c.precioEnCubaCorregido)}</td>
                    <td>{fmtNum(c.precioTotalCUP)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="card summary-card">
        <div className="summary-row">
          <span>Inversión total</span>
          <strong>{fmtMXN(totales.inversionTotalMXN)}</strong>
        </div>
        <div className="summary-row">
          <span>Monto total del viaje</span>
          <strong>{fmtCUP(totales.montoTotalViajeCUP)}</strong>
        </div>
        <div className="summary-row">
          <span>Venta total convertida</span>
          <strong>{fmtMXN(totales.ventaTotalConvertidaMXN)}</strong>
        </div>
        <div className="summary-row">
          <span>Peso total</span>
          <strong>{fmtKg(totales.pesoTotalKg)}</strong>
        </div>
        <div className="summary-row summary-main">
          <span>Ganancia</span>
          <TrendValue value={totales.gananciaMXN} format={fmtMXN} size="lg" />
        </div>
      </div>

      <ItemEditSheet
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title={editingItem === 'new' ? 'Agregar artículo' : 'Editar artículo'}
        initial={editingExisting}
        rates={trip}
        onSave={(fields) => {
          if (editingItem === 'new') {
            addItem(trip.id, fields);
          } else if (editingExisting) {
            updateItem(trip.id, editingExisting.id, fields);
          }
        }}
        onDelete={editingExisting ? () => deleteItem(trip.id, editingExisting.id) : undefined}
      />

      <ExportTripModal open={showExport} onClose={() => setShowExport(false)} trip={trip} />

      <ConfirmDialog
        open={confirmDeleteTrip}
        title="Eliminar viaje"
        message={`¿Eliminar "${trip.nombre}" y todos sus artículos? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmDeleteTrip(false)}
        onConfirm={() => {
          setConfirmDeleteTrip(false);
          deleteTrip(trip.id);
          navigate('/viajes');
        }}
      />
    </div>
  );
}
