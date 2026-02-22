// src/sna/sna456.ts
// Usamos a lib privada `sna-456` para criptografia contextualizada.
// A lib expõe `SNA456` com métodos `encrypt(plaintext, context)` e `decrypt(ciphertext, context)`.

import { SNA456 } from 'sna-456';

type Context = {
  userId: string;
  type: string;
  recordId?: string;
};

export type CipherPayload = {
  algorithm: string;
  data: string; // string retornada pela lib SNA-456
};

let snaInstance: SNA456 | null = null;

function getSna() {
  if (!snaInstance) {
    const key = process.env.SNA_MASTER_KEY || process.env.SNA_KEY || 'dev-sna-key';
    snaInstance = new SNA456(key);
  }
  return snaInstance;
}

export async function encryptContext(
  context: Context,
  payload: any,
): Promise<CipherPayload> {
  const sna = getSna();
  const plaintext = JSON.stringify(payload);
  const contextStr = `${context.userId}:${context.recordId ?? ''}`;
  const encrypted = await sna.encrypt(plaintext, contextStr);

  return {
    algorithm: 'SNA-456',
    data: typeof encrypted === 'string' ? encrypted : JSON.stringify(encrypted),
  };
}

export async function decryptContext(
  context: Context,
  cipher: CipherPayload,
): Promise<any> {
  const sna = getSna();
  const contextStr = `${context.userId}:${context.recordId ?? ''}`;

  // a lib pode devolver string - passamos direto
  const decrypted = await sna.decrypt(cipher.data, contextStr);

  // assume que o plaintext foi um JSON serializado
  try {
    return JSON.parse(decrypted as string);
  } catch {
    return decrypted;
  }
}
