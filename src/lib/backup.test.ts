import { describe, expect, it } from 'vitest';
import { buildBackup, parseBackup } from './backup';
import type { Trip } from '../types';

const settings = { tasaMXN: 17, tasaCUP: 680, precioRemesa: 40 };

function tripConItem(item: Record<string, unknown>): Trip {
  return {
    id: 't1',
    nombre: 'Viaje de prueba',
    createdAt: '2026-04-01T00:00:00.000Z',
    ...settings,
    items: [
      { id: 'i1', producto: 'Aretes', cantidad: 5, articulosPorKg: 84, gananciaKgUSD: 20, costoArticuloMXN: 35, ...item },
    ],
  };
}

describe('copia de seguridad: peso por artículo (pesoArticuloKg)', () => {
  it('conserva pesoArticuloKg al exportar y restaurar (si no, se perdería en silencio)', () => {
    const trip = tripConItem({ articulosPorKg: 1 / 0.012, pesoArticuloKg: 0.012 });
    const restaurado = parseBackup(JSON.stringify(buildBackup(settings, [trip])));
    expect(restaurado.trips[0].items[0].pesoArticuloKg).toBe(0.012);
  });

  it('un artículo sin pesoArticuloKg se restaura sin esa clave', () => {
    const restaurado = parseBackup(JSON.stringify(buildBackup(settings, [tripConItem({})])));
    expect(restaurado.trips[0].items[0]).not.toHaveProperty('pesoArticuloKg');
  });

  it('acepta null como "sin peso" (lo mismo que un JSON editado a mano)', () => {
    const restaurado = parseBackup(JSON.stringify(buildBackup(settings, [tripConItem({ pesoArticuloKg: null })])));
    expect(restaurado.trips[0].items[0]).not.toHaveProperty('pesoArticuloKg');
  });

  it.each([0, -5, 'doce'])('rechaza un pesoArticuloKg inválido (%s) con un mensaje concreto', (malo) => {
    const texto = JSON.stringify(buildBackup(settings, [tripConItem({ pesoArticuloKg: malo })]));
    expect(() => parseBackup(texto)).toThrow(/peso por unidad inválido/);
  });
});
