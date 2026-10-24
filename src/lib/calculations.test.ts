import { describe, expect, it } from 'vitest';
import { articulosPorKgDesdePesoKg, calcularItem, calcularTotalesViaje, resolverPesoArticulo } from './calculations';
import type { Trip, TripItem } from '../types';

// Tasas usadas en la hoja "Viaje abril 2026" del Excel original.
const rates = { tasaMXN: 17, tasaCUP: 680, precioRemesa: 40 };

describe('calcularItem (validado contra Mercancía Ale.xlsx)', () => {
  it('fila 3: Tintes — 110 uds, 10 art/kg, $9.25 USD/kg, costo $23.60 MXN', () => {
    const r = calcularItem({ cantidad: 110, costoArticuloMXN: 23.6, gananciaKgUSD: 9.25, articulosPorKg: 10 }, rates);
    expect(r.costoTotalMXN).toBeCloseTo(2596, 2);
    expect(r.precioVentaArticuloCUP).toBeCloseTo(1573, 0);
    expect(r.precioEnCubaCorregido).toBe(1580);
    expect(r.precioTotalCUP).toBe(173800);
    expect(r.pesoKg).toBeCloseTo(11, 5);
  });

  it('peso: 1 kg = 2 artículos, se agregan 3 → pesan 1.5 kg', () => {
    const r = calcularItem({ cantidad: 3, costoArticuloMXN: 10, gananciaKgUSD: 20, articulosPorKg: 2 }, rates);
    expect(r.pesoKg).toBe(1.5);
  });

  it('fila 4: Prednisona — 15 uds, 113 art/kg, $76 USD/kg, costo $6.73 MXN', () => {
    const r = calcularItem({ cantidad: 15, costoArticuloMXN: 6.73, gananciaKgUSD: 76, articulosPorKg: 113 }, rates);
    expect(r.precioVentaArticuloCUP).toBeCloseTo(726.545, 2);
    expect(r.precioEnCubaCorregido).toBe(730);
    expect(r.precioTotalCUP).toBe(10950);
  });

  it('fila 7: monederos — 10 uds, 6 art/kg, $20 USD/kg, costo $35 MXN', () => {
    const r = calcularItem({ cantidad: 10, costoArticuloMXN: 35, gananciaKgUSD: 20, articulosPorKg: 6 }, rates);
    expect(r.precioEnCubaCorregido).toBe(3670);
    expect(r.precioTotalCUP).toBe(36700);
  });

  it('devuelve 0 en vez de NaN/Infinity cuando faltan datos (articulosPorKg=0)', () => {
    const r = calcularItem({ cantidad: 5, costoArticuloMXN: 10, gananciaKgUSD: 20, articulosPorKg: 0 }, rates);
    expect(r.precioVentaArticuloCUP).toBe(0);
    expect(r.precioEnCubaCorregido).toBe(0);
    expect(r.precioTotalCUP).toBe(0);
    expect(r.pesoKg).toBe(0);
  });
});

describe('peso del artículo introducido directamente (pesoArticuloKg)', () => {
  it('da el mismo precio y peso que su equivalente en artículos por kg (0.1 kg = 10 art/kg)', () => {
    const base = { cantidad: 110, costoArticuloMXN: 23.6, gananciaKgUSD: 9.25 };
    const porArticulos = calcularItem({ ...base, articulosPorKg: 10 }, rates);
    const porPeso = calcularItem({ ...base, articulosPorKg: 10, pesoArticuloKg: 0.1 }, rates);
    expect(porPeso.precioEnCubaCorregido).toBe(porArticulos.precioEnCubaCorregido);
    expect(porPeso.precioTotalCUP).toBe(porArticulos.precioTotalCUP);
    expect(porPeso.pesoKg).toBe(11);
  });

  it('peso total: 3 unidades de 0.5 kg pesan 1.5 kg, y 3 de 0.1 kg pesan justo 0.3 (sin 0.30000000000000004)', () => {
    const base = { costoArticuloMXN: 10, gananciaKgUSD: 20, articulosPorKg: 2 };
    expect(calcularItem({ ...base, cantidad: 3, pesoArticuloKg: 0.5 }, rates).pesoKg).toBe(1.5);
    expect(calcularItem({ ...base, cantidad: 3, pesoArticuloKg: 0.1 }, rates).pesoKg).toBe(0.3);
  });

  it('manda el peso aunque articulosPorKg diga otra cosa (el valor guardado de art/kg es solo informativo)', () => {
    const r = calcularItem(
      { cantidad: 1, costoArticuloMXN: 0, gananciaKgUSD: 20, articulosPorKg: 9999, pesoArticuloKg: 0.025 },
      rates,
    );
    // 20 USD/kg * 0.025 kg * 680 CUP/USD = 340 CUP
    expect(r.precioVentaArticuloCUP).toBeCloseTo(340, 8);
    expect(r.precioEnCubaCorregido).toBe(340);
  });

  it('no sube 10 CUP por error de coma flotante cuando el precio exacto es múltiplo de 10', () => {
    const base = { cantidad: 1, costoArticuloMXN: 0 };
    // Exacto: 50 * 0.035 * 680 = 1190 CUP. Multiplicando el decimal tal cual (50 * 0.035) da 1190.0000000000002 → 1200.
    const a = calcularItem({ ...base, gananciaKgUSD: 50, articulosPorKg: 1 / 0.035, pesoArticuloKg: 0.035 }, rates);
    expect(a.precioEnCubaCorregido).toBe(1190);
    // Exacto: 250 * 0.061 * 680 = 10370 CUP. Pasando por 1/0.061 art/kg salía 10370.000000000002 → 10380.
    const b = calcularItem({ ...base, gananciaKgUSD: 250, articulosPorKg: 1 / 0.061, pesoArticuloKg: 0.061 }, rates);
    expect(b.precioEnCubaCorregido).toBe(10370);
  });

  it('un peso 0 o inválido se ignora y se usa articulosPorKg (si tampoco sirve, todo da 0)', () => {
    const conRespaldo = calcularItem(
      { cantidad: 5, costoArticuloMXN: 10, gananciaKgUSD: 20, articulosPorKg: 10, pesoArticuloKg: 0 },
      rates,
    );
    const sinPeso = calcularItem({ cantidad: 5, costoArticuloMXN: 10, gananciaKgUSD: 20, articulosPorKg: 10 }, rates);
    expect(conRespaldo).toEqual(sinPeso);

    const nada = calcularItem(
      { cantidad: 5, costoArticuloMXN: 10, gananciaKgUSD: 20, articulosPorKg: 0, pesoArticuloKg: -3 },
      rates,
    );
    expect(nada.precioEnCubaCorregido).toBe(0);
    expect(nada.pesoKg).toBe(0);
  });

  it('articulosPorKgDesdePesoKg convierte kg por unidad a art/kg (y 0 si el peso no sirve)', () => {
    expect(articulosPorKgDesdePesoKg(0.1)).toBe(10);
    expect(articulosPorKgDesdePesoKg(0.025)).toBe(40);
    expect(articulosPorKgDesdePesoKg(0.5)).toBe(2);
    expect(articulosPorKgDesdePesoKg(0)).toBe(0);
    expect(articulosPorKgDesdePesoKg(-5)).toBe(0);
    expect(articulosPorKgDesdePesoKg(NaN)).toBe(0);
  });

  it('resolverPesoArticulo: modo "articulos" conserva art/kg y borra el peso; modo "peso" deriva art/kg', () => {
    expect(resolverPesoArticulo('articulos', 84, 0.03)).toEqual({ articulosPorKg: 84, pesoArticuloKg: undefined });
    expect(resolverPesoArticulo('articulos', null, null)).toEqual({ articulosPorKg: 0, pesoArticuloKg: undefined });
    expect(resolverPesoArticulo('peso', 84, 0.1)).toEqual({ articulosPorKg: 10, pesoArticuloKg: 0.1 });
    expect(resolverPesoArticulo('peso', 84, null)).toEqual({ articulosPorKg: 0, pesoArticuloKg: undefined });
    expect(resolverPesoArticulo('peso', 84, 0)).toEqual({ articulosPorKg: 0, pesoArticuloKg: undefined });
    // La clave siempre existe: así editar un artículo pisa el valor anterior en vez de conservarlo.
    expect(resolverPesoArticulo('articulos', 84, null)).toHaveProperty('pesoArticuloKg');
  });
});

describe('calcularTotalesViaje (validado contra los totales F22/I22/I23/I24 del Excel)', () => {
  const filas: Array<Omit<TripItem, 'id'>> = [
    { producto: 'Tintes', cantidad: 110, articulosPorKg: 10, gananciaKgUSD: 9.25, costoArticuloMXN: 23.6 },
    { producto: 'Prednisona', cantidad: 15, articulosPorKg: 113, gananciaKgUSD: 76, costoArticuloMXN: 6.73 },
    { producto: 'Desodorantes', cantidad: 20, articulosPorKg: 84, gananciaKgUSD: 16, costoArticuloMXN: 35 },
    { producto: 'tamsulosinas', cantidad: 20, articulosPorKg: 113, gananciaKgUSD: 120, costoArticuloMXN: 35.68 },
    { producto: 'monederos', cantidad: 10, articulosPorKg: 6, gananciaKgUSD: 20, costoArticuloMXN: 35 },
    { producto: 'abanicos', cantidad: 12, articulosPorKg: 24, gananciaKgUSD: 24.5, costoArticuloMXN: 9 },
    { producto: 'anillos', cantidad: 13, articulosPorKg: 84, gananciaKgUSD: 134, costoArticuloMXN: 35 },
    { producto: 'esclavas', cantidad: 4, articulosPorKg: 84, gananciaKgUSD: 136, costoArticuloMXN: 60 },
    { producto: 'pulsos', cantidad: 11, articulosPorKg: 84, gananciaKgUSD: 205, costoArticuloMXN: 50 },
    { producto: 'pandora', cantidad: 1, articulosPorKg: 84, gananciaKgUSD: 115, costoArticuloMXN: 45 },
    { producto: 'pulsos', cantidad: 1, articulosPorKg: 84, gananciaKgUSD: 150, costoArticuloMXN: 35 },
    { producto: 'pulsos', cantidad: 3, articulosPorKg: 84, gananciaKgUSD: 227, costoArticuloMXN: 30 },
    { producto: 'pulsos', cantidad: 2, articulosPorKg: 84, gananciaKgUSD: 196, costoArticuloMXN: 39 },
    { producto: 'cadena', cantidad: 1, articulosPorKg: 84, gananciaKgUSD: 233, costoArticuloMXN: 35 },
    { producto: 'argollas', cantidad: 2, articulosPorKg: 84, gananciaKgUSD: 152, costoArticuloMXN: 38 },
    { producto: 'aretes', cantidad: 2, articulosPorKg: 84, gananciaKgUSD: 150, costoArticuloMXN: 35 },
    { producto: 'aretes', cantidad: 6, articulosPorKg: 84, gananciaKgUSD: 160, costoArticuloMXN: 30 },
    { producto: 'aretes', cantidad: 5, articulosPorKg: 84, gananciaKgUSD: 169, costoArticuloMXN: 25 },
    { producto: 'Cable (metros)', cantidad: 100, articulosPorKg: 15, gananciaKgUSD: 19.9, costoArticuloMXN: 23 },
  ];

  const trip: Trip = {
    id: 't1',
    nombre: 'Viaje abril 2026',
    createdAt: '2026-04-01T00:00:00.000Z',
    ...rates,
    items: filas.map((f, i) => ({ id: `item-${i}`, ...f })),
  };

  it('coincide con los totales del Excel (F22=8847.55, I22=639120, I23=15978, I24=7130.45)', () => {
    const t = calcularTotalesViaje(trip);
    expect(t.inversionTotalMXN).toBeCloseTo(8847.55, 2);
    expect(t.montoTotalViajeCUP).toBeCloseTo(639120, 0);
    expect(t.ventaTotalConvertidaMXN).toBeCloseTo(15978, 0);
    expect(t.gananciaMXN).toBeCloseTo(7130.45, 1);
    // Suma de Cantidad/ArtículosPorKg de las 19 filas (no viene del Excel, se calculó aparte).
    expect(t.pesoTotalKg).toBeCloseTo(20.9883, 4);
  });

  it('un viaje sin artículos da todos los totales en 0', () => {
    const vacio: Trip = { ...trip, items: [] };
    const t = calcularTotalesViaje(vacio);
    expect(t).toEqual({
      inversionTotalMXN: 0,
      montoTotalViajeCUP: 0,
      ventaTotalConvertidaMXN: 0,
      gananciaMXN: 0,
      pesoTotalKg: 0,
    });
  });
});
