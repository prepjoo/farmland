// 우리 둘 만남 별자리: 우리 별땅 첫 화면의 부가 기능 (docs/changes.md 네·열 번째). 날짜 없이도 바로 쓸 수 있다.
// 두 사람 동네(시·군·구) 사이에 수호 카드 방향으로 별을 그리고, 꼭짓점 가까이의 공개 장소 3곳과 근처 음식점을 보여 준다.
import { lazy, Suspense, useEffect, useState } from 'react';
import { loadRegionIndex, loadFoodsNear, loadDecks } from '../lib/data.js';
import { buildMeet } from '../lib/runMeet.js';
import { nearbyFood } from '../engine/food.js';
import { cardBearing, bearingWord, guardianCardNumber } from '../engine/landCard.js';
import { kstDateString } from '../engine/kstDate.js';
import ChipGroup from './ChipGroup.jsx';

// 이동 범위: 형제 사이트 별지점의 이동 범위와 같은 단계(직선거리 기준, 실제 이동 시간이 아님)
export const MEET_RANGES = [
  { id: 'walk', name: '걸어서 (약 1.5km)', m: 1500 },
  { id: 'near', name: '가까운 곳 (약 6km)', m: 6000 },
  { id: 'mid', name: '조금 먼 곳 (약 15km)', m: 15000 },
  { id: 'day', name: '당일치기 (최대 60km)', m: 60000 },
];

const LandMap = lazy(() => import('./LandMap.jsx'));
const km = (m) => (m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`);

function SggPicker({ who, value, onChange, idx }) {
  const sggs = idx ? idx.sgg.filter((g) => g.sido === value.sido) : [];
  return (
    <fieldset className="field sgg-pick">
      <legend>{who} 동네</legend>
      <div className="selects">
        <label>
          <span className="sr">{who} 시·도</span>
          <select value={value.sido} onChange={(e) => onChange({ sido: e.target.value, sgg: '' })}>
            <option value="">시·도</option>
            {idx?.sido.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr">{who} 시·군·구</span>
          <select value={value.sgg} onChange={(e) => onChange({ ...value, sgg: e.target.value })} disabled={!value.sido}>
            <option value="">시·군·구</option>
            {sggs.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
          </select>
        </label>
      </div>
    </fieldset>
  );
}

function Foods({ place }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    let alive = true;
    loadFoodsNear(place, 12)
      .then((foods) => {
        let list = [], r = 0;
        for (r of [1500, 5000, 10000]) {
          list = nearbyFood({ foods, lat: place.lat, lon: place.lon, count: 2, maxDistanceM: r });
          if (list.length) break;
        }
        if (alive) setState({ list, r });
      })
      .catch(() => alive && setState({ list: [], r: 0 }));
    return () => { alive = false; };
  }, [place.id, place.lat, place.lon]);
  if (!state) return <p className="hint">근처 맛집을 찾는 중…</p>;
  if (!state.list.length) return <p className="hint">10km 안에 등록된 음식점·카페가 없어요.</p>;
  return (
    <ul className="food-list">
      {state.list.map((f) => (
        <li key={f.id}>
          <span>
            <b>{f.name}</b>{f.cafe && <span className="badge soft">카페</span>}
            <small>{place.name}에서 {km(f.distanceM)}</small>
          </span>
          <a className="btn small" href={`https://map.kakao.com/link/map/${encodeURIComponent(f.name)},${f.lat},${f.lon}`} target="_blank" rel="noopener noreferrer">지도</a>
        </li>
      ))}
    </ul>
  );
}

/** 실제 위치 관계를 줄여 그린 별(A·B·1·2·3, 둘레 순서로 1→3→5→2→4 잇기) */
function StarFigure({ m }) {
  const pts = m.same
    ? [{ ...m.A, id: 'A' }, ...m.spots.map((s) => ({ ...s.place, id: String(s.n) }))]
    : [{ ...m.A, id: 'A' }, { ...m.B, id: 'B' }, ...m.spots.map((s) => ({ ...s.place, id: String(s.n) }))];
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sc = 200 / Math.max(x1 - x0, y1 - y0, 1);
  const P = (p) => ({ X: 40 + (p.x - x0) * sc + (200 - (x1 - x0) * sc) / 2, Y: 40 + (y1 - p.y) * sc + (200 - (y1 - y0) * sc) / 2 });
  const ang = (p) => Math.atan2(p.x - m.center.x, p.y - m.center.y);
  const ring = [...pts].sort((a, b) => ang(a) - ang(b));
  const order = ring.length === 5 ? [0, 2, 4, 1, 3, 0] : [...ring.keys(), 0];
  const d = order.map((i, k) => { const q = P(ring[i]); return `${k ? 'L' : 'M'}${q.X.toFixed(1)} ${q.Y.toFixed(1)}`; }).join(' ');
  return (
    <svg viewBox="0 0 280 280" className="meet-star" role="img" aria-label={`만남 별자리: ${pts.map((p) => p.id).join(', ')}를 별 모양으로 이은 그림`}>
      <path d={d} className="ms-line" />
      {pts.map((p) => {
        const q = P(p);
        const home = p.id === 'A' || p.id === 'B';
        return (
          <g key={p.id}>
            <circle cx={q.X} cy={q.Y} r="13" className={home ? 'ms-home' : 'ms-spot'} />
            <text x={q.X} y={q.Y + 5} textAnchor="middle" className={home ? 'ms-t home' : 'ms-t'}>{p.id}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** digits: 우리 날 8자리(없으면 null). 수호 카드 방향으로 별을 그린다 */
export default function MeetSection({ digits }) {
  const [idx, setIdx] = useState(null);
  const [tarot, setTarot] = useState(null);
  const [range, setRange] = useState('near');
  useEffect(() => { loadDecks().then((d) => setTarot(d.tarot)).catch(() => {}); }, []);
  // 우리 날짜를 골랐으면 그 날, 아니면 오늘 날짜의 수호 카드 방향
  const fromToday = !digits;
  const gn = guardianCardNumber(digits || kstDateString().replaceAll('-', ''));
  const guardian = tarot?.cards.find((c) => c.n === gn) ?? { n: gn, name: '' };
  const rangeM = MEET_RANGES.find((r) => r.id === range).m;
  const [me, setMe] = useState({ sido: '', sgg: '' });
  const [you, setYou] = useState({ sido: '', sgg: '' });
  const [same, setSame] = useState(false);
  const [state, setState] = useState({ status: 'idle' });
  useEffect(() => { loadRegionIndex().then(setIdx).catch(() => {}); }, []);
  const bearing = cardBearing(guardian?.n ?? 0);
  const ready = me.sgg && (same || you.sgg);
  const nameOf = (r) => idx?.sgg.find((g) => g.code === r.sgg)?.name ?? '';

  async function go() {
    setState({ status: 'busy' });
    try {
      const m = await buildMeet({ me, you: same ? null : you, bearing, rangeM });
      setState({ status: m.spots.length ? 'ok' : 'none', m });
    } catch (e) {
      console.error(e);
      setState({ status: 'error' });
    }
  }

  const m = state.m;
  return (
    <article className="card meet-card" id="meet">
      <h2>우리 둘 만남 별자리 <small>데이트 장소 3곳 + 맛집</small></h2>
      <p>두 사람이 출발하는 동네만 고르면 돼요. {fromToday ? '오늘 날짜' : '우리 날'}의 수호 카드 <b>‘{guardian.name}’</b>의 방향인 <b>{bearingWord(bearing)}쪽</b>으로 별을 그려, 만날 장소 3곳과 근처 맛집을 골라 드려요. 별땅과 달리 이곳들은 <b>실제로 가 볼 수 있는 공개 장소</b>예요.</p>
      {fromToday && <p className="hint">위에서 우리의 날짜를 고르면 그 날의 카드 방향으로 바뀌어요(골라도 되고 안 골라도 돼요).</p>}
      <SggPicker who="나" value={me} onChange={setMe} idx={idx} />
      <label className="toggle">
        <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} />
        <span>같은 동네에 살아요(또는 상대 동네를 몰라요)<small>내 동네 둘레에서 세 곳을 찾아요.</small></span>
      </label>
      {!same && <SggPicker who="상대" value={you} onChange={setYou} idx={idx} />}
      <ChipGroup label="만날 장소까지 거리" options={MEET_RANGES} value={range} onChange={setRange} />
      <p className="hint">출발 지점에서 잰 직선거리예요(실제 이동 시간이 아니에요).</p>
      <button type="button" className="primary" disabled={!ready || state.status === 'busy'} onClick={go}>
        {state.status === 'busy' ? '별자리를 그리는 중…' : '만남 장소 3곳 찾기'}
      </button>
      <p className="hint">고른 동네는 이 화면에서만 쓰고 저장하거나 보내지 않아요.</p>

      {state.status === 'error' && <p className="warn" role="alert">별자리를 그리지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>}
      {state.status === 'none' && <p className="warn" role="status">근처에 등록된 공개 장소가 없어요. 다른 동네로 해 보세요.</p>}
      {state.status === 'ok' && (
        <div className="meet-result" aria-live="polite">
          <StarFigure m={m} />
          <ol className="meet-list">
            <li className="home"><b>A</b> 나: 내가 출발하는 지점</li>
            {!m.same && <li className="home"><b>B</b> 상대: 상대가 출발하는 지점</li>}
            {m.spots.map((s) => (
              <li key={s.n}>
                <b className="no">{s.n}</b>
                <div>
                  <span className="theme">{s.place.theme}</span>
                  <strong>{s.place.name}</strong>
                  {s.place.np && <span className="np-badge"><span className="np">{s.place.np}</span><span className="tag">계산값</span></span>}
                  <a className="btn small" href={`https://map.kakao.com/link/map/${encodeURIComponent(s.place.name)},${s.place.lat},${s.place.lon}`} target="_blank" rel="noopener noreferrer">지도</a>
                  <p className="food-title">근처 맛집·카페</p>
                  <Foods place={s.place} />
                </div>
              </li>
            ))}
          </ol>
          <Suspense fallback={<p className="loading">지도를 불러오는 중…</p>}>
            <LandMap
              fit
              points={[
                { id: 'A', lat: m.A.lat, lon: m.A.lon, label: 'A', title: `A 나: 내가 출발하는 지점 (${nameOf(me)})`, kind: 'cand' },
                ...(m.same ? [] : [{ id: 'B', lat: m.B.lat, lon: m.B.lon, label: 'B', title: `B 상대: 상대가 출발하는 지점 (${nameOf(you)})`, kind: 'cand' }]),
                ...m.spots.map((s) => ({ id: `s${s.n}`, lat: s.place.lat, lon: s.place.lon, label: String(s.n), title: `${s.n}. ${s.place.name}`, kind: 'mine' })),
              ]}
              ariaLabel="지도: 두 사람 동네(A·B)와 만남 장소 1·2·3. 같은 내용이 위 목록에 있어요."
            />
          </Suspense>
          {(m.outOfRange || m.dKm > 60) && <p className="hint">두 동네가 {Math.round(m.dKm)}km 떨어져 있어{m.outOfRange ? `, 고른 거리(${MEET_RANGES.find((r) => r.id === range).name})보다 먼 곳도 있어요.` : ' 만남 장소도 멀 수 있어요.'}</p>}
          <p className="hint">별 그림의 선은 상징이고 실제 길이 아니에요. 장소는 한국관광공사에 등록된 공개 장소이고, 음식점은 광고가 아니에요. 운영·영업 여부는 가기 전에 확인해 주세요.</p>
        </div>
      )}
    </article>
  );
}
