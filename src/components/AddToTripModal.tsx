import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../state/AppDataContext';
import { sugerirNombreViaje } from '../lib/defaults';
import { fmtNum } from '../lib/format';
import { Modal } from './Modal';
import { NumberField, TextField } from './fields';

const NUEVO_VIAJE = '__nuevo__';

interface AddToTripModalProps {
  open: boolean;
  onClose: () => void;
  calculo: {
    articulosPorKg: number;
    /** Solo si en la Calculadora se indicó el peso por unidad (kg) en vez de art/kg; ver `TripItem.pesoArticuloKg`. */
    pesoArticuloKg?: number;
    gananciaKgUSD: number;
    costoArticuloMXN: number;
  };
}

interface SuccessInfo {
  tripId: string;
  tripNombre: string;
  producto: string;
  cantidad: number;
}

/** Flujo de "Agregar a viaje" desde la Calculadora: pide Cantidad, Producto y a qué viaje asignarlo. */
export function AddToTripModal({ open, onClose, calculo }: AddToTripModalProps) {
  const { settings, trips, createTrip, addItem } = useAppData();
  const navigate = useNavigate();

  const [view, setView] = useState<'form' | 'success'>('form');
  const [success, setSuccess] = useState<SuccessInfo | null>(null);

  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [selectedTripId, setSelectedTripId] = useState<string>(NUEVO_VIAJE);
  const [newTripName, setNewTripName] = useState('');

  useEffect(() => {
    if (!open) return;
    setView('form');
    setProducto('');
    setCantidad(1);
    setSelectedTripId(trips.length > 0 ? trips[0].id : NUEVO_VIAJE);
    setNewTripName(sugerirNombreViaje());
    // Solo al abrir: no queremos reiniciar el formulario mientras el usuario escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const tripSeleccionado = selectedTripId === NUEVO_VIAJE ? null : trips.find((t) => t.id === selectedTripId);
  const usaTasasPropias =
    tripSeleccionado &&
    (tripSeleccionado.tasaMXN !== settings.tasaMXN || tripSeleccionado.tasaCUP !== settings.tasaCUP);

  const valido = producto.trim() !== '' && cantidad > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;

    let tripId: string;
    let tripNombre: string;

    if (selectedTripId === NUEVO_VIAJE) {
      const trip = createTrip(newTripName.trim() || sugerirNombreViaje(), {
        tasaMXN: settings.tasaMXN,
        tasaCUP: settings.tasaCUP,
        precioRemesa: settings.precioRemesa,
      });
      tripId = trip.id;
      tripNombre = trip.nombre;
    } else {
      const trip = trips.find((t) => t.id === selectedTripId);
      if (!trip) return;
      tripId = trip.id;
      tripNombre = trip.nombre;
    }

    addItem(tripId, {
      producto: producto.trim(),
      cantidad,
      articulosPorKg: calculo.articulosPorKg,
      pesoArticuloKg: calculo.pesoArticuloKg,
      gananciaKgUSD: calculo.gananciaKgUSD,
      costoArticuloMXN: calculo.costoArticuloMXN,
    });

    setSuccess({ tripId, tripNombre, producto: producto.trim(), cantidad });
    setView('success');
    setProducto('');
    setCantidad(1);
  }

  if (view === 'success' && success) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Agregado al viaje"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setView('form')}>
              Agregar otro
            </button>
          </>
        }
      >
        <div className="success-panel">
          <p>
            <strong>
              {fmtNum(success.cantidad, success.cantidad % 1 === 0 ? 0 : 2)} × {success.producto}
            </strong>{' '}
            se agregó a <strong>{success.tripNombre}</strong>.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              onClose();
              navigate(`/viajes/${success.tripId}`);
            }}
          >
            Ver viaje
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar a viaje"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="add-to-trip-form" className="btn btn-primary" disabled={!valido}>
            Agregar
          </button>
        </>
      }
    >
      <form id="add-to-trip-form" className="stack" onSubmit={handleSubmit}>
        <TextField
          label="Producto"
          value={producto}
          onChange={setProducto}
          placeholder="Ej. Aretes"
          autoFocus
        />
        <NumberField label="Cantidad" value={cantidad} onChange={setCantidad} min={0.01} />

        <div className="field">
          <label htmlFor="viaje-select">Viaje</label>
          <select id="viaje-select" value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)}>
            <option value={NUEVO_VIAJE}>+ Crear nuevo viaje</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        {selectedTripId === NUEVO_VIAJE ? (
          <>
            <TextField label="Nombre del nuevo viaje" value={newTripName} onChange={setNewTripName} placeholder={sugerirNombreViaje()} />
            <p className="hint">
              Se creará con las tasas actuales de Configuración (1 USD = {fmtNum(settings.tasaMXN)} MXN · 1 USD ={' '}
              {fmtNum(settings.tasaCUP)} CUP).
            </p>
          </>
        ) : (
          usaTasasPropias &&
          tripSeleccionado && (
            <p className="hint">
              Este viaje usa sus propias tasas (1 USD = {fmtNum(tripSeleccionado.tasaMXN)} MXN · 1 USD ={' '}
              {fmtNum(tripSeleccionado.tasaCUP)} CUP): el precio final se recalculará con ellas, no con las de la
              calculadora.
            </p>
          )
        )}
      </form>
    </Modal>
  );
}
