// 별땅 지도 (Leaflet + OpenStreetMap). 처음엔 전국이 보이고, 확대하면 동네·10m 칸까지 보인다.
import { MapContainer, TileLayer, Marker, Tooltip, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { utmkToWgs84 } from '../engine/nationalPoint.js';

const KOREA = [[33.0, 124.6], [38.7, 130.95]];

const icon = (label, cls) =>
  L.divIcon({
    className: `star-pin ${cls}`,
    html: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z"/></svg>${label ? `<b>${label}</b>` : ''}`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

/** 10m 칸 네 모서리 (UTM-K 칸 가운데 x, y에서 ±5m) */
function cellCorners({ x, y }) {
  return [[-5, -5], [5, -5], [5, 5], [-5, 5]].map(([dx, dy]) => utmkToWgs84(x + dx, y + dy));
}

function View({ points, focus, fit }) {
  const map = useMap();
  const key = `${points.map((p) => p.id).join('|')}@${focus?.id ?? ''}`;
  useEffect(() => {
    const go = () => {
      map.invalidateSize();
      if (focus) map.setView([focus.lat, focus.lon], 19);
      else if (fit && points.length > 1) map.fitBounds(points.map((p) => [p.lat, p.lon]), { padding: [36, 36] });
      else map.fitBounds(KOREA, { padding: [8, 8] });
    };
    map.whenReady(go);
    const t = setTimeout(go, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/**
 * points: [{ id, lat, lon, x?, y?, label, title, kind: 'cand'|'rec'|'mine'|'other' }]
 * focus: 확대해 보여 줄 점 (없으면 전국)
 */
export default function LandMap({ points, focus = null, fit = false, onSelect, ariaLabel }) {
  return (
    <div className="map-wrap land-map" role="region" aria-label={ariaLabel}>
      <MapContainer center={[36.2, 127.8]} zoom={6} minZoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자'
          maxZoom={19}
        />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lon]}
            icon={icon(p.label, p.kind)}
            title={p.title}
            alt={p.title}
            eventHandlers={onSelect ? { click: () => onSelect(p.id) } : undefined}
          >
            <Tooltip direction="top" offset={[0, -14]}>{p.title}</Tooltip>
          </Marker>
        ))}
        {focus?.x != null && (
          <Polygon positions={cellCorners(focus)} pathOptions={{ color: '#1f6a43', weight: 3, fillColor: '#34c3b0', fillOpacity: 0.35 }}>
            <Tooltip permanent direction="top" offset={[0, -6]} className="cell-label">10m × 10m · 약 30평 (기념 표시)</Tooltip>
          </Polygon>
        )}
        <View points={points} focus={focus} fit={fit} />
      </MapContainer>
    </div>
  );
}
