import { type Sale } from '@/types';

export function exportSalesToCSV(sales: Sale[]): string {
  const headers = [
    'ID',
    'Fecha',
    'Cliente',
    'Total USD',
    'Total VES',
    'Tasa de Cambio',
    'Método de Pago',
    'Notas',
  ];

  const rows = sales.map((sale) => [
    sale.id,
    sale.createdAt,
    sale.clientName || '',
    sale.totalUSD.toString(),
    sale.totalVES.toString(),
    sale.exchangeRate.toString(),
    sale.paymentMethod,
    sale.notes || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`))
    .join('\n');

  return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
}

export function downloadCSV(csvContent: string, filename: string): void {
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}