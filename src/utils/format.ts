export function formatCurrency(
  amount: number,
  currency: 'USD' | 'VES',
  locale: string = 'es-VE',
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return currency === 'USD' ? '$ --.--' : 'Bs. --.--';
  }
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function formatDate(
  date: string | Date,
  locale: string = 'es-VE',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return d.toLocaleDateString(locale, {
    ...defaultOptions,
    ...options,
  });
}

export function formatDateTime(
  date: string | Date,
  locale: string = 'es-VE',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || isNaN(rate)) return '—';
  return rate.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}