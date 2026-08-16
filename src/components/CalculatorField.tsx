import { useEffect, useRef, useState } from 'react';
import { evaluateExpression, looksLikeExpression } from '../lib/exprEval';
import { fmtNum } from '../lib/format';

interface CalculatorFieldProps {
  label: string;
  /** `null` = todavía sin escribir (el campo muestra su placeholder). */
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  placeholder?: string;
  hint?: string;
  id?: string;
}

const OPERATORS = ['+', '−', '×', '÷'] as const;

/**
 * Como un NumberField, pero además admite escribir una cuenta simple (ej.
 * "12*7") y la evalúa al vuelo, para no tener que salir de la app a calcular
 * algo y volver. Los botones de operador insertan el símbolo en la posición
 * del cursor sin quitarle el foco al campo (así el teclado no se cierra).
 * Al perder el foco, si lo escrito era una operación válida, se reemplaza
 * por su resultado ya calculado.
 */
export function CalculatorField({ label, value, onChange, suffix, placeholder, hint, id }: CalculatorFieldProps) {
  const toText = (v: number | null) => (v === null ? '' : String(v));

  const [text, setText] = useState(() => toText(value));
  const [focused, setFocused] = useState(false);
  const focusedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  useEffect(() => {
    if (!focusedRef.current) setText(toText(value));
  }, [value]);

  // Tras insertar un operador desde los botones, el cursor debe quedar justo
  // después de él (si no, React lo manda al final del texto).
  useEffect(() => {
    if (pendingCursor.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCursor.current, pendingCursor.current);
      pendingCursor.current = null;
    }
  }, [text]);

  const isExpression = looksLikeExpression(text);
  const evaluated = isExpression ? evaluateExpression(text) : null;

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === '') {
      onChange(null);
      return;
    }
    const result = evaluateExpression(raw);
    if (result !== null) onChange(result);
  }

  function insertOperator(op: string) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    pendingCursor.current = start + op.length;
    commit(text.slice(0, start) + op + text.slice(end));
    input?.focus();
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-with-suffix">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onFocus={() => {
            focusedRef.current = true;
            setFocused(true);
          }}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
          onBlur={() => {
            focusedRef.current = false;
            setFocused(false);
            const result = evaluateExpression(text);
            setText(result !== null ? String(result) : toText(value));
          }}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>

      {focused && (
        <div className="calc-ops">
          {OPERATORS.map((op) => (
            <button
              key={op}
              type="button"
              className="calc-op-btn"
              tabIndex={-1}
              aria-label={`Insertar ${op}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertOperator(op)}
            >
              {op}
            </button>
          ))}
        </div>
      )}

      {isExpression && evaluated !== null && (
        <p className="hint calc-result">= {fmtNum(evaluated, evaluated % 1 === 0 ? 0 : 2)}</p>
      )}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}
