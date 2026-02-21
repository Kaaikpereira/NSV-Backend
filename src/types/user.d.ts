// src/types/user.d.ts
import { ObjectId } from "mongodb";
import type { CipherPayload } from "../sna/sna456";

export type UserRole = "tester" | "admin";
export type UserStatus = "active" | "blocked" | "deleted";

export interface User {
  _id: ObjectId;
  supabase_user_id: string;

  // campos sensíveis cifrados pelo SNA
  email_cipher: CipherPayload | null;
  display_name_cipher: CipherPayload | null;

  role: UserRole;
  status: UserStatus;

  nsv_account_id: ObjectId | null;
  sna_subject_id: string | null;

  // avatar criptografado
  avatar_file_id?: string | null;     // id do arquivo .sna no storage
  avatar_mime_type?: string | null;   // ex: "image/png"

  created_at: Date;
  updated_at: Date;
}