import { ObjectId } from "mongodb";
import { findUserBySupabaseId, updateUserById } from "../model/user.model";
import { encryptContext, decryptContext } from "../sna/sna456";
import type { User } from "../types/user";
import { mapUserForResponse } from "./auth.service"; // exporta essa função

export async function updateDisplayName(
  supabaseUserId: string,
  displayName: string
) {
  const userDoc = await findUserBySupabaseId(supabaseUserId);
  if (!userDoc) {
    throw new Error("Usuário não encontrado");
  }

  const context = { userId: supabaseUserId, type: "user" };

  const display_name_cipher = await encryptContext(context, {
    display_name: displayName,
  });

  await updateUserById(userDoc._id as ObjectId, {
    display_name_cipher,
    updated_at: new Date(),
  });

  // recarrega user
  const updatedUser = {
    ...userDoc,
    display_name_cipher,
  } as User;

  const user = await mapUserForResponse(updatedUser, supabaseUserId);

  return { user };
}
