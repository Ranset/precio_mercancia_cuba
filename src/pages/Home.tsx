import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../state/AppDataContext';
import { calcPrecioEnCubaCorregido, calcPrecioVentaArticuloCUP } from '../lib/calculations';
import { fmtCUP, fmtNum } from '../lib/format';
import {
  GANANCIA_KG_DEFAULT,
  GANANCIA_KG_MANUAL_MAX,
  GANANCIA_KG_MANUAL_MIN,
  GANANCIA_KG_SLIDER_MAX,
  GANANCIA_KG_SLIDER_MIN,
} from '../lib/defaults';
import { NumberField } from '../components/fields';
import { CalculatorField } from '../components/CalculatorField';
import { SliderWithInput } from '../components/SliderWithInput';
import { AddToTripModal } from '../components/AddToTripModal';

export function Home() {
  const { settings } = useAppData();

  // `null` = el usuario todavía no escribió nada (el campo muestra su placeholder).
  const [articulosPorKg, setArticulosPorKg] = useState<number | null>(null);
  const [gananciaKgUSD, setGananciaKgUSD] = useState(GANANCIA_KG_DEFAULT);
  const [costoArticuloMXN, setCostoArticuloMXN] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const listo = (articulosPorKg ?? 0) > 0 && (costoArticuloMXN ?? 0) > 0;
  const calculo = {
    articulosPorKg: articulosPorKg ?? 0,
    gananciaKgUSD,
    costoArticuloMXN: costoArticuloMXN ?? 0,
  };
  const precioVenta = calcPrecioVentaArticuloCUP(calculo, settings);
  const precioCuba = calcPrecioEnCubaCorregido(precioVenta);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Calculadora</h1>
        {/* <p className="page-subtitle">Precio de venta en Cuba de un artículo comprado en México.</p> */}
      </header>

      <div className="card rates-note">
        <span>
          Tasas actuales: 1 USD = {fmtNum(settings.tasaMXN)} MXN · 1 USD = {fmtNum(settings.tasaCUP)} CUP
        </span>
        <Link to="/configuracion">Editar</Link>
      </div>

      <div className="card stack">
        <div className="field-row">
          <CalculatorField
            label="Artículos por kilogramo"
            value={articulosPorKg}
            onChange={setArticulosPorKg}
            suffix="art/kg"
            placeholder="Ej. 84"
            id="articulos-por-kg"
          />

          <NumberField
            label="Costo del artículo"
            value={costoArticuloMXN}
            onChange={setCostoArticuloMXN}
            allowEmpty
            min={0}
            suffix="MXN"
            placeholder="Ej. 35"
            id="costo-articulo"
          />
        </div>

        <SliderWithInput
          label="Ganancia por kg de envío"
          value={gananciaKgUSD}
          onChange={setGananciaKgUSD}
          sliderMin={GANANCIA_KG_SLIDER_MIN}
          sliderMax={GANANCIA_KG_SLIDER_MAX}
          manualMin={GANANCIA_KG_MANUAL_MIN}
          manualMax={GANANCIA_KG_MANUAL_MAX}
        />
      </div>

      <div className="card result-card">
        {listo ? (
          <>
            <div className="result-row">
              <span>Precio de venta (sin redondear)</span>
              <strong>{fmtCUP(precioVenta)}</strong>
            </div>
            <div className="result-row result-main">
              <span>Precio en Cuba</span>
              <strong>{fmtCUP(precioCuba)}</strong>
            </div>
          </>
        ) : (
          <p className="hint">Completa artículos por kilogramo y el costo del artículo para ver el precio.</p>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        disabled={!listo}
        onClick={() => setShowAddModal(true)}
      >
        Agregar a viaje
      </button>

      <AddToTripModal open={showAddModal} onClose={() => setShowAddModal(false)} calculo={calculo} />
    </div>
  );
}
