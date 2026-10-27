export interface TaxCalculation {
  taxBase: number;
  vatAmount: number;
  irpfAmount: number;
  total: number;
}

export function calculateTax(
  subtotal: number,
  vatRate: number = 21,
  irpfRate: number = 0
): TaxCalculation {
  const taxBase = subtotal;
  const vatAmount = (taxBase * vatRate) / 100;
  const irpfAmount = (taxBase * irpfRate) / 100;
  const total = taxBase + vatAmount - irpfAmount;

  return {
    taxBase: parseFloat(taxBase.toFixed(2)),
    vatAmount: parseFloat(vatAmount.toFixed(2)),
    irpfAmount: parseFloat(irpfAmount.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

export const VAT_RATES = {
  GENERAL: 21,
  REDUCED: 10,
  SUPERREDUCED: 4,
  EXEMPT: 0,
};

export const IRPF_RATES = {
  PROFESSIONAL: 15,
  RENT: 19,
  NONE: 0,
};
