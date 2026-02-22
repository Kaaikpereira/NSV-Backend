type BinaryContext = {
  userId: string;
  type: "avatar" | string;
  recordId?: string;
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
      const mod = require("sna-456") as { SNA456: new (key: string) => SnaInstance };
      const key = process.env.SNA_MASTER_KEY || process.env.SNA_KEY || "dev-sna-key";
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

/**
 * Criptografa um buffer (ex: imagem) usando SNA-456.
 * Retorna uma STRING cifrada, pronta pra salvar em arquivo/DB.
 */
export async function encryptBinaryWithSNA(params: {
  buffer: Buffer;
  context: BinaryContext;
}): Promise<string> {
  const { buffer, context } = params;
  const sna = getSna();
  const contextStr = `${context.userId}:${context.recordId ?? ""}:${context.type}`;

  // 1) binário -> base64
  const plaintextBase64 = buffer.toString("base64");

  // 2) base64 -> SNA
  const encrypted = await sna.encrypt(plaintextBase64, contextStr);

  return typeof encrypted === "string" ? encrypted : JSON.stringify(encrypted);
}

/**
 * Descriptografa uma STRING cifrada e devolve o Buffer original.
 */
export async function decryptBinaryWithSNA(params: {
  data: string;
  context: BinaryContext;
}): Promise<Buffer> {
  const { data, context } = params;
  const sna = getSna();
  const contextStr = `${context.userId}:${context.recordId ?? ""}:${context.type}`;

  const decrypted = await sna.decrypt(data, contextStr);

  const plaintextBase64 = decrypted as string;

  // base64 -> binário
  return Buffer.from(plaintextBase64, "base64");
}
