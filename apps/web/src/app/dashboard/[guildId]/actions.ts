"use server";

import { auth } from "@/lib/auth";
import {
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
