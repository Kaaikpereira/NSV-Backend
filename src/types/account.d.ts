import { ObjectId } from "mongodb";
import type { CipherPayload } from "../sna/sna456";

export type AccountStatus = "active" | "blocked" | "closed";

export interface Account {
  _id: ObjectId;
  user_id: ObjectId;

  balance_cipher: CipherPayload;
  currency: "NSV";
  account_number_cipher: CipherPayload;
  account_digit_cipher: CipherPayload;
  account_display_cipher: CipherPayload;
  account_display_plain: string;
  status: AccountStatus;
  created_at: Date;
  updated_at: Date;
}
