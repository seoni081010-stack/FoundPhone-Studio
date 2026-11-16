import approved from "../../stories/date-invitations.json";
import dates from "../../stories/template/hogwarts-dates.json";
import { routeDateContent } from "./routeDateContent";
import { acceptsInvitation } from "./sharedRules";

export const invitationPools: Record<string, { accepts: string[]; declines: string[] }> = approved;
export function canInvite(lead: string, venue: string) {
  return dates.venues.some(item => item.id === venue) && Boolean(invitationPools[lead] || routeDateContent[lead]?.venues[venue]);
}
export function invitationReply(lead: string, affinity: number, venue: string, day: number, random: () => number = Math.random) {
  if (!canInvite(lead, venue)) return undefined;
  const accepted = acceptsInvitation(affinity);
  const pool = invitationPools[lead];
  const replies = pool?.[accepted ? "accepts" : "declines"];
  // Draw only when an invitation is sent. Repeated draws may select the same reply.
  const reply = replies ? replies[Math.min(replies.length - 1, Math.max(0, Math.floor(random() * replies.length)))]
    : accepted ? routeDateContent[lead].venues[venue].reply
      : routeDateContent[lead].declines[(day - 1) % routeDateContent[lead].declines.length];
  return { accepted, reply };
}

export type DateInvitation = { recipient: string; day: number; date: number; venue: string; venueName: string; accepted: boolean; reply: string; order: number };
export type DateSave = { invitations: DateInvitation[]; attended: number[] };
export function dateInvitationKey(identityKey: string, lead: string) {
  return `hogwarts-date-invitations-v1:${identityKey}:${lead}`;
}
export function readDateInvitations(key: string): DateSave {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    const invitations = Array.isArray(saved?.invitations) ? saved.invitations.filter((entry: DateInvitation) => entry &&
      typeof entry.recipient === "string" && Number.isInteger(entry.day) && entry.day >= 1 && entry.day <= 31 &&
      Number.isInteger(entry.date) && entry.date >= entry.day && entry.date <= 31 && canInvite(entry.recipient, entry.venue) &&
      typeof entry.venueName === "string" && typeof entry.reply === "string" && typeof entry.accepted === "boolean" && Number.isFinite(entry.order)) : [];
    const attended = Array.isArray(saved?.attended) ? saved.attended.filter((day: number) => Number.isInteger(day) && day >= 1 && day <= 31) : [];
    return { invitations, attended };
  } catch { return { invitations: [], attended: [] }; }
}
export function saveDateInvitations(key: string, save: DateSave) {
  try { localStorage.setItem(key, JSON.stringify(save)); } catch { /* Continue within this session if storage is unavailable. */ }
}
