import type { JourneyResponse, OrcaProfile } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

export type BootstrapJourneyResult =
  | { ok: true; data: JourneyResponse }
  | { ok: false; needsWelcome: true }
  | { ok: false; error: Error };

export async function fetchOrcas(): Promise<OrcaProfile[]> {
  const resp = await fetch(`${API_BASE}/orcas`);
  if (!resp.ok) throw new Error("Failed to fetch orcas");
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
    error: new Error(`Failed to load journey (${resp.status})`),
  };
}

export async function setFriendOrca(orcaProfileId: number): Promise<void> {
  const resp = await fetch(`${API_BASE}/friend-orca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orca_profile_id: orcaProfileId }),
  });
  if (!resp.ok) throw new Error("Failed to set friend orca");
}

export async function resetFriendOrca(): Promise<void> {
  const resp = await fetch(`${API_BASE}/friend-orca`, { method: "DELETE" });
  if (!resp.ok) throw new Error("Failed to reset friend orca");
}

export async function fetchJourney(): Promise<JourneyResponse> {
  const resp = await fetch(`${API_BASE}/friend-orca/journey`);
  if (!resp.ok) throw new Error("Failed to fetch journey");
  return resp.json();
}
