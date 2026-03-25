import { useCallback, useEffect, useState } from "react";

import { bootstrapJourney, fetchJourney, resetFriendOrca } from "./api/client";
import { App } from "./pages/App";
import { Welcome } from "./pages/Welcome";
import type { JourneyResponse } from "./types";

type Phase = "loading" | "welcome" | "app";

export function AppRoot() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const runBootstrap = useCallback(async () => {
    setPhase("loading");
    setLoadError(null);
    const result = await bootstrapJourney();
    if (result.ok) {
      setJourney(result.data);
      setPhase("app");
      return;
    }
    if ("needsWelcome" in result && result.needsWelcome) {
      setJourney(null);
      setPhase("welcome");
      return;
    }
    setLoadError(result.error.message);
    setPhase("welcome");
  }, []);

  useEffect(() => {
    void runBootstrap();
  }, [runBootstrap]);

  const onWelcomeComplete = async () => {
    try {
      const data = await fetchJourney();
      setJourney(data);
      setPhase("app");
    } catch (e) {
      console.error(e);
      setLoadError("Gespeichert, aber die Route konnte nicht geladen werden. Bitte die Seite neu laden.");
    }
  };

  const onResetFriendChoice = async () => {
    await resetFriendOrca();
    setJourney(null);
    setPhase("welcome");
  };

  if (phase === "loading") {
    return (
      <div className="app-loading">
        <p>Muss noch kurz deinen Orca suchen, warte...</p>
      </div>
    );
  }

  if (phase === "welcome") {
    return (
      <>
        {loadError && (
          <div className="app-bootstrap-banner" role="status">
            {loadError}
          </div>
        )}
        <Welcome onComplete={() => void onWelcomeComplete()} />
      </>
    );
  }

  if (journey) {
    return <App initialJourney={journey} onResetFriendChoice={onResetFriendChoice} />;
  }

  return null;
}
