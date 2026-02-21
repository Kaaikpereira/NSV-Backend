// src/plugins/auth-guard.ts
import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { supabaseAdmin } from "../infra/supabase/client";
import { findUserBySupabaseId } from "../model/user.model";
import { sessionsCollection, Session } from "../model/session.model";
import { decryptContext } from "../sna/sna456";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    userRole?: "dev" | "admin";
    supabaseUserId?: string;
  }

  interface FastifyInstance {
    authGuard: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authGuardPlugin(app: FastifyInstance) {
  app.decorate(
    "authGuard",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        reply
          .code(401)
          .send({ message: "Missing or invalid Authorization header" });
        return;
      }

      const token = authHeader.replace("Bearer ", "").trim();

      // 1) valida token no Supabase
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data?.user) {
        reply.code(401).send({ message: "Invalid or expired token" });
        return;
      }

      const supabaseUserId = data.user.id;

      // 2) verifica se existe sessão ativa com este token (via SNA)
      const col = await sessionsCollection();
      const sessions = (await col
        .find({
          supabase_user_id: supabaseUserId,
          revoked_at: { $exists: false },
        })
        .toArray()) as Session[];

      let activeSession: Session | null = null;

      for (const s of sessions) {
        if (!s.token_cipher) continue;

        const ctx = {
          userId: supabaseUserId,
          type: "session",
          recordId: s.user_id.toHexString(),
        };

        try {
          const payload: any = await decryptContext(ctx, s.token_cipher);
          if (payload.token === token) {
            activeSession = s;
            break;
          }
        } catch (err) {
          req.log.error({ err, sessionId: s._id }, "Failed to decrypt session token");
        }
      }

      if (!activeSession) {
        reply.code(401).send({ message: "Session revoked" });
        return;
      }

      // 3) carrega usuário interno e popula request
      const user = await findUserBySupabaseId(supabaseUserId);
      req.log.info({ supabaseUserId, userId: user?._id }, "AUTH GUARD USER");

      if (!user) {
        reply.code(401).send({ message: "User not found" });
        return;
      }

      req.userId = user._id.toHexString();
      req.userRole = user.role as "dev" | "admin";
      req.supabaseUserId = supabaseUserId;

      return;
    }
  );
}

export default fp(authGuardPlugin);