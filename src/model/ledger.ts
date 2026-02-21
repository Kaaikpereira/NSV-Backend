export interface LedgerEntry {
  id: string;

  fromAccountId: string | null; // null = emissão
  toAccountId: string | null;   // null = queima

  amount: number;
  currency: 'NSV';

  type: 'transfer' | 'deposit' | 'payment';

  metadata?: Record<string, any>;

  createdAt: Date;

  // 🔐 campo crítico
  cipher: {
    algorithm: 'SNA-456';
    data: string;
  };
}
