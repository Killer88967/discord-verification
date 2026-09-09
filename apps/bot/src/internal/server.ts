import { timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import { getRoleAssignmentTarget } from "@verification/database";
import type { Client } from "discord.js";

interface StartInternalServerOptions {
  client: Client;
  secret: string;
  port: number;
}

interface VerificationCompleteBody {
  sessionId: string;
}

export function startInternalServer({
  client,
  secret,
  port,
}: StartInternalServerOptions): void {
  const server = createServer(async (request, response) => {
    try {
      if (
        request.method !== "POST" ||
        request.url !== "/internal/verification-complete"
      ) {
        sendJson(response, 404, {
          error: "Not found.",
        });

        return;
      }

      if (!isAuthorized(request, secret)) {
        sendJson(response, 401, {
          error: "Unauthorized.",
        });

        return;
      }

      const body = await readJsonBody<VerificationCompleteBody>(request);

      if (
        !body ||
        typeof body.sessionId !== "string" ||
        body.sessionId.length === 0
      ) {
        sendJson(response, 400, {
          error: "sessionId is required.",
        });

        return;
      }

      const target = await getRoleAssignmentTarget(body.sessionId);

      if (target.status !== "READY") {
        sendJson(response, 409, {
          status: target.status,
        });

        return;
      }

      const guild =
        client.guilds.cache.get(target.session.guildId) ??
        (await client.guilds.fetch(target.session.guildId).catch(() => null));

      if (!guild) {
        sendJson(response, 404, {
          error: "Guild could not be found.",
        });

        return;
      }

      const member = await guild.members
        .fetch(target.session.userId)
        .catch(() => null);

      if (!member) {
        sendJson(response, 404, {
          error: "Member could not be found.",
        });

        return;
      }

      if (!member.roles.cache.has(target.session.verifiedRoleId)) {
        await member.roles.add(
          target.session.verifiedRoleId,
          "Verification completed",
        );
      }

      sendJson(response, 200, {
        status: "ROLE_GRANTED",
      });
    } catch (error) {
      console.error("Internal API request failed:", error);

      sendJson(response, 500, {
        error: "Internal server error.",
      });
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Internal bot API listening on port ${port}`);
  });
}

function isAuthorized(
  request: IncomingMessage,
  expectedSecret: string,
): boolean {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const suppliedSecret = authorization.slice("Bearer ".length);

  const supplied = Buffer.from(suppliedSecret);
  const expected = Buffer.from(expectedSecret);

  if (supplied.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(supplied, expected);
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T | null> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    size += buffer.length;

    if (size > 16_384) {
      throw new Error("Request body too large.");
    }

    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function sendJson(
  response: ServerResponse,
  status: number,
  data: unknown,
): void {
  response.writeHead(status, {
    "Content-Type": "application/json",
  });

  response.end(JSON.stringify(data));
}
