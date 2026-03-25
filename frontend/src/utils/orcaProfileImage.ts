/** Public URLs under `frontend/public/` — extend when adding more photos. */
const ORCA_PROFILE_IMAGE_BY_DISPLAY_NAME: Record<string, string> = {
  "Oreo (J22)": "/orcas/j22-oreo.png",
  "Coho (L108)": "/orcas/l108-coho.png",
  "Nova (J51)": "/orcas/j51-nova.png",
  "Kelp (K42)": "/orcas/k42-kelp.png",
};

const DEFAULT_ORCA_PROFILE_IMAGE = "/orca-profile.svg";

export function orcaProfileImageSrc(displayName: string): string {
  return ORCA_PROFILE_IMAGE_BY_DISPLAY_NAME[displayName] ?? DEFAULT_ORCA_PROFILE_IMAGE;
}
