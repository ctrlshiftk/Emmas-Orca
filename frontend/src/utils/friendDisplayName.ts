/**
 * Splits catalog `display_name` like "Tahlequah (J35)" into primary name + optional ID code.
 * If there is no trailing "(…)", the whole string is primary and code is null.
 */
export function parseDisplayNameParts(displayName: string): {
  primary: string;
  catalogCode: string | null;
} {
  const m = displayName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!m) {
    return { primary: displayName.trim(), catalogCode: null };
  }
  const primary = m[1]!.trim();
  const catalogCode = m[2]!.trim();
  return {
    primary: primary || displayName.trim(),
    catalogCode: catalogCode || null,
  };
}

/**
 * Label für „Dein Orca-Freund“: Spitzname + ggf. Katalog-ID in Klammern.
 * Ohne Spitzname (z. B. alte Daten): voller Katalog-String.
 * Mit Spitzname „Star“ und ID J35: „Star (J35)“; ohne ID im Katalog: nur „Star“.
 */
export function friendSummaryLabel(displayName: string, nickname?: string | null): string {
  const { primary, catalogCode } = parseDisplayNameParts(displayName);
  const n = nickname?.trim();
  if (!n) {
    return displayName.trim();
  }
  if (catalogCode) {
    return `${n} (${catalogCode})`;
  }
  return n;
}

/**
 * Kurzer Name für Seitentitel / Genitiv ("…'s Reise"): nur Spitzname, sonst Katalog-Vorname ohne "(J35)".
 * So entfällt "Star (J35)'s Reise" zugunsten von "Star's Reise".
 */
export function journeyHeadingName(displayName: string, nickname?: string | null): string {
  const n = nickname?.trim();
  if (n) {
    return n;
  }
  return parseDisplayNameParts(displayName).primary;
}

/** @deprecated Use friendSummaryLabel */
export function formatFriendDisplayName(displayName: string, nickname?: string | null): string {
  return friendSummaryLabel(displayName, nickname);
}
