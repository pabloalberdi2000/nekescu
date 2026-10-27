import axios from 'axios';
import type { TicketBaiProvider, TicketBaiInvoiceData, TicketBaiSignedInvoice } from './types';

export class KubiBAIProvider implements TicketBaiProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async signInvoice(data: TicketBaiInvoiceData): Promise<TicketBaiSignedInvoice> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/ticketbai/sign`,
        {
          invoice: data,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        currentHash: response.data.hash,
        signatureValue: response.data.signature,
        certificateSerial: response.data.certificateSerial,
        qrCodeData: response.data.qrData,
        qrCodeImageBase64: response.data.qrImage,
        xmlSignedBase64: response.data.xmlSigned,
      };
    } catch (error) {
      throw new Error(`KubiBAI signing failed: ${error}`);
    }
  }

  async submitToHacienda(xmlSigned: string): Promise<{ success: boolean; responseData?: any; error?: string }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/ticketbai/submit`,
        { xmlSigned },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: response.data.success,
        responseData: response.data.haciendaResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validateCertificate(certificatePath: string, password: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/certificate/validate`,
        { certificatePath, password },
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        }
      );

      return response.data.valid;
    } catch {
      return false;
    }
  }
}
