import {
  getGuildAccountLinksForUser,
  type AccountLinkMatch,
} from "./accountLinks.js";
import {
  getUserInvestigation,
  type UserInvestigation,
} from "./userInvestigation.js";

export interface UserInvestigationDetails {
  investigation: UserInvestigation;
  links: AccountLinkMatch[];
}

export async function getUserInvestigationDetails(
  guildId: string,
  userId: string,
): Promise<UserInvestigationDetails> {
  const [investigation, links] = await Promise.all([
    getUserInvestigation(guildId, userId),
    getGuildAccountLinksForUser(guildId, userId),
  ]);

  return {
    investigation,
    links,
  };
}
