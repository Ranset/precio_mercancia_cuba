import { describe, expect, it } from 'vitest';
import { calcularItem, calcularTotalesViaje } from './calculations';
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
