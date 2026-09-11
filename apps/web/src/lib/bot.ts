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
