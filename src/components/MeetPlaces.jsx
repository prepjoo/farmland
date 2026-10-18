// 두 사람 만남 장소 3곳 (‘우리 어디?’ · 행복 ‘추천장소’에서 같이 쓴다, docs/spec.md 8장)
// 나 = [내 위치 찾기]를 눌렀을 때의 현재 위치(화면 메모리에만), 상대 = 시·도 → 시·군·구를 고르면 그 대표 지점.
// 장소는 한국관광공사 TourAPI 공개 장소·음식점·카페. 길찾기는 카카오맵에 목적지만 넘긴다.
import { useEffect, useMemo, useState } from 'react';
import LuckyMap from './LuckyMap.jsx';
import { RouteLink } from './RouteTools.jsx';
import { meetPlaces, midpoint } from '../engine/meet.js';
import { kakaoRouteUrl } from '../engine/route.js';
import { loadAnchors } from '../lib/luck.js';
import { loadPlacesNear, loadFoodsNear } from '../lib/data.js';
import { useMyPosition } from '../lib/useMyPosition.js';

const KINDS = [
  { id: 'place', label: '관광지' },
  { id: 'food', label: '맛집' },
  { id: 'cafe', label: '카페' },
];
const kmText = (km) => (km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)}m` : `${km.toFixed(1)}km`);

export default function MeetPlaces({ idPrefix = 'meet' }) {
  const pos = useMyPosition();
  const [anchors, setAnchors] = useState(undefined);
  const [sido, setSido] = useState('');
  const [sgg, setSgg] = useState('');
  const [kind, setKind] = useState('place');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState('');

  useEffect(() => { loadAnchors().then(setAnchors); }, []);
  const sidos = useMemo(() => {
    if (!anchors) return [];
    const m = new Map();
    Object.values(anchors).forEach((a) => m.set(a.sido, a.sidoName));
    return [...m.entries()].sort((x, y) => x[0].localeCompare(y[0]));
  }, [anchors]);
  const sggs = useMemo(() => (anchors && sido ? Object.entries(anchors).filter(([, a]) => a.sido === sido).sort((x, y) => x[1].name.localeCompare(y[1].name, 'ko')) : []), [anchors, sido]);
  const partner = sgg && anchors ? { ...anchors[sgg], code: sgg } : null;
  const me = pos.me;

  useEffect(() => { setResult(null); }, [me, sgg, kind]);

  async function find() {
    if (!me || !partner) return;
    setBusy(true);
    try {
      const mid = midpoint(me, partner);
      const gap = meetPlaces({ a: me, b: partner, places: [] }).gapKm;
      const radius = Math.min(80, Math.max(10, gap / 2 + 10));
      let pool;
      if (kind === 'place') pool = await loadPlacesNear([mid], radius);
      else pool = (await loadFoodsNear(mid, radius)).filter((f) => (kind === 'cafe' ? f.cafe : !f.cafe));
      setResult(meetPlaces({ a: me, b: partner, places: pool }));
    } catch {
      setResult({ items: [], error: true });
    } finally {
      setBusy(false);
    }
  }

  async function sendTo(p) {
    const text = `귀땅 만남 장소: ${p.name}\n카카오맵 길찾기: ${kakaoRouteUrl(p)}`;
    try {
      if (navigator.share) { await navigator.share({ title: '우리 만남 장소', text }); setShared(p.id); return; }
      await navigator.clipboard.writeText(text);
      setShared(p.id);
    } catch (e) {
      if (e?.name !== 'AbortError') setShared('');
    }
  }

  return (
    <div className="meet">
      <ol className="how-to tiny">
        <li>내 위치를 찾고, 상대가 있는 동네를 골라요.</li>
        <li>관광지·맛집·카페 중 하나를 고르면 두 사람 사이의 만남 장소 3곳이 나와요.</li>
        <li>장소마다 두 사람의 거리를 보고, 길찾기를 할 수 있어요.</li>
      </ol>

      <div className="meet-who">
        <div className="meet-person">
          <p className="meet-label">나</p>
          {pos.status !== 'found' && (
            <button type="button" className="ghost small" onClick={pos.locate} disabled={pos.status === 'finding'}>
              {pos.status === 'finding' ? '위치 찾는 중…' : '내 위치 찾기'}
            </button>
          )}
          {pos.status === 'found' && <p className="tiny">현재 위치를 찾았어요{pos.me.accuracy > 100 ? ` (오차 약 ${Math.round(pos.me.accuracy)}m)` : ''}. <button type="button" className="link-btn" onClick={pos.forget}>지우기</button></p>}
          {pos.status === 'error' && <p className="tiny warn-soft" role="alert">{pos.message}</p>}
          {pos.status === 'idle' && <p className="tiny muted">누를 때만 위치를 찾아요. 이 화면에서 거리 계산에만 쓰고 저장하거나 보내지 않아요.</p>}
        </div>
        <div className="meet-person">
          <p className="meet-label" id={`${idPrefix}-partner`}>상대</p>
          {anchors === null && <p className="tiny">동네 자료를 불러오지 못했어요.</p>}
          <div className="row" role="group" aria-labelledby={`${idPrefix}-partner`}>
            <select aria-label="상대 시·도" value={sido} onChange={(e) => { setSido(e.target.value); setSgg(''); }} disabled={!anchors}>
              <option value="">시·도</option>
              {sidos.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
            <select aria-label="상대 시·군·구" value={sgg} onChange={(e) => setSgg(e.target.value)} disabled={!sido}>
              <option value="">시·군·구</option>
              {sggs.map(([c, a]) => <option key={c} value={c}>{a.name}</option>)}
            </select>
          </div>
          <p className="tiny muted">상대는 그 시·군·구의 대표 지점에서 출발한다고 보고 계산해요. 고른 동네는 저장하지 않아요.</p>
        </div>
      </div>

      <div className="chips small" role="radiogroup" aria-label="장소 종류">
        {KINDS.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} className={kind === k.id ? 'on' : ''} onClick={() => setKind(k.id)}>{k.label}</button>
        ))}
      </div>
      <button type="button" className="cta" disabled={!me || !partner || busy} onClick={find}>{busy ? '찾는 중…' : '만남 장소 찾기'}</button>
      {(!me || !partner) && <p className="tiny muted">내 위치와 상대 동네를 모두 정하면 누를 수 있어요.</p>}

      {result && (
        <div className="meet-result" aria-live="polite">
          {result.items.length === 0 && <p>{result.error ? '장소 자료를 불러오지 못했어요.' : '두 사람 사이에서 추천할 장소 자료를 찾지 못했어요.'}</p>}
          {result.items.length > 0 && (
            <>
              <p className="tiny">두 사람 사이 직선거리 약 {kmText(result.gapKm)}. 두 사람이 비슷하게 갈 수 있는 곳부터 골랐어요.</p>
              <ol className="near-list">
                {result.items.map((p) => (
                  <li key={p.id}>
                    <div><strong>{p.name}</strong>{p.theme && <span className="muted"> · {p.theme}</span>}</div>
                    <div className="route-row">
                      <span className="from-me-km">나에게서 약 {kmText(p.fromA)}</span>
                      <span className="from-me-km partner">상대에게서 약 {kmText(p.fromB)}</span>
                    </div>
                    <div className="route-row">
                      <RouteLink href={kakaoRouteUrl(p)} name={p.name} />
                      <button type="button" className="link-btn" onClick={() => sendTo(p)}>{shared === p.id ? '보낼 준비 완료' : '상대에게 보내기'}</button>
                    </div>
                  </li>
                ))}
              </ol>
              <LuckyMap items={result.items} people={[{ ...me, label: '나' }, { ...partner, label: '상대' }]} label={`나, 상대(${partner.sidoName} ${partner.name}), 만남 장소 ${result.items.length}곳`} />
              <p className="tiny muted">한국관광공사 TourAPI의 공개 장소·음식점·카페예요. 광고가 아니고, 영업 여부는 방문 전 확인하세요. 거리는 직선거리예요. 길찾기·보내기에는 장소 이름과 위치만 들어가고 두 사람의 위치는 넣지 않아요.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
