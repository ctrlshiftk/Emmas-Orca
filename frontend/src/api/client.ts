import type { JourneyResponse, OrcaProfile } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

export type BootstrapJourneyResult =
  | { ok: true; data: JourneyResponse }
  | { ok: false; needsWelcome: true }
  | { ok: false; error: Error };

export async function fetchOrcas(): Promise<OrcaProfile[]> {
  const resp = await fetch(`${API_BASE}/orcas`);
  if (!resp.ok) throw new Error("Orcas konnten nicht geladen werden");
  return resp.json();
}

/** True when no friend orca is stored yet (or profile missing after reseed). */
export async function bootstrapJourney(): Promise<BootstrapJourneyResult> {
  const resp = await fetch(`${API_BASE}/friend-orca/journey`);
  if (resp.ok) {
    return { ok: true, data: await resp.json() };
  }
  if (resp.status === 404) {
    let detail: string | undefined;
    try {
      const body = await resp.json();
      detail = typeof body.detail === "string" ? body.detail : undefined;
    } catch {
      /* ignore */
    }
    if (detail === "Friend orca not set" || detail === "Friend orca profile missing") {
      return { ok: false, needsWelcome: true };
    }
  }
  return {
    ok: false,
    error: new Error(`Route konnte nicht geladen werden (${resp.status})`),
  };
}

export async function setFriendOrca(orcaProfileId: number, friendNickname: string): Promise<void> {
  const trimmed = friendNickname.trim();
  if (!trimmed) throw new Error("Spitzname fehlt");
  const body = { orca_profile_id: orcaProfileId, friend_nickname: trimmed };
  const resp = await fetch(`${API_BASE}/friend-orca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error("Freund-Orca konnte nicht gespeichert werden");
}

export async function resetFriendOrca(): Promise<void> {
  const resp = await fetch(`${API_BASE}/friend-orca`, { method: "DELETE" });
  if (!resp.ok) throw new Error("Freund-Orca konnte nicht zurückgesetzt werden");
}

export async function fetchJourney(): Promise<JourneyResponse> {
  const resp = await fetch(`${API_BASE}/friend-orca/journey`);
  if (!resp.ok) throw new Error("Route konnte nicht geladen werden");
  return resp.json();
}
