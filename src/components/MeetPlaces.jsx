// 두 사람 만남 별자리 (행복 ‘추천장소’, 2026-10-19 사용자 요청: 별땅 방식으로)
// 1) 나 = 현재 위치 또는 고른 동네, 상대 = 시·도→시·군·구→읍·면·동(선택)의 대표 지점 (같은 동네면 나 둘레에서)
// 2) 두 출발점을 변·대각선으로 하는 정오각형 4개 중 오늘 카드 방향에 가장 가까운 별 → 빈 꼭짓점 3개 가까이의 공개 장소(TourAPI) = 만남 장소 1·2·3
// 3) 장소를 고르면 두 사람의 거리, 길찾기, 상대에게 보내기, 근처 맛집·카페. 위치·동네는 화면 메모리에만.
import { useEffect, useState } from 'react';
import LuckyMap from './LuckyMap.jsx';
import RegionPicker from './RegionPicker.jsx';
import NationalPointBadge from './NationalPointBadge.jsx';
import { DistanceChips } from './MeaningPicker.jsx';
import { RouteLink } from './RouteTools.jsx';
import { kakaoRouteUrl, kakaoFromToUrl } from '../engine/route.js';
import { nearbyFood } from '../engine/food.js';
import { distanceM } from '../engine/geo.js';
import { bearingWord, cardBearing } from '../engine/landCard.js';
import { buildMeet, anchorOfRegion, pointFromLatLon } from '../lib/runMeet.js';
import { loadFoodsNear } from '../lib/data.js';
import { useMyPosition } from '../lib/useMyPosition.js';

const EMPTY = { sido: '', sgg: '', dong: '', label: '' };
const kmText = (m) => (m < 1000 ? `${Math.max(100, Math.round(m / 100) * 100)}m` : `${(m / 1000).toFixed(1)}km`);

/** 실제 위치 관계를 줄여 그린 별(A·B·1·2·3, 별땅과 같이 1→3→5→2→4 잇기) */
function StarFigure({ m }) {
  const pts = m.starPts;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sc = 200 / Math.max(x1 - x0, y1 - y0, 1);
  const P = (p) => ({ X: 40 + (p.x - x0) * sc + (200 - (x1 - x0) * sc) / 2, Y: 40 + (y1 - p.y) * sc + (200 - (y1 - y0) * sc) / 2 });
  const byId = Object.fromEntries(pts.map((p) => [p.id, p]));
  const d = m.starIds.map((id, k) => { const q = P(byId[id]); return `${k ? 'L' : 'M'}${q.X.toFixed(1)} ${q.Y.toFixed(1)}`; }).join(' ');
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
        if (alive) setState({ list });
      })
      .catch(() => alive && setState({ list: [] }));
    return () => { alive = false; };
  }, [place.id, place.lat, place.lon]);
  if (!state) return <p className="tiny muted">근처 맛집을 찾는 중…</p>;
  if (!state.list.length) return <p className="tiny muted">10km 안에 등록된 음식점·카페가 없어요.</p>;
  return (
    <ul className="fl-food-list">
      {state.list.map((f) => (
        <li key={f.id}>
          <span><b>{f.name}</b>{f.cafe ? ' · 카페' : ''} <small className="muted">{place.name}에서 {kmText(f.distanceM)}</small></span>
          <RouteLink href={kakaoRouteUrl(f)} name={f.name} />
        </li>
      ))}
    </ul>
  );
}

/** cardNo: 오늘 카드 번호(0~21, 별의 방향), cardName: 화면에 쓸 이름, cardWhy: 그 카드의 출처 설명 */
export default function MeetPlaces({ cardNo, cardName, cardWhy }) {
  const pos = useMyPosition();
  const [meMode, setMeMode] = useState('here');
  const [meRegion, setMeRegion] = useState(EMPTY);
  const [you, setYou] = useState(EMPTY);
  const [same, setSame] = useState(false);
  const [range, setRange] = useState(6);
  const [state, setState] = useState({ status: 'idle' });
  const [picked, setPicked] = useState(null);
  const [sent, setSent] = useState('');
  const bearing = cardBearing(cardNo);

  const meReady = meMode === 'here' ? pos.status === 'found' : Boolean(meRegion.sgg);
  const ready = meReady && (same || you.sgg);
  useEffect(() => { setState({ status: 'idle' }); setPicked(null); }, [meMode, pos.me, meRegion.sgg, meRegion.dong, you.sgg, you.dong, same, range, cardNo]);

  async function go() {
    setState({ status: 'busy' });
    try {
      const A = meMode === 'here' ? pointFromLatLon(pos.me) : await anchorOfRegion(meRegion);
      const B = same ? A : await anchorOfRegion(you);
      const m = await buildMeet({ A, B, bearing, rangeM: range * 1000 });
      setState({ status: m.spots.length ? 'ok' : 'none', m });
    } catch {
      setState({ status: 'error' });
    }
  }

  async function sendTo(p, m) {
    const fromB = !m.same && kakaoFromToUrl({ name: '상대 출발', lat: m.B.lat, lon: m.B.lon }, p);
    const text = `귀땅 만남 장소: ${p.name}\n카카오맵 길찾기: ${fromB || kakaoRouteUrl(p)}`;
    try {
      if (navigator.share) await navigator.share({ title: '우리 만남 장소', text });
      else await navigator.clipboard.writeText(text);
      setSent(p.id);
    } catch (e) {
      if (e?.name !== 'AbortError') setSent('');
    }
  }

  const m = state.m;
  const meTitle = meMode === 'here' ? 'A 나: 지금 있는 곳' : `A 나: ${meRegion.label} 대표 지점`;
  const youTitle = `B 상대: ${you.label} 대표 지점`;
  return (
    <div className="meet">
      <p>두 사람이 출발하는 곳을 정하면, 오늘의 카드 <b>‘{cardName}’</b>의 방향인 <b>{bearingWord(bearing)}쪽</b>으로 별을 그려 별 꼭짓점 가까이의 만남 장소 3곳을 골라 드려요. <span className="tiny muted">{cardWhy}</span></p>
      <ol className="how-to tiny">
        <li>나는 지금 있는 곳 또는 동네를, 상대는 동네(읍·면·동까지 고르면 더 정확)를 정해요.</li>
        <li>만날 장소까지 거리를 고르고 [만남 별자리 그리기]를 누르면 별과 장소 3곳이 나와요.</li>
        <li>장소를 고르면 두 사람의 거리와 길찾기, 근처 맛집을 볼 수 있어요.</li>
      </ol>

      <div className="meet-who">
        <div className="meet-person">
          <p className="meet-label">A 나</p>
          <div className="chips small" role="radiogroup" aria-label="내 출발 지점">
            {[['here', '지금 있는 곳'], ['region', '동네 고르기']].map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={meMode === k} className={meMode === k ? 'on' : ''} onClick={() => setMeMode(k)}>{l}</button>
            ))}
          </div>
          {meMode === 'here' && (
            <>
              {pos.status !== 'found' && (
                <button type="button" className="ghost small" onClick={pos.locate} disabled={pos.status === 'finding'}>
                  {pos.status === 'finding' ? '위치 찾는 중…' : '내 위치 찾기'}
                </button>
              )}
              {pos.status === 'found' && <p className="tiny">현재 위치를 찾았어요{pos.me.accuracy > 100 ? ` (오차 약 ${Math.round(pos.me.accuracy)}m라 넓어요. 동네 고르기가 더 정확할 수 있어요)` : ''}. <button type="button" className="link-btn" onClick={pos.forget}>지우기</button></p>}
              {pos.status === 'error' && <p className="tiny warn-soft" role="alert">{pos.message} 동네 고르기로 정할 수도 있어요.</p>}
              {pos.status === 'idle' && <p className="tiny muted">누를 때만 위치를 찾아요. 이 화면에서만 쓰고 저장하거나 보내지 않아요.</p>}
            </>
          )}
          {meMode === 'region' && <RegionPicker who="나" value={meRegion} onChange={setMeRegion} />}
        </div>
        <div className="meet-person">
          <p className="meet-label">B 상대</p>
          <label className="toggle tiny">
            <input type="checkbox" checked={same} onChange={(e) => setSame(e.target.checked)} />
            <span>같은 동네에 있어요(또는 상대 동네를 몰라요) — 내 둘레에서 세 곳을 찾아요</span>
          </label>
          {!same && <RegionPicker who="상대" value={you} onChange={setYou} />}
          <p className="tiny muted">상대는 고른 동네의 대표 지점에서 출발한다고 보고 계산해요. 고른 동네는 저장하지 않아요.</p>
        </div>
      </div>

      <p className="tiny muted" id="meet-range">만날 장소까지 거리 (출발 지점에서 잰 직선거리)</p>
      <DistanceChips value={range} onChange={setRange} />
      <button type="button" className="cta" disabled={!ready || state.status === 'busy'} onClick={go}>{state.status === 'busy' ? '별자리를 그리는 중…' : '만남 별자리 그리기'}</button>
      {!ready && <p className="tiny muted">나와 상대의 출발 지점을 정하면 누를 수 있어요.</p>}

      {state.status === 'error' && <p className="warn" role="alert">별자리를 그리지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>}
      {state.status === 'none' && <p className="warn" role="status">별 꼭짓점 근처에 등록된 공개 장소가 없어요. 거리를 바꾸거나 다른 동네로 해 보세요.</p>}
      {state.status === 'ok' && (
        <div className="meet-result" aria-live="polite">
          <StarFigure m={m} />
          <ol className="fl-meet-list">
            <li className="is-start"><b className="no start">A</b> {meTitle.replace('A ', '')}</li>
            {!m.same && <li className="is-start"><b className="no start">B</b> {youTitle.replace('B ', '')}</li>}
            {m.spots.map((s) => {
              const p = s.place;
              const dA = distanceM(m.A.lat, m.A.lon, p.lat, p.lon);
              const dB = distanceM(m.B.lat, m.B.lon, p.lat, p.lon);
              const open = picked === p.id;
              return (
                <li key={s.n} className={open ? 'open' : ''}>
                  <b className="no">{s.n}</b>
                  <div>
                    <span className="muted tiny">{p.theme}</span>
                    <strong>{p.name}</strong> {p.np && <NationalPointBadge np={{ text: p.np }} />}
                    <div className="route-row">
                      <span className="from-me-km">나에게서 약 {kmText(dA)}</span>
                      {!m.same && <span className="from-me-km partner">상대에게서 약 {kmText(dB)}</span>}
                    </div>
                    <button type="button" className="ghost small" aria-expanded={open} onClick={() => setPicked(open ? null : p.id)}>{open ? '접기' : '이 장소 고르기'}</button>
                    {open && (
                      <div className="start-box">
                        <div className="route-row">
                          <RouteLink href={meMode === 'region' ? kakaoFromToUrl({ name: '내 출발', lat: m.A.lat, lon: m.A.lon }, p) : kakaoRouteUrl(p)} name={`나: ${p.name}`} />
                          <span className="tiny muted">나 → {p.name}</span>
                        </div>
                        {!m.same && (
                          <div className="route-row">
                            <RouteLink href={kakaoFromToUrl({ name: '상대 출발', lat: m.B.lat, lon: m.B.lon }, p)} name={`상대: ${p.name}`} />
                            <span className="tiny muted">상대 동네({you.label}) → {p.name}</span>
                          </div>
                        )}
                        <button type="button" className="link-btn" onClick={() => sendTo(p, m)}>{sent === p.id ? '보낼 준비 완료' : '상대에게 보내기'}</button>
                        <p className="food-title tiny"><b>근처 맛집·카페</b></p>
                        <Foods place={p} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <LuckyMap items={m.spots.map((s) => s.place)} star={m.starLine}
            people={[{ lat: m.A.lat, lon: m.A.lon, label: 'A', title: meTitle }, ...(m.same ? [] : [{ lat: m.B.lat, lon: m.B.lon, label: 'B', title: youTitle }])]}
            label="만남 별자리: 두 사람 출발 지점(A·B)과 만남 장소 1·2·3, 별 모양 선. 같은 내용이 위 목록에 있어요." />
          {(m.outOfRange || m.dKm > 60) && <p className="tiny warn-soft">두 출발 지점이 {Math.round(m.dKm)}km 떨어져 있어{m.outOfRange ? ' 고른 거리보다 먼 곳도 있어요.' : ' 만남 장소도 멀 수 있어요.'}</p>}
          <p className="tiny muted">별 그림과 지도의 선은 상징이고 실제 길이 아니에요. 장소는 한국관광공사 TourAPI의 공개 장소이고, 음식점은 광고가 아니에요. 운영·영업 여부는 가기 전에 확인하세요. 길찾기를 누르면 장소 위치와 출발 지점(동네를 골랐다면 그 대표 지점) 좌표가 카카오맵으로 가요. 내 현재 위치는 넣지 않아요.</p>
        </div>
      )}
    </div>
  );
}
