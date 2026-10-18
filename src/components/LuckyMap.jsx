// 고른 곳(기준점)과 추천 장소들을 보여 주는 작은 지도 (Leaflet + OpenStreetMap).
// 판매점 핀은 시·군·구 대표 지점이다(자료에 주소가 없음). 선은 실제 길이 아니다.
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const pin = (cls, label = '') => L.divIcon({ className: `luck-pin ${cls}`, html: `<span>${label}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] });

function Fit({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 12);
    else map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function LuckyMap({ base, items, label }) {
  const points = [[base.lat, base.lon], ...items.map((p) => [p.lat, p.lon])];
  return (
    <div className="lucky-map">
      <p className="sr">지도: {label}</p>
      <MapContainer center={points[0]} zoom={11} scrollWheelZoom={false} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        <Marker position={points[0]} icon={pin('base')} />
        {items.map((p, i) => <Marker key={`${p.lat},${p.lon},${i}`} position={[p.lat, p.lon]} icon={pin('goal', String(i + 1))} />)}
        <Fit points={points} />
      </MapContainer>
    </div>
  );
}
