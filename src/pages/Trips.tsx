import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../state/AppDataContext';
import { calcularTotalesViaje } from '../lib/calculations';
import { fmtCUP, fmtMXN, formatDate } from '../lib/format';
import { EmptyState } from '../components/EmptyState';
import { NewTripModal } from '../components/NewTripModal';
import { TrendValue } from '../components/TrendValue';
import { ConfirmDialog } from '../components/Modal';
import { IconChevronRight, IconPlus, IconTrash } from '../components/icons';

export function Trips() {
  const { trips, deleteTrip } = useAppData();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const tripToDelete = trips.find((t) => t.id === confirmDeleteId);

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>Viajes</h1>
          <p className="page-subtitle">Organiza tus compras por viaje.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
          <IconPlus /> Nuevo
        </button>
      </header>

      {trips.length === 0 ? (
        <EmptyState
          title="Aún no tienes viajes"
          message="Crea uno aquí, o agrega tu primer artículo desde la Calculadora y asígnalo a un viaje nuevo."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setShowNew(true)}>
              Crear viaje
            </button>
          }
        />
      ) : (
        <ul className="trip-list">
          {trips.map((trip) => {
            const totales = calcularTotalesViaje(trip);
            return (
              <li key={trip.id} className="trip-card" onClick={() => navigate(`/viajes/${trip.id}`)}>
                <div className="trip-card-main">
                  <h3>{trip.nombre}</h3>
                  <p className="trip-card-meta">
                    {formatDate(trip.createdAt)} · {trip.items.length} artículo{trip.items.length === 1 ? '' : 's'}
                  </p>
                  <div className="trip-card-totals">
                    <span>{fmtCUP(totales.montoTotalViajeCUP)}</span>
                    <span>
                      Ganancia <TrendValue value={totales.gananciaMXN} format={fmtMXN} />
                    </span>
                  </div>
                </div>
                <div className="trip-card-actions">
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Eliminar ${trip.nombre}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(trip.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                  <IconChevronRight />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <NewTripModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(trip) => {
          setShowNew(false);
          navigate(`/viajes/${trip.id}`);
        }}
      />

      <ConfirmDialog
        open={!!tripToDelete}
        title="Eliminar viaje"
        message={`¿Eliminar "${tripToDelete?.nombre ?? ''}" y todos sus artículos? Esta acción no se puede deshacer.`}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteTrip(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
