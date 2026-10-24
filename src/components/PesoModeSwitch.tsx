import type { ModoPeso } from '../types';

const OPCIONES: Array<{ value: ModoPeso; label: string }> = [
  { value: 'articulos', label: 'Artículos por kg' },
  { value: 'peso', label: 'Peso por artículo' },
];

interface PesoModeSwitchProps {
  value: ModoPeso;
  onChange: (modo: ModoPeso) => void;
}

/**
 * Switch de dos opciones para elegir cómo se indica el peso de un artículo:
 * cuántos entran en un kilogramo, o cuánto pesa uno. Lo usan la Calculadora
 * y el formulario de artículos de un viaje.
 */
export function PesoModeSwitch({ value, onChange }: PesoModeSwitchProps) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Cómo indicar el peso del artículo">
      {OPCIONES.map((opcion) => {
        const activo = value === opcion.value;
        return (
          <button
            key={opcion.value}
            type="button"
            role="radio"
            aria-checked={activo}
            className={`segmented-btn ${activo ? 'active' : ''}`}
            onClick={() => onChange(opcion.value)}
          >
            {opcion.label}
          </button>
        );
      })}
    </div>
  );
}
