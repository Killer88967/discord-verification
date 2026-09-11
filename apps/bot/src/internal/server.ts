import { execFile } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { promisify } from "node:util";

import {
  getRoleAssignmentTarget,
  getVerificationEnforcementTarget,
  getVerificationRiskContext,
} from "@verification/database";
import { calculateRiskScore } from "@verification/security";
import type { Client, Guild } from "discord.js";

const execFileAsync = promisify(execFile);

interface StartInternalServerOptions {
  client: Client;
  secret: string;
  port: number;
}

interface InternalGuildBody {
  guildId: string;
}

interface InternalSessionBody {
  sessionId: string;
}

export async function startInternalServer({
  client,
  secret,
  port,
}: StartInternalServerOptions): Promise<void> {
  const server = createServer(async (request, response) => {
    try {
      if (request.method !== "POST") {
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

      if (request.url === "/internal/verification-risk") {
        const body = await readJsonBody<InternalSessionBody>(request);

        if (!isValidSessionBody(body)) {
          sendJson(response, 400, {
            error: "sessionId is required.",
          });

          return;
        }

        const context = await getVerificationRiskContext(body.sessionId);

        if (context.status !== "READY") {
          sendJson(response, 409, {
            status: context.status,
          });

          return;
        }

        const guild =
          client.guilds.cache.get(context.session.guildId) ??
          (await client.guilds
            .fetch(context.session.guildId)
            .catch(() => null));

        if (!guild) {
          sendJson(response, 404, {
            error: "Guild could not be found.",
          });

          return;
        }

        const bannedMatches = await Promise.all(
          context.linkedUserIds.map((userId) => isUserBanned(guild, userId)),
        );

        const assessment = calculateRiskScore([
          {
            reason: "LINKED_BANNED_ACCOUNT",
            matched: bannedMatches.some(Boolean),
          },
        ]);

        sendJson(response, 200, {
          status: "ASSESSED",
          score: assessment.score,
          reasons: assessment.reasons,
        });

        return;
      }

      if (request.url === "/internal/verification-enforcement") {
        const body = await readJsonBody<InternalSessionBody>(request);

        if (!isValidSessionBody(body)) {
          sendJson(response, 400, {
            error: "sessionId is required.",
          });

          return;
        }

        const target = await getVerificationEnforcementTarget(body.sessionId);

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

        if (target.session.action === "BAN") {
          await guild.members.ban(target.session.userId, {
            reason: "Verification security policy",
          });

          sendJson(response, 200, {
            status: "BANNED",
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

        await member.kick("Verification security policy");

        sendJson(response, 200, {
          status: "KICKED",
        });

        return;
      }

      if (request.url === "/internal/verification-complete") {
        const body = await readJsonBody<InternalSessionBody>(request);

        if (!isValidSessionBody(body)) {
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

        return;
      }

      if (request.url === "/internal/guild-options") {
        const body = await readJsonBody<InternalGuildBody>(request);

        if (
          !body ||
          typeof body.guildId !== "string" ||
          body.guildId.length === 0
        ) {
          sendJson(response, 400, {
            error: "guildId is required.",
          });

          return;
        }

        const guild =
          client.guilds.cache.get(body.guildId) ??
          (await client.guilds.fetch(body.guildId).catch(() => null));

        if (!guild) {
          sendJson(response, 404, {
            error: "Guild could not be found.",
          });
        }

        const botMember = guild?.members.me;

        const roles = guild?.roles.cache
          .filter((role) => {
            if (role.id === guild.id || role.managed) {
              return false;
            }

            if (!botMember) {
              return;
            }

            return role.position < botMember.roles.highest.position;
          })
          .sort((a, b) => b.position - a.position)
          .map((role) => ({
            id: role.id,
            name: role.name,
            position: role.position,
          }));

        const channels = guild?.channels.cache
          .filter((channel) => channel.type === 0)
          .sort((a, b) => a.position - b.position)
          .map((channel) => ({
            id: channel.id,
            name: channel.name,
          }));

        sendJson(response, 200, {
          roles,
          channels,
        });

        return;
      }

      sendJson(response, 404, {
        error: "Not found.",
      });
    } catch (error) {
      console.error("Internal API request failed:", error);

      sendJson(response, 500, {
        error: "Internal server error.",
      });
    }
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);

      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);

        console.log(`Internal bot API listening on port ${port}`);

        resolve();
      });
    });
  } catch (error) {
    if (isNodeError(error) && error.code === "EADDRINUSE") {
      const pid = await findProcessUsingPort(port);

      const lines = [
        "",
        `Failed to start internal API: port ${port} is already in use.`,
      ];

      if (pid !== null) {
        lines.push(
          "",
          `Process using port: ${pid}`,
          "",
          "Kill it with:",
          `  kill ${pid}`,
          "",
          "Or force kill it with:",
          `  kill -9 ${pid}`,
        );
      } else {
        lines.push(
          "",
          "Could not automatically determine the process using the port.",
          "",
          "Find it with:",
          `  lsof -i :${port}`,
        );
      }

      lines.push(
        "",
        "You can also change INTERNAL_API_PORT in the bot environment file.",
        "",
      );

      console.error(lines.join("\n"));

      client.destroy();
      process.exit(1);
    }

    if (isNodeError(error) && error.code === "EACCES") {
      console.error(
        [
          "",
          `Failed to start internal API: permission denied for port ${port}.`,
          "",
          "Try using a port above 1024.",
          "",
          "You can also change INTERNAL_API_PORT in the bot environment file.",
          "",
        ].join("\n"),
      );

      client.destroy();
      process.exit(1);
    }

    if (isNodeError(error) && error.code === "EADDRNOTAVAIL") {
      console.error(
        [
          "",
          "Failed to start internal API: address is not available.",
          "",
          `Requested address: 127.0.0.1:${port}`,
          "",
          "Check the network configuration for the current environment.",
          "",
        ].join("\n"),
      );

      client.destroy();
      process.exit(1);
    }

    console.error(
      [
        "",
        "Failed to start internal API:",
        "",
        error instanceof Error ? error.message : String(error),
        "",
      ].join("\n"),
    );

    client.destroy();
    process.exit(1);
  }
}

function isValidSessionBody(
  body: InternalSessionBody | null,
): body is InternalSessionBody {
  return (
    body !== null &&
    typeof body.sessionId === "string" &&
    body.sessionId.length > 0
  );
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

async function isUserBanned(guild: Guild, userId: string): Promise<boolean> {
  try {
    await guild.bans.fetch(userId);

    return true;
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10026
    ) {
      return false;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

async function findProcessUsingPort(port: number): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync("lsof", [
      "-t",
      `-iTCP:${port}`,
      "-sTCP:LISTEN",
    ]);

    const firstPid = stdout.trim().split("\n")[0];

    if (!firstPid) {
      return null;
    }

    const pid = Number(firstPid);

    if (!Number.isInteger(pid) || pid <= 0) {
      return null;
    }

    return pid;
  } catch {
    return null;
  }
}
