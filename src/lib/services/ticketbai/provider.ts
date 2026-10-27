import { KubiBAIProvider } from './kubibai';
import type { TicketBaiProvider } from './types';

export function createTicketBaiProvider(): TicketBaiProvider {
  const providerType = process.env.TICKETBAI_PROVIDER || 'kubibai';

  switch (providerType) {
    case 'kubibai':
      return new KubiBAIProvider(
        process.env.KUBIBAI_API_URL!,
        process.env.KUBIBAI_API_KEY!
      );

    // Futuro: implementación propia
    // case 'native':
    //   return new NativeTicketBaiProvider();

    default:
      throw new Error(`Unknown TicketBAI provider: ${providerType}`);
  }
}
