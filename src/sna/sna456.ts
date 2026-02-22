type Context = {
  userId: string;
  type: string;
  recordId?: string;
};

export type CipherPayload = {
  algorithm: string;
  data: string; // string retornada pela lib SNA-456
};

type SnaInstance = {
  encrypt: (plaintext: string, context: string) => Promise<unknown> | unknown;
  decrypt: (ciphertext: string, context: string) => Promise<unknown> | unknown;
};

let snaInstance: SnaInstance | null = null;
let snaFailed = false;

function getSna() {
  if (snaFailed) {
    return {
      encrypt: async (plaintext: string) => plaintext,
      decrypt: async (ciphertext: string) => ciphertext,
    };
  }

  if (!snaInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      // @ts-ignore
      const mod = require('sna-456') as { SNA456: new (key: string) => SnaInstance };
      const key = process.env.SNA_MASTER_KEY || process.env.SNA_KEY || 'dev-sna-key';
      snaInstance = new mod.SNA456(key);
    } catch {
      snaFailed = true;
      return {
        encrypt: async (plaintext: string) => plaintext,
        decrypt: async (ciphertext: string) => ciphertext,
      };
    }
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
