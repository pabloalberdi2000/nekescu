export interface TicketBaiInvoiceData {
  series: string;
  invoiceNumber: string;
  issueDate: Date;

  issuer: {
    nif: string;
    name: string;
    address: string;
  };

  recipient: {
    nif: string;
    name: string;
    address?: string;
  };

  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];

  taxBase: number;
  vatRate: number;
  vatAmount: number;
  irpfRate: number;
  irpfAmount: number;
  total: number;

  previousHash?: string;
}

export interface TicketBaiSignedInvoice {
  currentHash: string;
  signatureValue: string;
  certificateSerial: string;
  qrCodeData: string;
  qrCodeImageBase64: string;
  xmlSignedBase64: string;
}

export interface TicketBaiProvider {
  /**
   * Firma una factura y genera el QR TicketBAI
   */
  signInvoice(data: TicketBaiInvoiceData): Promise<TicketBaiSignedInvoice>;

  /**
   * Envía factura firmada a Hacienda Foral
   */
  submitToHacienda(xmlSigned: string): Promise<{
    success: boolean;
    responseData?: any;
    error?: string;
  }>;

  /**
   * Valida certificado digital
   */
  validateCertificate(certificatePath: string, password: string): Promise<boolean>;
}
