import { useEffect, useMemo, useState } from "react";

import { JourneyMap } from "../components/map/JourneyMap";
import type { JourneyPoint, JourneyResponse } from "../types";

type AppProps = {
  initialJourney: JourneyResponse;
  onResetFriendChoice: () => Promise<void>;
};

const ORCA_GIF_URL = "/orca-floating.png";

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
      alt="Floating orca"
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
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const friendOrca = initialJourney.orca;

  useEffect(() => {
    setPoints(initialJourney.points);
    setPlayhead(0);
    setPlaying(false);
  }, [initialJourney]);

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
      setResetError("Could not reset your choice. Try again.");
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
              Reset friend orca?
            </h2>
            <p className="confirm-dialog-body">
              You’ll return to the welcome screen and can pick a different orca. This clears your current
              choice on the server.
            </p>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="confirm-dialog-btn confirm-dialog-btn-secondary"
                disabled={resetting}
                onClick={() => setConfirmResetOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-dialog-btn confirm-dialog-btn-danger"
                disabled={resetting}
                onClick={() => void handleConfirmReset()}
              >
                Reset choice
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="app-shell">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Emmas Orca</p>
            <h1>Track your pod journey</h1>
            <p className="muted">Explore sightings over time with a satellite map playback.</p>
            <p className="muted subtle-footnote">
              Your friend orca was set when you first opened the site—it stays the same on every device.
            </p>
          </div>
          <div className="friend-orca-summary">
            <p className="friend-orca-summary-label">Your friend orca</p>
            <p className="friend-orca-summary-name">{friendOrca.display_name}</p>
            <p className="friend-orca-summary-pod">{friendOrca.pod ?? "Unknown pod"}</p>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <p className="label">Active profile</p>
            <p className="value">{friendOrca.display_name}</p>
            <p className="subtle">{friendOrca.pod ?? "Unknown pod"}</p>
          </article>
          <article className="stat-card">
            <p className="label">Sightings shown</p>
            <p className="value">
              {shownPoints.length} / {points.length}
            </p>
            <p className="subtle">timeline-filtered points</p>
          </article>
          <article className="stat-card">
            <p className="label">Distance traveled</p>
            <p className="value">{traveledKm.toFixed(1)} km</p>
            <p className="subtle">estimated route length</p>
          </article>
          <article className="stat-card">
            <p className="label">Latest confidence</p>
            <p className="value">
              {latestPoint ? `${(latestPoint.confidence * 100).toFixed(0)}%` : "—"}
            </p>
            <p className="subtle">
              {latestPoint ? new Date(latestPoint.observed_at).toLocaleString() : "no data yet"}
            </p>
          </article>
        </section>

        <section className="map-panel">
          <JourneyMap points={shownPoints} />
        </section>

        <section className="timeline-panel">
          <div className="timeline-header">
            <label htmlFor="playhead">Timeline playback</label>
            <button
              type="button"
              className="play-button"
              onClick={() => setPlaying((v) => !v)}
              disabled={points.length < 2}
            >
              {playing ? "Pause" : "Play"}
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
            {resetting ? "Resetting…" : "Change friend orca"}
          </button>
        </footer>
      </main>
    </>
  );
}
