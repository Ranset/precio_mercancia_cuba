import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Trip } from '../types';
import { useAppData } from '../state/AppDataContext';
import { sugerirNombreViaje } from '../lib/defaults';
import { Modal } from './Modal';
import { NumberField, TextField } from './fields';

interface NewTripModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}

export function NewTripModal({ open, onClose, onCreated }: NewTripModalProps) {
  const { settings, createTrip } = useAppData();
  const [nombre, setNombre] = useState('');
  const [tasaMXN, setTasaMXN] = useState(settings.tasaMXN);
  const [tasaCUP, setTasaCUP] = useState(settings.tasaCUP);
  const [precioRemesa, setPrecioRemesa] = useState(settings.precioRemesa);

  useEffect(() => {
    if (!open) return;
    setNombre(sugerirNombreViaje());
    setTasaMXN(settings.tasaMXN);
    setTasaCUP(settings.tasaCUP);
    setPrecioRemesa(settings.precioRemesa);
  }, [open, settings]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trip = createTrip(nombre.trim() || sugerirNombreViaje(), { tasaMXN, tasaCUP, precioRemesa });
    onCreated(trip);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo viaje"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="new-trip-form" className="btn btn-primary">
            Crear viaje
          </button>
        </>
      }
    >
      <form id="new-trip-form" className="stack" onSubmit={handleSubmit}>
        <TextField label="Nombre del viaje" value={nombre} onChange={setNombre} placeholder={sugerirNombreViaje()} autoFocus />
        <p className="hint">
          Las tasas se copian de Configuración y quedan fijas para este viaje; puedes ajustarlas aquí antes de crear o
          después, desde el propio viaje.
        </p>
        <NumberField label="Tasa peso mexicano" value={tasaMXN} onChange={setTasaMXN} min={0} suffix="MXN/USD" />
        <NumberField label="Tasa peso cubano" value={tasaCUP} onChange={setTasaCUP} min={0} suffix="CUP/USD" />
        <NumberField label="Precio de la remesa" value={precioRemesa} onChange={setPrecioRemesa} min={0} suffix="CUP/MXN" />
      </form>
    </Modal>
  );
}
