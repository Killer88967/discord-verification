export interface GuildRoleOption {
  id: string;
  name: string;
  position: number;
}

export interface GuildChannelOption {
  id: string;
  name: string;
}

export interface GuildOptions {
  roles: GuildRoleOption[];
  channels: GuildChannelOption[];
}

export interface GuildUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  inGuild: boolean;
}

export interface GuildUsersResponse {
  users: GuildUser[];
}

export async function getGuildOptions(guildId: string): Promise<GuildOptions> {
  const botInternalUrl = process.env.BOT_INTERNAL_URL;
  const internalApiSecret = process.env.INTERNAL_API_SECRET;

  if (!botInternalUrl) {
    throw new Error("BOT_INTERNAL_URL is not defined.");
  }

  if (!internalApiSecret) {
    throw new Error("INTERNAL_API_SECRET is not defined.");
  }

  const response = await fetch(
    new URL("/internal/guild-options", botInternalUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${internalApiSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guildId,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Failed to fetch guild options: ${response.status} ${body}`,
    );
  }

  return (await response.json()) as GuildOptions;
}

export async function getGuildUsers(
  guildId: string,
  userIds: string[],
): Promise<GuildUser[]> {
  const botInternalUrl = process.env.BOT_INTERNAL_URL;
  const internalApiSecret = process.env.INTERNAL_API_SECRET;

  if (!botInternalUrl) {
    throw new Error("BOT_INTERNAL_URL is not defined.");
  }

  if (!internalApiSecret) {
    throw new Error("INTERNAL_API_SECRET is not defined.");
  }

  if (userIds.length === 0) {
    return [];
  }

  const response = await fetch(
    new URL("/internal/guild-users", botInternalUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${internalApiSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guildId,
        userIds,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Failed to fetch guild users: ${response.status} ${body}`);
  }

  const data = (await response.json()) as GuildUsersResponse;

  return data.users;
}
