import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { invoices, ticketbaiRecords, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createTicketBaiProvider } from '@/lib/services/ticketbai/provider';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();

    const supabase = await createServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Obtener factura
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 2. Obtener config empresa
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, invoice.companyId));

    if (!company.ticketbaiEnabled) {
      return NextResponse.json(
        { error: 'TicketBAI not enabled for this company' },
        { status: 400 }
      );
    }

    // 3. Preparar datos para TicketBAI
    const ticketbaiData = {
      series: invoice.series || 'A',
      invoiceNumber: invoice.invoiceNumber || `${Date.now()}`,
      issueDate: invoice.issueDate,
      issuer: {
        nif: company.nif,
        name: company.name,
        address: company.address || '',
      },
      recipient: {
        nif: 'B12345678', // TODO: Obtener de contact
        name: 'Cliente',
      },
      lines: [
        {
          description: invoice.concept || 'Servicio',
          quantity: 1,
          unitPrice: Number(invoice.taxBase),
          total: Number(invoice.taxBase),
        },
      ],
      taxBase: Number(invoice.taxBase),
      vatRate: Number(invoice.vatRate),
      vatAmount: Number(invoice.vatAmount),
      irpfRate: Number(invoice.irpfRate),
      irpfAmount: Number(invoice.irpfAmount),
      total: Number(invoice.total),
      previousHash: company.ticketbaiLastHash || undefined,
    };

    // 4. Firmar con provider
    const provider = createTicketBaiProvider();
    const signed = await provider.signInvoice(ticketbaiData);

    // 5. Guardar en DB
    const [tbaiRecord] = await db
      .insert(ticketbaiRecords)
      .values({
        invoiceId: invoice.id,
        series: ticketbaiData.series,
        invoiceNumber: ticketbaiData.invoiceNumber,
        issueDate: ticketbaiData.issueDate,
        previousHash: ticketbaiData.previousHash || null,
        currentHash: signed.currentHash,
        signatureValue: signed.signatureValue,
        certificateSerial: signed.certificateSerial,
        qrCodeData: signed.qrCodeData,
        status: 'signed',
      })
      .returning();

    // 6. Actualizar last_hash empresa
    await db
      .update(companies)
      .set({ ticketbaiLastHash: signed.currentHash })
      .where(eq(companies.id, company.id));

    // 7. Upload QR y XML a Storage
    const qrBuffer = Buffer.from(signed.qrCodeImageBase64, 'base64');
    await supabase.storage
      .from('invoices')
      .upload(`ticketbai/${tbaiRecord.id}/qr.png`, qrBuffer, {
        contentType: 'image/png',
      });

    const xmlBuffer = Buffer.from(signed.xmlSignedBase64, 'base64');
    await supabase.storage
      .from('invoices')
      .upload(`ticketbai/${tbaiRecord.id}/signed.xml`, xmlBuffer, {
        contentType: 'application/xml',
      });

    return NextResponse.json({
      success: true,
      ticketbaiId: tbaiRecord.id,
      qrCodeData: signed.qrCodeData,
    });
  } catch (error: any) {
    console.error('TicketBAI error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
