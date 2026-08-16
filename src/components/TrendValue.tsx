import { IconArrowDown, IconArrowUp } from './icons';

interface TrendValueProps {
  /** Monto con signo: positivo = ganancia, negativo = pérdida. */
  value: number;
  format: (n: number) => string;
  /** Por debajo de este valor absoluto se muestra en gris, sin flecha (por defecto, solo el cero exacto). */
  neutralThreshold?: number;
  size?: 'md' | 'lg';
}

/** Indicador financiero: flecha + signo + monto, en verde (ganancia) o rojo (pérdida). */
export function TrendValue({ value, format, neutralThreshold = 0, size = 'md' }: TrendValueProps) {
  const isNeutral = Math.abs(value) <= neutralThreshold;
  const isPositive = value > 0;
  const tone = isNeutral ? 'neutral' : isPositive ? 'positive' : 'negative';

  return (
    <span className={`trend trend-${size} ${tone}`}>
      {!isNeutral && (isPositive ? <IconArrowUp /> : <IconArrowDown />)}
      {!isNeutral && (isPositive ? '+' : '−')}
      {format(Math.abs(value))}
    </span>
  );
}
