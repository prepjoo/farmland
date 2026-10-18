// 국가지점번호 구역 지도: 기준점에서 100km마다 가·나·다… 글자를 붙인 격자 위에 우리나라 윤곽을 그린다.
// 윤곽은 행정구역 경계(land.json)를 UTM-K로 바꿔 그린 것이라 실제 구역과 위치가 맞는다.
// 오른쪽(아래) 확대 그림은 고른 예시가 구역 안에서 어디인지 보여 준다.
import { useEffect, useState } from 'react';
import { wgs84ToUtmk } from '../engine/nationalPoint.js';

const L = ['가', '나', '다', '라', '마', '바', '사', '아'];
const X0 = 700000, Y0 = 1300000, Z = 100000;
const COLS = 7, ROWS = 8;
const CELL = 64, LEFT = 44, TOP = 16;
const W = LEFT + COLS * CELL + 16, H = TOP + ROWS * CELL + 56;
const px = (x) => LEFT + ((x - X0) / Z) * CELL;
const py = (y) => TOP + ROWS * CELL - ((y - Y0) / Z) * CELL;

let outlineCache = null;
async function loadOutline() {
  if (!outlineCache) {
    outlineCache = fetch(`${import.meta.env.BASE_URL}data/regions/land.json`)
      .then((r) => r.json())
      .then((fc) => {
        const parts = [];
        for (const f of fc.features) {
          const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
          for (const poly of polys) {
            const ring = poly[0];
            if (ring.length < 4) continue;
            parts.push(ring.map(([lon, lat], i) => { const [x, y] = wgs84ToUtmk(lat, lon); return `${i ? 'L' : 'M'}${px(x).toFixed(1)} ${py(y).toFixed(1)}`; }).join('') + 'Z');
          }
        }
        return parts.join('');
      });
  }
  return outlineCache;
}

/** np: { zone, east, north }, lat·lon: 예시 위치, name: 예시 이름 */
export default function ZoneMap({ np, lat, lon, name }) {
  const [outline, setOutline] = useState('');
  useEffect(() => {
    let live = true;
    loadOutline().then((d) => live && setOutline(d)).catch(() => {});
    return () => { live = false; };
  }, []);
  const xi = L.indexOf(np.zone[0]), yi = L.indexOf(np.zone[1]);
  const [ux, uy] = wgs84ToUtmk(lat, lon);
  const e = Number(np.east), n = Number(np.north);
  // 확대 그림: 한 구역(100km)을 240칸 크기로
  const S = 240, IX = 52, IY = 20;
  const qx = IX + (e / 10000) * S, qy = IY + S - (n / 10000) * S;
  return (
    <div className="zone-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`국가지점번호 구역 지도. 왼쪽 아래 기준점에서 동쪽으로 가·나·다…, 북쪽으로 가·나·다… 100km마다 글자가 붙어요. ${name}은(는) ${np.zone} 구역이에요.`}>
        <rect x={LEFT} y={TOP} width={COLS * CELL} height={ROWS * CELL} className="zm-sea" />
        <path d={outline} className="zm-land" />
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const here = c === xi && r === yi;
            return (
              <g key={`${c}-${r}`}>
                <rect x={LEFT + c * CELL} y={TOP + (ROWS - 1 - r) * CELL} width={CELL} height={CELL} className={here ? 'zm-cell here' : 'zm-cell'} />
                <text x={LEFT + c * CELL + 5} y={TOP + (ROWS - 1 - r) * CELL + 15} className={here ? 'zm-name here' : 'zm-name'}>{L[c]}{L[r]}</text>
              </g>
            );
          }),
        )}
        {L.slice(0, COLS).map((t, c) => <text key={t} x={LEFT + c * CELL + CELL / 2} y={TOP + ROWS * CELL + 20} className="zm-axis" textAnchor="middle">{t}</text>)}
        {L.slice(0, ROWS).map((t, r) => <text key={t} x={LEFT - 14} y={TOP + (ROWS - 1 - r) * CELL + CELL / 2 + 6} className="zm-axis" textAnchor="middle">{t}</text>)}
        <text x={LEFT + COLS * CELL} y={TOP + ROWS * CELL + 44} className="zm-note" textAnchor="end">동쪽으로 100km마다 →</text>
        <text x={8} y={TOP + 10} className="zm-note">↑ 북쪽</text>
        <circle cx={LEFT} cy={TOP + ROWS * CELL} r="7" className="zm-origin" />
        <text x={LEFT + 12} y={TOP + ROWS * CELL + 44} className="zm-origin-label">● 기준점(가가 구역의 남서쪽 모서리)</text>
        <circle cx={px(ux)} cy={py(uy)} r="5" className="zm-dot" />
      </svg>

      <svg viewBox="0 0 320 300" role="img" aria-label={`${np.zone} 구역 확대: 구역 서쪽 경계에서 동쪽으로 ${(e / 100).toFixed(2)}km(${np.east}), 남쪽 경계에서 북쪽으로 ${(n / 100).toFixed(2)}km(${np.north})인 10m 칸이 ${np.zone} ${np.east} ${np.north}이에요.`}>
        <rect x={IX} y={IY} width={S} height={S} className="zm-zoom" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <line x1={IX + ((i + 1) * S) / 10} y1={IY} x2={IX + ((i + 1) * S) / 10} y2={IY + S} className="zm-grid" />
            <line x1={IX} y1={IY + ((i + 1) * S) / 10} x2={IX + S} y2={IY + ((i + 1) * S) / 10} className="zm-grid" />
          </g>
        ))}
        <text x={IX + 6} y={IY + 18} className="zm-name here">{np.zone} 구역 (100km × 100km)</text>
        <line x1={IX} y1={qy} x2={qx} y2={qy} className="zm-guide" />
        <line x1={qx} y1={qy} x2={qx} y2={IY + S} className="zm-guide" />
        <rect x={qx - 6} y={qy - 6} width="12" height="12" className="zm-target" />
        <text x={qx} y={IY + S + 20} textAnchor="middle" className="zm-num">{np.east}</text>
        <text x={IX - 6} y={qy + 5} textAnchor="end" className="zm-num">{np.north}</text>
        <text x={IX + S / 2} y={IY + S + 40} textAnchor="middle" className="zm-note">서쪽 경계에서 동쪽으로 {(e / 100).toFixed(2)}km</text>
        <text x={Math.min(qx + 10, IX + S - 4)} y={qy - 10} textAnchor={qx > IX + S - 90 ? 'end' : 'start'} className="zm-target-label">{np.zone} {np.east} {np.north}</text>
      </svg>
      <ol className="zm-steps">
        <li><b>기준점</b>에서 동쪽으로 100km마다 첫 글자(가·나·다…), 북쪽으로 100km마다 둘째 글자를 붙여요. {name}은(는) 동쪽 {xi + 1}번째·북쪽 {yi + 1}번째 칸이라 <b>{np.zone}</b>예요.</li>
        <li>그 구역의 서쪽 경계에서 동쪽으로 몇 m인지를 10m 단위로 센 값이 앞 숫자 <b>{np.east}</b>, 남쪽 경계에서 북쪽으로 센 값이 뒤 숫자 <b>{np.north}</b>예요.</li>
        <li>그래서 <b>{np.zone} {np.east} {np.north}</b>는 가로세로 10m 칸 하나를 가리켜요. (위치는 계산값)</li>
      </ol>
    </div>
  );
}
