import * as XLSX from 'xlsx';
import type { Trip } from '../../types';
import { formatDate, fmtNum } from '../format';
import { buildTripExportData } from './tripExportData';
import { safeFileBaseName, saveOrShareFile } from './saveOrShare';

const HEADERS = [
  'Producto',
  'Cantidad',
  'Artículos x Kg',
  'Peso (Kg)',
  'Ganancia Kg (USD)',
  'Costo (MXN)',
  'Costo Total (MXN)',
  'Precio Venta (CUP)',
  'Precio en Cuba (CUP)',
  'Precio Total (CUP)',
];

const MONEY_FORMAT = '#,##0.00';
const COLUMN_WIDTHS = [26, 10, 13, 11, 15, 11, 13, 13, 13, 13];

/** Genera el .xlsx de un viaje (artículos + resumen + tasas usadas) y lo guarda/comparte. */
export async function exportTripToExcel(trip: Trip): Promise<void> {
  const { rows, totales } = buildTripExportData(trip);

  const metaBlock: (string | number)[][] = [
    [trip.nombre],
    [`Creado el ${formatDate(trip.createdAt)}`],
    [
      `Tasa MXN: ${fmtNum(trip.tasaMXN)}    Tasa CUP: ${fmtNum(trip.tasaCUP)}    Precio de la remesa: ${fmtNum(trip.precioRemesa)}`,
    ],
    [],
  ];

  const dataRows: (string | number)[][] = rows.map((r) => [
    r.producto,
    r.cantidad,
    r.articulosPorKg,
    r.pesoKg,
    r.gananciaKgUSD,
    r.costoArticuloMXN,
    r.costoTotalMXN,
    r.precioVentaArticuloCUP,
    r.precioEnCubaCorregido,
    r.precioTotalCUP,
  ]);

  const totalsBlock: (string | number)[][] = [
    [],
    ['Inversión total (MXN)', totales.inversionTotalMXN],
    ['Monto total del viaje (CUP)', totales.montoTotalViajeCUP],
    ['Venta total convertida (MXN)', totales.ventaTotalConvertidaMXN],
    ['Peso total (kg)', totales.pesoTotalKg],
    ['Ganancia (MXN)', totales.gananciaMXN],
  ];

  const aoa: (string | number)[][] = [...metaBlock, HEADERS, ...dataRows, ...totalsBlock];

  const headerRowIndex = metaBlock.length;
  const dataStartRow = headerRowIndex + 1;
  const totalsStartRow = dataStartRow + dataRows.length + 1; // el primer elemento de totalsBlock es una fila en blanco

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = COLUMN_WIDTHS.map((wch) => ({ wch }));

  // Formato de 2 decimales para las columnas numéricas de la tabla de artículos.
  for (let r = 0; r < dataRows.length; r++) {
    for (let c = 1; c < HEADERS.length; c++) {
      applyMoneyFormat(ws, dataStartRow + r, c);
    }
  }
  // Formato de 2 decimales para los montos del resumen (columna B).
  for (let i = 0; i < 5; i++) {
    applyMoneyFormat(ws, totalsStartRow + i, 1);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Viaje');

  // `xlsx` tipa su salida de forma laxa (Uint8Array<ArrayBufferLike>); a nivel de
  // ejecución siempre es un ArrayBuffer normal, válido como BlobPart.
  const bytes = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  await saveOrShareFile(`${safeFileBaseName(trip.nombre)}.xlsx`, blob);
}

function applyMoneyFormat(ws: XLSX.WorkSheet, row: number, col: number): void {
  const ref = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[ref];
  if (cell && typeof cell.v === 'number') cell.z = MONEY_FORMAT;
}
