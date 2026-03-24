import type { JourneyResponse, OrcaProfile } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

export async function fetchOrcas(): Promise<OrcaProfile[]> {
  const resp = await fetch(`${API_BASE}/orcas`);
  if (!resp.ok) throw new Error("Failed to fetch orcas");
  return resp.json();
}

export async function setFriendOrca(orcaProfileId: number): Promise<void> {
  const resp = await fetch(`${API_BASE}/me/friend-orca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name: "demo", orca_profile_id: orcaProfileId }),
  });
  if (!resp.ok) throw new Error("Failed to set friend orca");
}

export async function fetchJourney(): Promise<JourneyResponse> {
  const resp = await fetch(`${API_BASE}/me/friend-orca/journey?user_name=demo`);
  if (!resp.ok) throw new Error("Failed to fetch journey");
  return resp.json();
}
