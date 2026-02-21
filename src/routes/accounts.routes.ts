// src/routes/accounts.routes.ts
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import {
  deleteAccountBySupabaseUserId,
  findAccountByDisplay,
} from "../model/account.model";
import { findUserByMongoId } from "../model/user.model";
import { decryptContext } from "../sna/sna456";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function accountsRoutes(app: FastifyInstance) {
  app.get(
    "/accounts/lookup",
    { preHandler: app.authGuard },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { account } = req.query as { account?: string };

      if (!account) {
        return reply.code(400).send({ error: "account is required" });
      }

      const acc = await findAccountByDisplay(account);
      if (!acc) {
        return reply.send({ account: null });
      }

      const owner = await findUserByMongoId(acc.user_id);

      let displayName = "Conta NSV";
      if (owner?.display_name_cipher) {
        const ctx = {
          userId: owner.supabase_user_id,
          type: "user",
        };
        const payload: any = await decryptContext(
          ctx,
          owner.display_name_cipher
        );
        displayName = payload.display_name ?? displayName;
      }

      return reply.send({
        account: {
          id: acc._id.toHexString(),
          number: acc.account_display_plain,
          display_name: displayName,
          avatar_url: (owner as any)?.avatar_url ?? null,
        },
      });
    }
  );

  // === NOVA ROTA: deletar conta do usuário autenticado ===
  app.delete(
    "/accounts/me",
    { preHandler: app.authGuard },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.userId) {
        return reply.code(401).send({ error: "Unauthorized" });
      }

      try {
        await deleteAccountBySupabaseUserId(req.userId);
        return reply.code(204).send();
      } catch (err) {
        req.log.error({ err }, "failed to delete account");
        return reply
          .code(500)
          .send({ error: "could not delete account" });
      }
    }
  );
}
