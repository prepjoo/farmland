// 작은 지도 (Leaflet + OpenStreetMap). 확대·축소 단추, 핀 이름표, 만남 별자리 선, 거리 원.
// 거리(rangeKm)를 바꾸면 그 원이 다 보이도록 지도 범위를 다시 맞춘다. 판매점 핀은 시·군·구 대표 지점이다(자료에 주소가 없음). 선은 실제 길이 아니다.
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

const pin = (cls, label = '') => L.divIcon({ className: `luck-pin ${cls}`, html: `<span>${label}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] });

function Fit({ points, center, rangeKm }) {
  const map = useMap();
  const key = `${points.map((p) => p.join(',')).join('|')}@${rangeKm ?? ''}`;
  useEffect(() => {
    const go = () => {
      map.invalidateSize();
      let b = L.latLngBounds(points);
      if (rangeKm && center) b = b.extend(L.latLng(center).toBounds(rangeKm * 2000));
      if (points.length === 1 && !rangeKm) map.setView(points[0], 13, { animate: false });
      else map.fitBounds(b, { padding: [24, 24], maxZoom: 15, animate: false });
    };
    go();
    const t = setTimeout(go, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/**
 * base: 기준점 {lat, lon} · items: 목적지 [{lat, lon, name?}] (번호 1·2·3) · people: [{lat, lon, label, title}] (A·B)
 * star: 별 선 [[lat, lon], …] · rangeKm: 기준점 둘레 거리 원
 */
export default function LuckyMap({ base, items, label, people, star, rangeKm, baseTitle = '기준점' }) {
  const starts = people ?? [{ ...base, title: baseTitle }];
  const points = [...starts.map((p) => [p.lat, p.lon]), ...items.map((p) => [p.lat, p.lon])];
  return (
    <div className="lucky-map">
      <p className="sr">지도: {label}</p>
      <MapContainer center={points[0]} zoom={11} minZoom={6} maxZoom={18} scrollWheelZoom={false} zoomControl style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" maxZoom={19} />
        {rangeKm && base && <Circle center={[base.lat, base.lon]} radius={rangeKm * 1000} pathOptions={{ color: '#1f2f55', weight: 1.5, dashArray: '5 6', fillOpacity: 0.05 }} />}
        {star && star.length > 2 && <Polyline positions={star} pathOptions={{ color: '#c9a24a', weight: 3, dashArray: '8 6' }} />}
        {starts.map((p, i) => (
          <Marker key={`s${i}`} position={[p.lat, p.lon]} icon={pin(p.label ? 'person' : 'base', p.label ?? '')} title={p.title}>
            {p.title && <Tooltip direction="top" offset={[0, -10]}>{p.title}</Tooltip>}
          </Marker>
        ))}
        {items.map((p, i) => (
          <Marker key={`${p.lat},${p.lon},${i}`} position={[p.lat, p.lon]} icon={pin('goal', String(i + 1))} title={p.name ? `${i + 1}. ${p.name}` : undefined}>
            {p.name && <Tooltip direction="top" offset={[0, -10]}>{`${i + 1}. ${p.name}`}</Tooltip>}
          </Marker>
        ))}
        <Fit points={points} center={base ? [base.lat, base.lon] : null} rangeKm={rangeKm} />
      </MapContainer>
    </div>
  );
}
