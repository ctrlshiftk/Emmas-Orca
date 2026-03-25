import { useEffect, useState } from "react";

import { fetchOrcas, setFriendOrca } from "../api/client";
import type { OrcaProfile } from "../types";
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

  useEffect(() => {
    fetchOrcas()
      .then((list) => {
        setOrcas(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setError("Could not load orcas. Check the API connection."))
      .finally(() => setLoading(false));
  }, []);

  const onContinue = async () => {
    if (selectedId == null) return;
    setSaving(true);
    setError(null);
    try {
      await setFriendOrca(selectedId);
      onComplete();
    } catch {
      setError("Could not save your choice. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="welcome-shell">
      <div className="welcome-card">
        <p className="welcome-eyebrow">Emmas Orca</p>
        <h1 className="welcome-title">Choose your friend orca</h1>
        <p className="welcome-lead">
          Pick the orca you want to follow. This is saved for you on every device—no sign-in needed.
        </p>

        {error && <p className="welcome-error">{error}</p>}

        {loading ? (
          <p className="welcome-muted">Loading orcas…</p>
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
                    <span className="welcome-option-pod">{o.pod ?? "Unknown pod"}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="welcome-cta"
          disabled={loading || saving || selectedId == null || !orcas.length}
          onClick={() => void onContinue()}
        >
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
