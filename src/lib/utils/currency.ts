export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

export function parseCurrency(formatted: string): number {
  return parseFloat(formatted.replace(/[^0-9,-]/g, '').replace(',', '.'));
}
