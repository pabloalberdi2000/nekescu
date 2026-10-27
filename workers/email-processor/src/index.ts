import Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

async function processInvoiceEmails() {
  console.log('[Email Processor] Starting email check...');

  const config: EmailConfig = {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.EMAIL_HOST!,
    port: Number(process.env.EMAIL_PORT) || 993,
    tls: true,
  };

  const imap = new Imap(config);

  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        console.error('[Email Processor] Error opening inbox:', err);
        return;
      }

      // Buscar emails no leídos con "factura" en asunto o cuerpo
      imap.search(
        ['UNSEEN', ['OR', ['SUBJECT', 'factura'], ['BODY', 'factura']]],
        (err, results) => {
          if (err) {
            console.error('[Email Processor] Search error:', err);
            return;
          }

          if (!results || results.length === 0) {
            console.log('[Email Processor] No new invoices found');
            imap.end();
            return;
          }

          console.log(`[Email Processor] Found ${results.length} emails with invoices`);

          const fetch = imap.fetch(results, { bodies: '', markSeen: true });

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('[Email Processor] Parse error:', err);
                  return;
                }

                // Procesar adjuntos PDF
                const pdfAttachments = parsed.attachments.filter(
                  (att) => att.contentType === 'application/pdf'
                );

                console.log(
                  `[Email Processor] Email ${seqno}: ${pdfAttachments.length} PDF attachments`
                );

                for (const attachment of pdfAttachments) {
                  await processInvoicePDF(attachment.content, attachment.filename || 'invoice.pdf');
                }
              });
            });
          });

          fetch.once('end', () => {
            console.log('[Email Processor] Processing completed');
            imap.end();
          });
        }
      );
    });
  });

  imap.once('error', (err: Error) => {
    console.error('[Email Processor] IMAP Error:', err);
  });

  imap.once('end', () => {
    console.log('[Email Processor] Connection ended');
  });

  imap.connect();
}

async function processInvoicePDF(pdfBuffer: Buffer, filename: string) {
  try {
    const fileId = nanoid();
    const storagePath = `invoices/received/${fileId}.pdf`;

    console.log(`[Email Processor] Processing ${filename}...`);

    // 1. Upload a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Email Processor] Upload error:', uploadError);
      return;
    }

    // 2. Crear invoice pending en DB
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .insert({
        company_id: process.env.DEFAULT_COMPANY_ID!,
        type: 'received',
        status: 'pending',
        pdf_path: storagePath,
        issue_date: new Date().toISOString(),
        tax_base: 0,
        vat_amount: 0,
        total: 0,
        subtotal: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Email Processor] Database error:', dbError);
      return;
    }

    console.log(`[Email Processor] Invoice created: ${invoice.id} from ${filename}`);

    // 3. Trigger OCR processing (webhook o job queue)
    // TODO: Implementar webhook para procesamiento OCR
    // await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/invoice-ocr`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ invoiceId: invoice.id }),
    // });
  } catch (error) {
    console.error('[Email Processor] Error processing PDF:', error);
  }
}

// Ejecutar cada 15 minutos
const INTERVAL = 15 * 60 * 1000;

console.log('[Email Processor] Starting worker...');
console.log(`[Email Processor] Will check emails every ${INTERVAL / 1000 / 60} minutes`);

// Primera ejecución inmediata
processInvoiceEmails();

// Cron job
setInterval(processInvoiceEmails, INTERVAL);
