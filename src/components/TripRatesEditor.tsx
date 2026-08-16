import type { Rates, Trip } from '../types';
import { NumberField } from './fields';

interface TripRatesEditorProps {
  trip: Trip;
  onChange: (patch: Partial<Rates>) => void;
}

/** Edición de las 3 tasas propias de un viaje. Cada cambio recalcula el viaje al instante. */
export function TripRatesEditor({ trip, onChange }: TripRatesEditorProps) {
  return (
    <div className="rates-grid">
      <NumberField
        label="Tasa peso mexicano"
        value={trip.tasaMXN}
        onChange={(v) => onChange({ tasaMXN: v })}
        min={0}
        suffix="MXN/USD"
      />
      <NumberField
        label="Tasa peso cubano"
        value={trip.tasaCUP}
        onChange={(v) => onChange({ tasaCUP: v })}
        min={0}
        suffix="CUP/USD"
      />
      <NumberField
        label="Precio de la remesa"
        value={trip.precioRemesa}
        onChange={(v) => onChange({ precioRemesa: v })}
        min={0}
        suffix="CUP/MXN"
      />
    </div>
  );
}
