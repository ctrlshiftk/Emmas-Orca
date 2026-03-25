import { useEffect, useMemo, useState } from "react";

import { fetchOrcas, setFriendOrca } from "../api/client";
import type { OrcaProfile } from "../types";
import { friendSummaryLabel, journeyHeadingName } from "../utils/friendDisplayName";
import "./Welcome.css";

type Props = {
  onComplete: () => void;
};

export function Welcome({ onComplete }: Props) {
  const [orcas, setOrcas] = useState<OrcaProfile[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendNickname, setFriendNickname] = useState("");

  useEffect(() => {
    fetchOrcas()
      .then((list) => {
        setOrcas(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setError("Orcas konnten nicht geladen werden. Keine API-Verbindung?"))
      .finally(() => setLoading(false));
  }, []);

  const selectedOrca = useMemo(
    () => orcas.find((o) => o.id === selectedId) ?? null,
    [orcas, selectedId]
  );


  const onContinue = async () => {
    if (selectedId == null || !friendNickname.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await setFriendOrca(selectedId, friendNickname);
      onComplete();
    } catch {
      setError("Die Auswahl konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="welcome-shell">
      <div className="welcome-card">
        <p className="welcome-eyebrow">Emmas Orca</p>
        <h1 className="welcome-title">Hallo Emmer! 👋</h1>
        <p className="welcome-lead">
          Hier kannst du dir einen Orca aussuchen, den du auf seiner Reise begleiten kannst.
        </p>

        {error && <p className="welcome-error">{error}</p>}

        {loading ? (
          <p className="welcome-muted">Orcas werden geladen…</p>
        ) : (
          <ul className="welcome-list">
            {orcas.map((o) => (
              <li key={o.id}>
                <label className={`welcome-option ${selectedId === o.id ? "is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="friend-orca"
                    checked={selectedId === o.id}
                    onChange={() => setSelectedId(o.id)}
                  />
                  <span className="welcome-option-body">
                    <span className="welcome-option-name">{o.display_name}</span>
                    <span className="welcome-option-pod">{o.pod ?? "Unbekannte Gruppe"}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {!loading && orcas.length > 0 && (
          <div className="welcome-nickname-field">
            <label htmlFor="friend-nickname">
              Spitzname <span aria-hidden="true">*</span>
            </label>
            <input
              id="friend-nickname"
              type="text"
              className="welcome-nickname-input"
              placeholder=""
              maxLength={128}
              required
              aria-required="true"
              value={friendNickname}
              onChange={(e) => setFriendNickname(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <button
          type="button"
          className="welcome-cta"
          disabled={
            loading || saving || selectedId == null || !orcas.length || !friendNickname.trim()
          }
          onClick={() => void onContinue()}
        >
          {saving ? "Wird gespeichert…" : "Weiter"}
        </button>
      </div>
    </main>
  );
}
