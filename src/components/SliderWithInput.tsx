import { useEffect, useRef, useState } from 'react';

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  sliderMin: number;
  sliderMax: number;
  manualMin: number;
  manualMax: number;
  step?: number;
  suffix?: string;
  hint?: string;
}

/**
 * Control deslizable con rango "cómodo" (sliderMin..sliderMax) y, debajo, una
 * entrada manual con un rango más amplio (manualMin..manualMax). Si el valor
 * manual queda fuera del rango del slider, el control se muestra en su tope
 * más cercano pero el valor real usado para calcular es el manual.
 */
export function SliderWithInput({
  label,
  value,
  onChange,
  sliderMin,
  sliderMax,
  manualMin,
  manualMax,
  step = 1,
  suffix = 'USD',
  hint,
}: SliderWithInputProps) {
  const clampedForSlider = Math.min(Math.max(value, sliderMin), sliderMax);
  const [manualText, setManualText] = useState(() => String(value));
  const focused = useRef(false);
  const outOfRange = value < sliderMin || value > sliderMax;

  useEffect(() => {
    if (!focused.current) setManualText(String(value));
  }, [value]);

  return (
    <div className="field slider-field">
      <label>{label}</label>

      <input
        type="range"
        className="slider-input"
        min={sliderMin}
        max={sliderMax}
        step={step}
        value={clampedForSlider}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} (control deslizable, de ${sliderMin} a ${sliderMax} USD)`}
      />
      <div className="slider-scale">
        <span>${sliderMin}</span>
        <span>${sliderMax}</span>
      </div>

      <div className="manual-entry">
        <span className="manual-entry-prefix">$</span>
        <input
          type="number"
          inputMode="decimal"
          min={manualMin}
          max={manualMax}
          step="0.01"
          value={manualText}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setManualText(raw);
            const n = Number(raw);
            if (raw.trim() !== '' && !Number.isNaN(n)) {
              onChange(Math.min(Math.max(n, manualMin), manualMax));
            }
          }}
          onBlur={() => {
            focused.current = false;
            const n = Number(manualText);
            if (manualText.trim() === '' || Number.isNaN(n)) setManualText(String(value));
          }}
          aria-label={`${label} (entrada manual, de ${manualMin} a ${manualMax} USD)`}
        />
        <span className="manual-entry-suffix">{suffix}</span>
      </div>

      {outOfRange && (
        <p className="hint">
          {/* Fuera del rango del control ({sliderMin}–{sliderMax}); se está usando el valor manual. */}
        </p>
      )}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
