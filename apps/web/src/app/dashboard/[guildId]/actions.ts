"use server";

import { auth } from "@/lib/auth";
import { getGuildOptions } from "@/lib/bot";
import {
  updateGuildConfigSettings,
  updateGuildSecurityPolicy,
  type GuildSecurityPolicy,
} from "@verification/database";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

type RiskAction = GuildSecurityPolicy["riskAction"];

const riskActions: RiskAction[] = ["NONE", "REJECT", "KICK", "BAN"];

export async function updateSecuritySettings(
  formData: FormData,
): Promise<void> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const guildId = formData.get("guildId");

  if (typeof guildId !== "string") {
    throw new Error("guildId is required.");
  }

  const guild = session.manageableGuilds.find(
    (manageableGuild) => manageableGuild.id === guildId,
  );

  if (!guild) {
    notFound();
  }

  const minimumAccountAgeDays = Number(formData.get("minimumAccountAgeDays"));

  const riskThreshold = Number(formData.get("riskThreshold"));

  const rawRiskAction = formData.get("riskAction");

  if (
    typeof rawRiskAction !== "string" ||
    !riskActions.includes(rawRiskAction as RiskAction)
  ) {
    throw new Error("Invalid risk action.");
  }

  await updateGuildSecurityPolicy({
    guildId,
    enabled: formData.get("enabled") === "on",
    minimumAccountAgeDays,
    riskThreshold,
    riskAction: rawRiskAction as RiskAction,
  });

  revalidatePath(`/dashboard/${guildId}`);
}

export async function updateGuildSettings(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const guildId = formData.get("guildId");

  if (typeof guildId !== "string" || guildId.length === 0) {
    throw new Error("guildId is required.");
  }

  const guild = session.manageableGuilds.find(
    (manageableGuild) => manageableGuild.id === guildId,
  );

  if (!guild) {
    notFound();
  }

  const verifiedRoleId = formData.get("verifiedRoleId");
  const verificationChannelId = formData.get("verificationChannelId");
  const logChannelId = formData.get("logChannelId");

  if (typeof verifiedRoleId !== "string" || verifiedRoleId.length === 0) {
    throw new Error("A verified role is required.");
  }

  if (
    typeof verificationChannelId !== "string" ||
    verificationChannelId.length === 0
  ) {
    throw new Error("A verification channel is required.");
  }

  if (typeof logChannelId !== "string") {
    throw new Error("Invalid log channel.");
  }

  const options = await getGuildOptions(guildId);

  const roleExists = options.roles.some((role) => role.id === verifiedRoleId);

  if (!roleExists) {
    throw new Error("Invalid verified role.");
  }

  const verificationChannelExists = options.channels.some(
    (channel) => channel.id === verificationChannelId,
  );

  if (!verificationChannelExists) {
    throw new Error("Invalid verification channel.");
  }

  if (
    logChannelId.length > 0 &&
    !options.channels.some((channel) => channel.id === logChannelId)
  ) {
    throw new Error("Invalid log channel.");
  }

  await updateGuildConfigSettings({
    guildId,
    verifiedRoleId,
    verificationChannelId,
    logChannelId: logChannelId || null,
  });

  revalidatePath(`/dashboard/${guildId}`);
}
