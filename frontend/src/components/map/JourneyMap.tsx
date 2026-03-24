import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import type { JourneyPoint } from "../../types";

type Props = {
  points: JourneyPoint[];
};

export function JourneyMap({ points }: Props) {
  const center: [number, number] = points.length
    ? [points[points.length - 1].lat, points[points.length - 1].lng]
    : [48.546, -123.03];

  const line = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {line.length > 1 && <Polyline positions={line} pathOptions={{ color: "#78d4ff", weight: 4 }} />}
      {points.map((p, i) => (
        <Marker key={`${p.observed_at}-${i}`} position={[p.lat, p.lng]}>
          <Popup>
            {new Date(p.observed_at).toLocaleString()} | confidence {(p.confidence * 100).toFixed(0)}%
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
