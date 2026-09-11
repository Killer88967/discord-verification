export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface ManageableDiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
}

const ADMINISTRATOR = BigInt(8);
const MANAGE_GUILD = BigInt(32);

export async function getManageableDiscordGuilds(
  accessToken: string,
): Promise<ManageableDiscordGuild[]> {
  const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Discord guilds: ${response.status} ${response.statusText}`,
    );
  }

  const guilds = (await response.json()) as DiscordGuild[];

  return guilds
    .filter((guild) => {
      const permissions = BigInt(guild.permissions);

      return (
        guild.owner ||
        (permissions & ADMINISTRATOR) === ADMINISTRATOR ||
        (permissions & MANAGE_GUILD) === MANAGE_GUILD
      );
    })
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: guild.owner,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
