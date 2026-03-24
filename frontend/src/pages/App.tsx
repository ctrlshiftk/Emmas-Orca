import { useEffect, useMemo, useState } from "react";

import { fetchJourney, fetchOrcas, setFriendOrca } from "../api/client";
import { JourneyMap } from "../components/map/JourneyMap";
import type { JourneyPoint, OrcaProfile } from "../types";
import "./App.css";

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

export function App() {
  const [orcas, setOrcas] = useState<OrcaProfile[]>([]);
  const [selectedOrca, setSelectedOrca] = useState<number | null>(null);
  const [points, setPoints] = useState<JourneyPoint[]>([]);
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      const available = await fetchOrcas();
      setOrcas(available);
      if (available.length > 0) {
        setSelectedOrca(available[0].id);
        await setFriendOrca(available[0].id);
        const journey = await fetchJourney();
        setPoints(journey.points);
      }
      setLoading(false);
    };
    boot().catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

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
  const activeOrca = useMemo(
    () => orcas.find((o) => o.id === selectedOrca) ?? null,
    [orcas, selectedOrca]
  );
  const latestPoint = shownPoints.length > 0 ? shownPoints[shownPoints.length - 1] : null;

  const onSelectOrca = async (id: number) => {
    setSelectedOrca(id);
    await setFriendOrca(id);
    const journey = await fetchJourney();
    setPoints(journey.points);
    setPlayhead(0);
  };

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

  return (
    <>
      <FloatingOrca />
      <main className="app-shell">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Emmas Orca</p>
            <h1>Track your pod journey</h1>
            <p className="muted">Explore sightings over time with a satellite map playback.</p>
          </div>
          <div className="control-group">
            <label htmlFor="friend-orca">Friend orca</label>
            <select
              id="friend-orca"
              value={selectedOrca ?? ""}
              onChange={(e) => onSelectOrca(Number(e.target.value))}
              disabled={loading || !orcas.length}
            >
              {orcas.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.display_name} ({o.pod ?? "Unknown pod"})
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <p className="label">Active profile</p>
            <p className="value">{activeOrca?.display_name ?? "—"}</p>
            <p className="subtle">{activeOrca?.pod ?? "Unknown pod"}</p>
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
      </main>
    </>
  );
}
