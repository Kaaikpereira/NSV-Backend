// src/routes/security.routes.ts
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { listSessionsForUser, revokeSession } from "../model/session.model";

export async function securityRoutes(app: FastifyInstance) {
  app.get(
    "/security/devices",
    { preHandler: app.authGuard },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.supabaseUserId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const sessions = await listSessionsForUser(req.supabaseUserId);

      return reply.send({
        devices: sessions.map((s) => ({
          id: s._id.toHexString(),
          device_id: s.device_id,
          device_name: s.device_name,
          user_agent: s.user_agent,
          ip: s.ip,
          created_at: s.created_at,
          last_seen_at: s.last_seen_at,
          is_current: false,
        })),
      });
    }
  );

  app.delete(
    "/security/devices/:id",
    { preHandler: app.authGuard },
    async (req: FastifyRequest, reply: FastifyReply) => {
      if (!req.supabaseUserId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { id } = req.params as { id: string };

      await revokeSession(id, req.supabaseUserId);

      return reply.code(204).send();
    }
  );
}
