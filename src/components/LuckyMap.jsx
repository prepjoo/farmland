// 행운 장소 작은 지도 (Leaflet + OpenStreetMap). 기준점(있으면)과 행운 장소 시·군·구 대표 지점을 잇는다.
// 핀은 시·군·구 대표 지점에 놓는다. 판매점의 정확한 위치가 아니다(자료에 주소가 없음).
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const pin = (cls) => L.divIcon({ className: `luck-pin ${cls}`, html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] });

function Fit({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 10);
    else map.fitBounds(points, { padding: [28, 28], maxZoom: 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function LuckyMap({ base, place, label }) {
  const target = [place.lat, place.lon];
  const points = base ? [[base.lat, base.lon], target] : [target];
  return (
    <div className="lucky-map">
      <p className="sr">지도: {label}</p>
      <MapContainer center={target} zoom={9} scrollWheelZoom={false} attributionControl zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
        {base && <Marker position={[base.lat, base.lon]} icon={pin('base')} />}
        <Marker position={target} icon={pin('goal')} />
        {base && <Polyline positions={points} pathOptions={{ color: '#1F2F55', weight: 2, dashArray: '6 6' }} />}
        <Fit points={points} />
      </MapContainer>
    </div>
  );
}
