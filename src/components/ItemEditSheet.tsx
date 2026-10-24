import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { ModoPeso, Rates, TripItem } from '../types';
import type { NewItemInput } from '../state/AppDataContext';
import { calcularItem, resolverPesoArticulo } from '../lib/calculations';
import { fmtCUP, fmtEquivalenciaPeso, fmtKg, fmtMXN, fmtNum } from '../lib/format';
import { GANANCIA_KG_DEFAULT } from '../lib/defaults';
import { Modal, ConfirmDialog } from './Modal';
import { NumberField, TextField } from './fields';
import { PesoModeSwitch } from './PesoModeSwitch';

interface ItemEditSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Artículo a editar; si se omite, la hoja funciona en modo "agregar artículo nuevo". */
  initial?: TripItem;
  /** Tasas del viaje al que pertenece (o pertenecerá) el artículo, para la vista previa en vivo. */
  rates: Rates;
  onSave: (fields: NewItemInput) => void;
  onDelete?: () => void;
}

/**
 * Formulario de un artículo (nuevo o existente) con vista previa en vivo de
 * todos los montos calculados. Los cambios se guardan en el store recién al
 * tocar "Guardar", así que editar no dispara un re-render por cada tecla.
 */
export function ItemEditSheet({ open, onClose, title, initial, rates, onSave, onDelete }: ItemEditSheetProps) {
  const [producto, setProducto] = useState('');
  // `null` = todavía sin escribir (el campo muestra su placeholder). Al editar un
  // artículo existente siempre arrancan con su valor real, nunca en null.
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [articulosPorKg, setArticulosPorKg] = useState<number | null>(null);
  // Modo con que se indica el peso. Cada modo recuerda su propio valor al alternar el switch.
  const [modoPeso, setModoPeso] = useState<ModoPeso>('articulos');
  const [pesoArticuloKg, setPesoArticuloKg] = useState<number | null>(null);
  const [gananciaKgUSD, setGananciaKgUSD] = useState(GANANCIA_KG_DEFAULT);
  const [costoArticuloMXN, setCostoArticuloMXN] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Se reinicializa solo cuando la hoja se abre (o cambia a otro artículo),
  // nunca mientras el usuario está escribiendo.
  useEffect(() => {
    if (!open) return;
    setProducto(initial?.producto ?? '');
    setCantidad(initial?.cantidad ?? null);
    setArticulosPorKg(initial?.articulosPorKg ?? null);
    // Un artículo guardado con peso por unidad se reabre en ese mismo modo.
    setModoPeso(initial?.pesoArticuloKg !== undefined ? 'peso' : 'articulos');
    setPesoArticuloKg(initial?.pesoArticuloKg ?? null);
    setGananciaKgUSD(initial?.gananciaKgUSD ?? GANANCIA_KG_DEFAULT);
    setCostoArticuloMXN(initial?.costoArticuloMXN ?? null);
    setConfirmDelete(false);
  }, [open, initial]);

  const cantidadNum = cantidad ?? 0;
  const porPeso = modoPeso === 'peso';
  const peso = resolverPesoArticulo(modoPeso, articulosPorKg, pesoArticuloKg);
  const preview = calcularItem(
    { cantidad: cantidadNum, ...peso, gananciaKgUSD, costoArticuloMXN: costoArticuloMXN ?? 0 },
    rates,
  );
  const valido = producto.trim() !== '' && cantidadNum > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;
    onSave({
      producto: producto.trim(),
      cantidad: cantidadNum,
      ...peso,
      gananciaKgUSD,
      costoArticuloMXN: costoArticuloMXN ?? 0,
    });
    onClose();
  }

  return (
    <>
      <Modal
        open={open && !confirmDelete}
        onClose={onClose}
        title={title}
        footer={
          <>
            {onDelete && (
              <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
                Eliminar
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" form="item-edit-form" className="btn btn-primary" disabled={!valido}>
              Guardar
            </button>
          </>
        }
      >
        <form id="item-edit-form" className="stack" onSubmit={handleSubmit}>
          <TextField
            label="Producto"
            value={producto}
            onChange={setProducto}
            placeholder="Ej. Aretes"
            autoFocus
          />
          <NumberField
            label="Cantidad"
            value={cantidad}
            onChange={setCantidad}
            allowEmpty
            min={0.01}
            placeholder="Ej. 5"
          />
          <PesoModeSwitch value={modoPeso} onChange={setModoPeso} />
          {porPeso ? (
            <NumberField
              key="peso-articulo"
              label="Peso de un artículo"
              value={pesoArticuloKg}
              onChange={setPesoArticuloKg}
              allowEmpty
              min={0}
              suffix="kg"
              placeholder="Ej. 0.012"
              hint={fmtEquivalenciaPeso('peso', peso.articulosPorKg)}
            />
          ) : (
            <NumberField
              key="articulos-por-kg"
              label="Artículos por kilogramo"
              value={articulosPorKg}
              onChange={setArticulosPorKg}
              allowEmpty
              min={0}
              suffix="art/kg"
              placeholder="Ej. 84"
              hint={fmtEquivalenciaPeso('articulos', peso.articulosPorKg)}
            />
          )}
          <NumberField
            label="Ganancia por kg de envío"
            value={gananciaKgUSD}
            onChange={setGananciaKgUSD}
            min={0}
            suffix="USD"
          />
          <NumberField
            label="Costo del artículo"
            value={costoArticuloMXN}
            onChange={setCostoArticuloMXN}
            allowEmpty
            min={0}
            suffix="MXN"
            placeholder="Ej. 35"
          />

          <div className="preview-box">
            <div className="preview-row">
              <span>Costo total</span>
              <strong>{fmtMXN(preview.costoTotalMXN)}</strong>
            </div>
            <div className="preview-row">
              <span>Peso</span>
              <strong>{fmtKg(preview.pesoKg)}</strong>
            </div>
            <div className="preview-row">
              <span>Precio de venta (sin redondear)</span>
              <strong>{fmtCUP(preview.precioVentaArticuloCUP)}</strong>
            </div>
            <div className="preview-row highlight">
              <span>Precio en Cuba (redondeado)</span>
              <strong>{fmtCUP(preview.precioEnCubaCorregido)}</strong>
            </div>
            <div className="preview-row">
              <span>Precio total ({fmtNum(cantidadNum, 2)} uds.)</span>
              <strong>{fmtCUP(preview.precioTotalCUP)}</strong>
            </div>
          </div>
        </form>
      </Modal>

      {onDelete && (
        <ConfirmDialog
          open={confirmDelete}
          title="Eliminar artículo"
          message={`¿Eliminar "${initial?.producto ?? ''}" de este viaje? Esta acción no se puede deshacer.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            onDelete();
            onClose();
          }}
        />
      )}
    </>
  );
}
