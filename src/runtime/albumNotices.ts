export type AlbumNotice = { id: string; title: string; body: string; unlocked: boolean };
export type AlbumNoticeRecord = { acknowledged: string[]; completedDays: number[] };
type Identity = { name: string; house: string; year: number; loveInterest: string; runId?: string };

// Keep each playthrough and character separate, even for old identities without a run ID.
export function albumNoticeKey(identity?: Identity | null) {
  return `foundphone-album-notices-v1-${identity?.runId ?? [identity?.name, identity?.house, identity?.year].join("-")}-${identity?.loveInterest ?? "hyunjae"}`;
}
export function readAlbumNotices(key: string): AlbumNoticeRecord {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    return {
      acknowledged: Array.isArray(saved?.acknowledged) ? saved.acknowledged.filter((id: unknown) => typeof id === "string") : [],
      completedDays: Array.isArray(saved?.completedDays) ? saved.completedDays.filter((day: unknown) => Number.isInteger(day) && Number(day) >= 1 && Number(day) <= 31) : [],
    };
  } catch { return { acknowledged: [], completedDays: [] }; }
}
export function saveAlbumNotices(key: string, record: AlbumNoticeRecord) {
  try { localStorage.setItem(key, JSON.stringify(record)); return true; }
  catch { return false; }
}
// Obtaining a clue on a later date still supports existing saves. On its own date,
// wait for the player to finish reading the encounter, rather than just selecting a branch.
export function albumSceneRead(day: number, clueDay: number, completedDays: readonly number[]) {
  return day > clueDay || (day === clueDay && completedDays.includes(clueDay));
}
export function nextAlbumNotice(clues: readonly AlbumNotice[], acknowledged: readonly string[], blocked: boolean) {
  return blocked ? undefined : clues.find(clue => clue.unlocked && !acknowledged.includes(clue.id));
}
