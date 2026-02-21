// src/routes/avatar.routes.ts
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import fastifyMultipart from "@fastify/multipart";
import { decryptBinaryWithSNA, encryptBinaryWithSNA } from "../sna/sna456-binary";
import { usersCollection } from "../model/user.model";
import { randomUUID } from "crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { ObjectId } from "mongodb";

export async function meAvatarRoutes(app: FastifyInstance) {
  app.register(fastifyMultipart);

  app.post(
    "/me/avatar",
    { preHandler: app.authGuard },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const file = await request.file({
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      });

      if (!file) {
        return reply.status(400).send({ message: "Arquivo obrigatório" });
      }

      const buf = await file.toBuffer();
      const mimeType = file.mimetype;

      const encrypted = await encryptBinaryWithSNA({
        buffer: buf,
        context: { userId, type: "avatar", recordId: userId },
      });

      const fileId = randomUUID();
      const outPath = path.join(
        process.cwd(),
        "storage",
        "avatars",
        `${fileId}.sna`,
      );

      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, encrypted);

      const col = await usersCollection();
      await col.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            avatar_file_id: fileId,
            avatar_mime_type: mimeType,
            updated_at: new Date(),
          },
        },
      );

      return reply.status(200).send({ ok: true });
    },
  );

  // DOWNLOAD (novo) - GET /api/me/avatar
  app.get(
    "/me/avatar",
    { preHandler: app.authGuard },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.status(401).send({ message: "Unauthorized" });
      }

      const col = await usersCollection();
      const user = await col.findOne({ _id: new ObjectId(userId) });

      if (!user || !user.avatar_file_id) {
        // sem avatar: 404 pra cair no placeholder do front
        return reply.status(404).send({ message: "Avatar não encontrado" });
      }

      const filePath = path.join(
        process.cwd(),
        "storage",
        "avatars",
        `${user.avatar_file_id}.sna`,
      );

      const encryptedData = await fs.readFile(filePath, "utf8");

const decryptedBuffer = await decryptBinaryWithSNA({
  data: encryptedData,
  context: { userId, type: "avatar", recordId: userId },
});



      const mimeType = user.avatar_mime_type || "image/png";

      reply.type(mimeType); // ex: image/png
     return reply.type(mimeType).send(decryptedBuffer);   // Fastify envia Buffer como binário[web:401][web:403]
    },
  );

}
