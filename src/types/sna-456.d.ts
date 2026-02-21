declare module "sna-456" {
  export type CipherPayload = any;

  export class SNA456 {
    constructor(key: string);

    encrypt(
      plaintext: string | Buffer,
      context: string
    ): Promise<string | Buffer> | string | Buffer;

    decrypt(
      ciphertext: string | Buffer,
      context: string
    ): Promise<string | Buffer> | string | Buffer;
  }

  export { SNA456 as default };
}