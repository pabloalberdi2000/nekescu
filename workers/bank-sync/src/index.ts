import NordigenClient from 'nordigen-node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const nordigen = new NordigenClient({
  secretId: process.env.GOCARDLESS_SECRET_ID!,
  secretKey: process.env.GOCARDLESS_SECRET_KEY!,
});

async function syncBankAccounts() {
  console.log('[Bank Sync] Starting bank synchronization...');

  try {
    // 1. Obtener cuentas registradas en DB
    const { data: accounts, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .not('account_id', 'is', null);

    if (error) {
      console.error('[Bank Sync] Error fetching accounts:', error);
      return;
    }

    if (!accounts || accounts.length === 0) {
      console.log('[Bank Sync] No bank accounts configured');
      return;
    }

    console.log(`[Bank Sync] Found ${accounts.length} accounts to sync`);

    for (const account of accounts) {
      await syncAccountTransactions(account);
    }

    console.log('[Bank Sync] Synchronization completed');
  } catch (error) {
    console.error('[Bank Sync] Error:', error);
  }
}

async function syncAccountTransactions(account: any) {
  console.log(`[Bank Sync] Syncing account: ${account.name} (${account.iban})`);

  try {
    const accountClient = nordigen.account(account.account_id);

    // Obtener transacciones de últimos 90 días
    const { transactions } = await accountClient.getTransactions();

    if (!transactions || !transactions.booked) {
      console.log(`[Bank Sync] No transactions found for ${account.name}`);
      return;
    }

    let newTransactions = 0;

    for (const tx of transactions.booked) {
      // Verificar si ya existe (por external_id)
      const { data: existing } = await supabase
        .from('bank_transactions')
        .select('id')
        .eq('external_id', tx.transactionId)
        .single();

      if (existing) {
        continue; // Skip si ya existe
      }

      // Insertar nueva transacción
      const { error } = await supabase.from('bank_transactions').insert({
        account_id: account.id,
        external_id: tx.transactionId,
        transaction_date: tx.bookingDate,
        value_date: tx.valueDate,
        type: parseFloat(tx.transactionAmount.amount) > 0 ? 'credit' : 'debit',
        amount: Math.abs(parseFloat(tx.transactionAmount.amount)),
        currency: tx.transactionAmount.currency,
        description: tx.remittanceInformationUnstructured,
        counterparty_name: tx.debtorName || tx.creditorName,
        counterparty_iban: tx.debtorAccount?.iban || tx.creditorAccount?.iban,
        reference: tx.bankTransactionCode,
        raw_data: tx,
      });

      if (error) {
        console.error(`[Bank Sync] Error inserting transaction:`, error);
      } else {
        newTransactions++;
      }
    }

    // Actualizar last_sync_at
    await supabase
      .from('bank_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', account.id);

    console.log(
      `[Bank Sync] Account ${account.name}: ${newTransactions} new transactions`
    );
  } catch (error) {
    console.error(`[Bank Sync] Error syncing account ${account.id}:`, error);
  }
}

// Ejecutar cada hora
const INTERVAL = 60 * 60 * 1000;

console.log('[Bank Sync] Starting worker...');
console.log(`[Bank Sync] Will sync every ${INTERVAL / 1000 / 60} minutes`);

// Primera ejecución inmediata
syncBankAccounts();

// Cron job
setInterval(syncBankAccounts, INTERVAL);
