// ‘행운 장소’: 내 동네(시·군·구)를 고르거나 [내 위치]로 기준점을 정하면, 오늘의 카드 방향으로 가까운 1등 판매점이 있는 곳을 찾는다.
// 위치는 버튼을 눌렀을 때만 묻고, 화면에서만 쓰며 저장·전송하지 않는다. 동네는 [기억하기]를 누를 때만 이 기기에 저장한다.
import { useEffect, useMemo, useState } from 'react';
import PlaceResult from '../components/PlaceResult.jsx';
import { todayCard } from '../engine/luckyDirection.js';
import { pickLuckyPlace } from '../engine/luckyPlace.js';
import { kstDateString } from '../engine/kstDate.js';
import { getAge, getHome, setHome, loadPlaceData, loadTarot, prefersReducedMotion } from '../lib/luck.js';
import { remove } from '../lib/storage.js';

export default function PlaceFinder() {
  const date = useMemo(() => kstDateString(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const adult = getAge()?.ok === true;
  const [data, setData] = useState(undefined);
  const [cards, setCards] = useState(null);
  const [card, setCard] = useState(null);
  const [sido, setSido] = useState('');
  const [sgg, setSgg] = useState(() => getHome() ?? '');
  const [gps, setGps] = useState(null);
  const [gpsMsg, setGpsMsg] = useState('');
  const [place, setPlace] = useState(null);
  const [runId, setRunId] = useState(0);
  const [remembered, setRemembered] = useState(() => !!getHome());

  useEffect(() => {
    Promise.all([loadPlaceData(), loadTarot().catch(() => null), todayCard(date)]).then(([d, deck, c]) => {
      setData(d); setCards(deck); setCard(c);
      const h = getHome();
      if (d && h && d.anchors[h]) setSido(d.anchors[h].sido);
    });
  }, [date]);

  const sidoList = useMemo(() => {
    if (!data) return [];
    const m = new Map();
    for (const a of Object.values(data.anchors)) m.set(a.sido, a.sidoName);
    return [...m].sort((x, y) => x[1].localeCompare(y[1], 'ko'));
  }, [data]);
  const sggList = useMemo(() => (data && sido
    ? Object.entries(data.anchors).filter(([, a]) => a.sido === sido).sort((x, y) => x[1].name.localeCompare(y[1].name, 'ko'))
    : []), [data, sido]);

  const base = gps ?? (data && sgg && data.anchors[sgg] ? { ...data.anchors[sgg], sggCode: sgg } : null);

  async function find() {
    if (!data || card == null || !base) return;
    setPlace(await pickLuckyPlace({ date, card, base, anchors: data.anchors, stores: data.stores, meta: data.meta }));
    setRunId((n) => n + 1);
  }

  function locate() {
    setGpsMsg('위치를 찾는 중…');
    if (!('geolocation' in navigator)) { setGpsMsg('이 브라우저에서는 위치를 찾을 수 없어요.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGpsMsg('지금 위치를 기준점으로 써요(저장하지 않아요).'); },
      () => setGpsMsg('위치를 찾지 못했어요. 동네를 골라 주세요.'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }

  function toggleRemember(on) {
    setRemembered(on);
    if (on && sgg) setHome(sgg); else remove('home');
  }

  if (!adult) {
    return (
      <div className="place-finder">
        <h1>행운 장소</h1>
        <p>행운 장소는 만 19세 이상만 볼 수 있어요. <a href="#/">오늘의 행운</a>에서 먼저 확인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="place-finder">
      <h1>행운 장소 찾기</h1>
      <p className="lead">기준점에서 오늘의 카드 방향으로, 1등 판매점이 있는 가장 가까운 시·군·구를 찾아요.</p>
      {data === null && <p role="alert">자료 준비 중이에요.</p>}
      <div className="pick-row">
        <label>시·도
          <select value={sido} onChange={(e) => { setSido(e.target.value); setSgg(''); setGps(null); }}>
            <option value="">고르세요</option>
            {sidoList.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <label>시·군·구
          <select value={sgg} onChange={(e) => { setSgg(e.target.value); setGps(null); if (remembered && e.target.value) setHome(e.target.value); }} disabled={!sido}>
            <option value="">고르세요</option>
            {sggList.map(([code, a]) => <option key={code} value={code}>{a.name}</option>)}
          </select>
        </label>
      </div>
      <p className="row">
        <button type="button" className="ghost" onClick={locate}>내 위치로 찾기</button>
        <label className="check"><input type="checkbox" checked={remembered} disabled={!sgg} onChange={(e) => toggleRemember(e.target.checked)} /> 이 동네 기억하기</label>
      </p>
      {gpsMsg && <p className="tiny" role="status">{gpsMsg}</p>}
      <button type="button" className="cta" onClick={find} disabled={!base || card == null}>오늘의 행운 장소 찾기</button>
      {place && (
        <PlaceResult
          key={runId}
          place={place}
          anchors={data.anchors}
          base={base}
          cards={cards ?? Array.from({ length: 22 }, (_, n) => ({ n }))}
          play={!reduced}
        />
      )}
      <p className="tiny muted">기준점은 고른 시·군·구의 대표 지점(또는 지금 위치)이에요. 거리는 직선거리예요.</p>
    </div>
  );
}
