// src/controllers/users.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { updateDisplayName } from "../services/users.service";

interface AuthRequest extends FastifyRequest {
  userId?: string;
  supabaseUserId?: string;
}

export async function updateDisplayNameHandler(
  request: AuthRequest,
  reply: FastifyReply
) {
  const { displayName } = request.body as { displayName: string };

  if (!displayName || displayName.trim().length < 3) {
    return reply
      .status(400)
      .send({ error: "Nome deve ter pelo menos 3 caracteres" });
  }

  if (!request.supabaseUserId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  try {
    const result = await updateDisplayName(
      request.supabaseUserId,
      displayName.trim()
    );
    return reply.send(result); // { user: { ... } }
  } catch (err) {
    console.error("updateDisplayName error:", err);
    return reply.status(500).send({ error: "Erro ao atualizar nome" });
  }
}
