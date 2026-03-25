import L from "leaflet";
import { MapContainer, Marker, Pane, Polyline, Popup, TileLayer } from "react-leaflet";
import type { JourneyPoint } from "../../types";
import "./JourneyMap.css";

type Props = {
  points: JourneyPoint[];
};

const headMarkerIcon = L.divIcon({
  className: "journey-head-marker",
  html: '<span class="journey-head-dot-inner" aria-hidden="true"></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export function JourneyMap({ points }: Props) {
  const center: [number, number] = points.length
    ? [points[points.length - 1].lat, points[points.length - 1].lng]
    : [48.546, -123.03];

  const segments = points.slice(1).map((point, i) => {
    const prev = points[i];
    return {
      key: `${prev.observed_at}-${point.observed_at}-${i}`,
      positions: [
        [prev.lat, prev.lng],
        [point.lat, point.lng],
      ] as [number, number][],
      index: i,
    };
  });
  const latest = points.length ? points[points.length - 1] : null;

  return (
    <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='Kacheln &copy; Esri — Quelle: Esri, Maxar, Earthstar Geographics'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {segments.map((segment) => {
        const t = segments.length <= 1 ? 1 : segment.index / (segments.length - 1);
        // Narrower, softer range: older stays readable, newest stays restrained
        const opacity = 0.5 + t * 0.22;
        const weight = 2.25 + t * 1.25;
        const lightness = 66 - t * 10;
        const color = `hsl(${200 - t * 12} 72% ${lightness}%)`;
        return (
          <Polyline
            key={segment.key}
            positions={segment.positions}
            pathOptions={{ color, opacity, weight, lineCap: "round", lineJoin: "round" }}
          />
        );
      })}
      {latest && (
        <Pane name="journeyHead" style={{ zIndex: 620 }}>
          <Marker position={[latest.lat, latest.lng]} icon={headMarkerIcon}>
            <Popup>
              {new Date(latest.observed_at).toLocaleString("de-DE")} · Verlässlichkeit{" "}
              {(latest.confidence * 100).toFixed(0)}&nbsp;%
            </Popup>
          </Marker>
        </Pane>
      )}
    </MapContainer>
  );
}
