import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Trip } from '../../types';
import { fmtCUP, fmtKg, fmtMXN, fmtNum, formatDate } from '../format';
import { buildTripExportData } from './tripExportData';
import { safeFileBaseName, saveOrShareFile } from './saveOrShare';

const BRAND_RGB: [number, number, number] = [15, 118, 110];
const TEXT_RGB: [number, number, number] = [16, 22, 31];
const MUTED_RGB: [number, number, number] = [91, 100, 114];

/** jspdf-autotable adjunta esto al doc en tiempo de ejecución; el tipo de jsPDF no lo declara. */
interface DocWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

/** Genera el PDF de un viaje (encabezado + tabla de artículos + resumen) y lo guarda/comparte. */
export async function exportTripToPdf(trip: Trip): Promise<void> {
  const { rows, totales } = buildTripExportData(trip);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const marginX = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_RGB);
  doc.text(trip.nombre, marginX, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED_RGB);
  doc.text(
    `Creado el ${formatDate(trip.createdAt)}   ·   Tasa MXN: ${fmtNum(trip.tasaMXN)}   ·   Tasa CUP: ${fmtNum(trip.tasaCUP)}   ·   Precio de la remesa: ${fmtNum(trip.precioRemesa)}`,
    marginX,
    58,
  );

  autoTable(doc, {
    startY: 74,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'Producto',
        'Cant.',
        'Art/Kg',
        'Peso (Kg)',
        'Ganancia Kg (USD)',
        'Costo (MXN)',
        'Costo Total (MXN)',
        'Venta (CUP)',
        'Precio Cuba (CUP)',
        'Total (CUP)',
      ],
    ],
    body: rows.map((r) => [
      r.producto,
      fmtNum(r.cantidad, r.cantidad % 1 === 0 ? 0 : 2),
      fmtNum(r.articulosPorKg, 0),
      fmtNum(r.pesoKg, 2),
      fmtNum(r.gananciaKgUSD),
      fmtNum(r.costoArticuloMXN),
      fmtNum(r.costoTotalMXN),
      fmtNum(r.precioVentaArticuloCUP),
      fmtNum(r.precioEnCubaCorregido),
      fmtNum(r.precioTotalCUP),
    ]),
    styles: { fontSize: 8, cellPadding: 6, textColor: TEXT_RGB },
    headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    columnStyles: { 0: { halign: 'left' } },
    theme: 'striped',
  });

  const finalY = (doc as DocWithAutoTable).lastAutoTable?.finalY ?? 74;

  const summary: Array<[string, string]> = [
    ['Inversión total', fmtMXN(totales.inversionTotalMXN)],
    ['Monto total del viaje', fmtCUP(totales.montoTotalViajeCUP)],
    ['Venta total convertida', fmtMXN(totales.ventaTotalConvertidaMXN)],
    ['Peso total', fmtKg(totales.pesoTotalKg)],
    ['Ganancia', fmtMXN(totales.gananciaMXN)],
  ];

  let y = finalY + 26;
  for (const [label, value] of summary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...MUTED_RGB);
    doc.text(label, marginX, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_RGB);
    doc.text(value, marginX + 190, y);

    y += 18;
  }

  const blob = doc.output('blob');
  await saveOrShareFile(`${safeFileBaseName(trip.nombre)}.pdf`, blob);
}
