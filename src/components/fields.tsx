import { useEffect, useRef, useState } from 'react';

interface NumberFieldBaseProps {
  label: string;
  min?: number;
  max?: number;
  step?: number | 'any';
  suffix?: string;
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
  id?: string;
}

/**
 * Con `allowEmpty`, el campo admite estar vacío (valor `null`) y entonces muestra
 * el placeholder — útil para campos que empiezan sin dato, donde mostrar "0" sería
 * un número falso que el usuario tiene que borrar antes de escribir.
 */
type NumberFieldProps = NumberFieldBaseProps &
  (
    | { allowEmpty: true; value: number | null; onChange: (value: number | null) => void }
    | { allowEmpty?: false; value: number; onChange: (value: number) => void }
  );

/**
 * Input numérico controlado que mantiene un buffer de texto local, para que
 * el usuario pueda borrar/escribir libremente sin que el valor formateado del
 * store le "pelee" la edición. Al perder el foco, si quedó vacío o inválido,
 * vuelve a mostrar el último valor válido (o queda vacío si `allowEmpty`).
 */
export function NumberField({
  label,
  value,
  onChange,
  allowEmpty,
  min,
  max,
  step = 'any',
  suffix,
  placeholder,
  hint,
  autoFocus,
  id,
}: NumberFieldProps) {
  // Internamente siempre se trabaja con `number | null`; la unión discriminada de
  // arriba es la que garantiza a quien lo usa que solo recibirá `null` si lo pidió.
  const emit = onChange as (value: number | null) => void;
  const toText = (v: number | null) => (v === null ? '' : String(v));

  const [text, setText] = useState(() => toText(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(toText(value));
  }, [value]);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-with-suffix">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          value={text}
          onFocus={() => {
            focused.current = true;
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);

            if (raw.trim() === '') {
              if (allowEmpty) emit(null);
              return;
            }
            const n = Number(raw);
            if (!Number.isNaN(n)) emit(n);
          }}
          onBlur={() => {
            focused.current = false;
            const n = Number(text);
            if (text.trim() === '') {
              // Si admite vacío, se queda vacío (con el placeholder a la vista).
              if (!allowEmpty) setText(toText(value));
            } else if (Number.isNaN(n)) {
              setText(toText(value));
            }
          }}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  id?: string;
}

export function TextField({ label, value, onChange, placeholder, autoFocus, id }: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
