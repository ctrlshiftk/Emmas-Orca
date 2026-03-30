import { useEffect, useMemo, useState } from "react";

import { JourneyMap } from "../components/map/JourneyMap";
import type { JourneyPoint, JourneyResponse } from "../types";
import { friendSummaryLabel, journeyHeadingName } from "../utils/friendDisplayName";
import { orcaProfileImageSrc } from "../utils/orcaProfileImage";

type AppProps = {
  initialJourney: JourneyResponse;
  onResetFriendChoice: () => Promise<void>;
};

const ORCA_GIF_URL = "/orca-floating.png";

function lastPointIndex(points: JourneyPoint[]): number {
  return Math.max(0, points.length - 1);
}

function haversineKm(a: JourneyPoint, b: JourneyPoint): number {
  const r = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * r * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function FloatingOrca() {
  const size = 128;
  const margin = 12;
  const [pos, setPos] = useState({ x: margin, y: margin });

  useEffect(() => {
    const nextSpot = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const x = Math.max(
        margin,
        Math.floor(Math.random() * Math.max(1, width - size - margin * 2)) + margin
      );
      const y = Math.max(
        margin,
        Math.floor(Math.random() * Math.max(1, height - size - margin * 2)) + margin
      );
      setPos({ x, y });
    };

    nextSpot();
    const timer = window.setInterval(nextSpot, 10000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <img
      src={ORCA_GIF_URL}
      alt="Schwertwal (Deko)"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: size,
        height: size,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: "transform 6s ease-in-out",
        zIndex: 999999,
        pointerEvents: "none",
        userSelect: "none",
      }}
    />
  );
}

export function App({ initialJourney, onResetFriendChoice }: AppProps) {
  const [points, setPoints] = useState<JourneyPoint[]>(initialJourney.points);
  const [playhead, setPlayhead] = useState(() => lastPointIndex(initialJourney.points));
  const [playing, setPlaying] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const friendOrca = initialJourney.orca;
  const orcaProfileImage = useMemo(
    () => orcaProfileImageSrc(friendOrca.display_name),
    [friendOrca.display_name]
  );
  const orcaProfileImageAlt = orcaProfileImage.endsWith(".svg")
    ? ""
    : friendOrca.display_name;
  const friendSummary = friendSummaryLabel(friendOrca.display_name, initialJourney.friend_nickname);
  const journeyName = journeyHeadingName(friendOrca.display_name, initialJourney.friend_nickname);
  const pageTitle =
    /s$/i.test(journeyName)
      ? `${journeyName}' Reise`
      : `${journeyName}s Reise`;

  useEffect(() => {
    setPoints(initialJourney.points);
    setPlayhead(lastPointIndex(initialJourney.points));
    setPlaying(false);
  }, [initialJourney]);

  useEffect(() => {
    document.title = pageTitle;
    return () => {
      document.title = "Emmas Orca";
    };
  }, [pageTitle]);

  const shownPoints = useMemo(() => {
    if (!points.length) return [];
    return points.slice(0, Math.max(1, playhead + 1));
  }, [points, playhead]);
  const traveledKm = useMemo(() => {
    if (shownPoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < shownPoints.length; i += 1) {
      total += haversineKm(shownPoints[i - 1], shownPoints[i]);
    }
    return total;
  }, [shownPoints]);
  const latestPoint = shownPoints.length > 0 ? shownPoints[shownPoints.length - 1] : null;

  useEffect(() => {
    if (!playing || points.length < 2) return;
    const max = Math.max(points.length - 1, 0);
    const timer = window.setInterval(() => {
      setPlayhead((prev) => {
        if (prev >= max) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing, points.length]);

  const handleConfirmReset = async () => {
    setConfirmResetOpen(false);
    setResetError(null);
    setResetting(true);
    try {
      await onResetFriendChoice();
    } catch {
      setResetError("Die Auswahl konnte nicht zurückgesetzt werden. Bitte erneut versuchen.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <FloatingOrca />
      {confirmResetOpen && (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={() => !resetting && setConfirmResetOpen(false)}
        >
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-friend-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-friend-title" className="confirm-dialog-title">
              Orca zurücksetzen?
            </h2>
            <p className="confirm-dialog-body">
              Du kehrst zum Welcome Screen zurück und kannst einen anderen Orca wählen. Achtung: alle bisherigen Daten werden gelöscht!
            </p>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="confirm-dialog-btn confirm-dialog-btn-secondary"
                disabled={resetting}
                onClick={() => setConfirmResetOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                className="confirm-dialog-btn confirm-dialog-btn-danger"
                disabled={resetting}
                onClick={() => void handleConfirmReset()}
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="app-shell">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Emmas Orca</p>
            <h1>{pageTitle}</h1>
            <p className="muted">Hier kannst du sehen, wo sich {journeyName} gerade rumtreibt.</p>
            <p className="muted subtle-footnote">
                Vielleicht ist er aber auch gerade unterwegs und es dauert noch bisschen, bis man ihn wieder sieht.
            </p>
          </div>
          <div className="friend-orca-summary">
            <p className="friend-orca-summary-label">Dein Freund</p>
            <p className="friend-orca-summary-name">{friendSummary}</p>
            <p className="friend-orca-summary-pod">{friendOrca.pod ?? "Unbekannte Gruppe"}</p>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <p className="label">Zurückgelegte Distanz</p>
            <p className="value">{traveledKm.toFixed(1)} km</p>
            <p className="subtle">sehr sehr grob geschätzt</p>
          </article>
          <article className="stat-card">
            <p className="label">Angezeigte Sightings</p>
            <p className="value">
              {shownPoints.length} / {points.length}
            </p>
            <p className="subtle">nach Timeline gefiltert</p>
          </article>
          <article className="stat-card">
            <p className="label">Confidence</p>
            <p className="value">
              {latestPoint ? `${(latestPoint.confidence * 100).toFixed(0)}%` : "—"}
            </p>
            <p className="subtle">
              {latestPoint
                ? new Date(latestPoint.observed_at).toLocaleString("de-DE")
                : "noch keine Daten"}
            </p>
          </article>
        </section>
        <section className="map-panel">
          <JourneyMap points={shownPoints} />
        </section>

        <section className="timeline-panel">
          <div className="timeline-header">
            <label htmlFor="playhead">Timeline</label>
            <button
              type="button"
              className="play-button"
              onClick={() => setPlaying((v) => !v)}
              disabled={points.length < 2}
            >
              {playing ? "Pause" : "Abspielen"}
            </button>
          </div>
          <input
            id="playhead"
            type="range"
            min={0}
            max={Math.max(points.length - 1, 0)}
            value={Math.min(playhead, Math.max(points.length - 1, 0))}
            onChange={(e) => setPlayhead(Number(e.target.value))}
          />
        </section>

        <article className="orca-profile-card" aria-labelledby="orca-profile-heading">
          <div className="orca-profile-media">
            <img
              src={orcaProfileImage}
              alt={orcaProfileImageAlt}
              className="orca-profile-image"
            />
          </div>
          <div className="orca-profile-body">
            <p className="label" id="orca-profile-heading">
              Mehr über deinen Orca
            </p>
            <h2 className="orca-profile-title">{friendOrca.display_name.split(" ")[0] + ' "' + initialJourney.friend_nickname + '" ' + friendOrca.display_name.split(" ")[1]}</h2>
            <div className="orca-profile-meta">
              <p className="orca-profile-pod">
                <span className="orca-profile-pod-label">Gruppe</span>{" "}
                {friendOrca.pod ?? "Unbekannt"}
              </p>
              <p className="orca-profile-matriline">
                <span className="orca-profile-pod-label">Matriline</span>{" "}
                {friendOrca.matriline?.trim() ? friendOrca.matriline : "—"}
              </p>
            </div>
            <p className="orca-profile-description">
              {friendOrca.description?.trim()
                ? friendOrca.description
                : "Für diesen Orca liegt noch keine Kurzbeschreibung vor."}
            </p>
          </div>
        </article>

        <footer className="app-page-footer">
          {resetError && (
            <p className="reset-friend-error" role="alert">
              {resetError}
            </p>
          )}
          <button
            type="button"
            className="footer-reset-link"
            disabled={resetting}
            onClick={() => setConfirmResetOpen(true)}
          >
            {resetting ? "Wird zurückgesetzt…" : "Zurücksetzen"}
          </button>
        </footer>
      </main>
    </>
  );
}
