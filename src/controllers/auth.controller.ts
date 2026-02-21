// src/controllers/auth.controller.ts

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getOrCreateUserWithAccount } from "../services/auth.service";
import { supabaseAdmin } from "../infra/supabase/client";
import { writeAuditLog } from "../model/audit.model";
import { findUserBySupabaseId } from "../model/user.model";
import { createOrUpdateSession } from "../model/session.model";

// ✅ Função 1 - ME
export async function meHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const result = await getOrCreateUserWithAccount(data.user);
  return reply.send(result);
}

// ✅ Função 2 - LOGIN
export async function loginHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { email, password, deviceId } = request.body as {
    email: string;
    password: string;
    deviceId?: string;
  };

  if (!email || !password) {
    return reply.status(400).send({ error: "missing_credentials" });
  }

  const { data, error } =
    await supabaseAdmin.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

  // ❌ LOGIN FALHO
  if (error || !data?.user || !data?.session) {
    await writeAuditLog({
      actorUserId: "anonymous",
      action: "LOGIN_FAILED",
      entity: "user",
      entityId: email,
      metadata: {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      },
      createdAt: new Date(),
    });

    return reply.status(401).send({ error: "invalid_credentials" });
  }

  // ✅ LOGIN OK - audit log
  await writeAuditLog({
    actorUserId: data.user.id,
    action: "USER_LOGIN",
    entity: "user",
    entityId: data.user.id,
    metadata: {
      provider: "supabase",
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    },
    createdAt: new Date(),
  });

  // ✅ LOGIN OK - criar/atualizar sessão de dispositivo
  const dbUser = await findUserBySupabaseId(data.user.id);
  if (dbUser && deviceId) {
    const userAgent =
      (request.headers["user-agent"] as string) || "Desconhecido";
    const ip =
      (request.headers["x-forwarded-for"] as string) ||
      (request.ip as string) ||
      null;

      const acessToken = data.session.access_token;

    await createOrUpdateSession({
      userId: dbUser._id,
      supabaseUserId: data.user.id,
      deviceId,
      deviceName: "Navegador Web",
      userAgent,
      token: acessToken,
      ip,
    });
  }

  const result = await getOrCreateUserWithAccount(data.user);

  return reply.send({
    token: data.session.access_token,
    user: result.user,
    account: result.account,
  });
}

// ✅ Função 3 - REGISTER (NOVA)
export async function registerHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { email, password, displayName } = request.body as { 
    email: string; 
    password: string;
    displayName?: string;
  };

  if (!email || !password) {
    return reply.status(400).send({ 
      error: "Email e senha são obrigatórios" 
    });
  }

  if (password.length < 6) {
    return reply.status(400).send({ 
      error: "Senha deve ter no mínimo 6 caracteres" 
    });
  }

  try {
    const { data: authData, error: authError } = 
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: displayName || email.trim(),
        },
      });

    if (authError || !authData?.user) {
      return reply.status(400).send({ 
        error: authError?.message || "Erro ao criar conta" 
      });
    }

    const result = await getOrCreateUserWithAccount(authData.user);

    const { data: signInData, error: signInError } = 
  await supabaseAdmin.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

if (signInError || !signInData?.session) {
  return reply.status(500).send({ 
    error: signInError?.message || "Erro ao gerar token de acesso" 
  });
}

    return reply.status(201).send({
      token: signInData.session.access_token,
      user: result.user,
      account: result.account,
    });
  } catch (err) {
    console.error("Register error:", err);
    return reply.status(500).send({ 
      error: "Erro ao criar conta" 
    });
  }
}