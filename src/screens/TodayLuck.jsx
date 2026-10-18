// ‘오늘’: 오늘의 행운 카드(타로·주역) + 고른 곳 주변 행운 장소 3곳(거리 선택) — 누구나 쓸 수 있다.
import { useEffect, useMemo, useState } from 'react';
import MeaningPicker, { ChosenBar, DistanceChips, RANGE_LABELS } from '../components/MeaningPicker.jsx';
import Roulette from '../components/Roulette.jsx';
import TarotArt from '../components/TarotArt.jsx';
import LuckyMap from '../components/LuckyMap.jsx';
import { MyLocationBar, FromMe, RouteLink, ROUTE_NOTE } from '../components/RouteTools.jsx';
import { kakaoRouteUrl, withDistanceFromMe } from '../engine/route.js';
import { useMyPosition } from '../lib/useMyPosition.js';
import { todayTarot, todayHexagram } from '../engine/fortune.js';
import { pickNearbyPlaces } from '../engine/nearby.js';
import { kstDateString } from '../engine/kstDate.js';
import { loadPlacesNear } from '../lib/data.js';
import { kDate, loadTarot, loadHexagrams, prefersReducedMotion, recordVisit } from '../lib/luck.js';

function Hexagram({ lines, size = 64 }) {
  // lines: 아래(초효)부터 위로 1=양, 0=음
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 60 72" role="img" aria-label="괘 그림" className="hexagram">
      {lines.map((l, i) => {
        const y = 64 - i * 11;
        return l ? <rect key={i} x="4" y={y} width="52" height="7" rx="2" /> : <g key={i}><rect x="4" y={y} width="22" height="7" rx="2" /><rect x="34" y={y} width="22" height="7" rx="2" /></g>;
      })}
    </svg>
  );
}

export default function TodayLuck({ chosen, setChosen }) {
  const date = useMemo(() => kstDateString(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [kind, setKind] = useState('tarot');
  const [deck, setDeck] = useState({ tarot: null, iching: null });
  const [cardNo, setCardNo] = useState(null);
  const [spun, setSpun] = useState(false);
  const [range, setRange] = useState(6);
  const [near, setNear] = useState(null);
  const [mission, setMission] = useState(null);
  const pos = useMyPosition(); // [내 위치에서 거리 보기]를 눌렀을 때만 // 귀땅 마을 미션 결과(하루 1팜)

  useEffect(() => {
    Promise.all([loadTarot().catch(() => null), loadHexagrams().catch(() => null)]).then(([t, h]) => setDeck({ tarot: t, iching: h }));
  }, []);

  useEffect(() => {
    if (!chosen) return;
    setSpun(reduced);
    (kind === 'tarot' ? todayTarot : todayHexagram)({ date, np: chosen.text }).then(setCardNo);
  }, [chosen, kind, date, reduced]);

  useEffect(() => {
    if (!chosen) return;
    let alive = true;
    setNear(null);
    (async () => {
      const places = await loadPlacesNear([chosen], range + 2).catch(() => []);
      const r = await pickNearbyPlaces({ date, np: chosen.text, point: chosen, places, rangeKm: range });
      if (alive) setNear(r);
    })();
    return () => { alive = false; };
  }, [chosen, range, date]);

  useEffect(() => {
    // 오늘의 카드를 다 보여 준 뒤에만 ‘오늘의 행운 보기’ 미션을 기록한다(날짜만 저장)
    if (!chosen || cardNo == null || !(kind === 'iching' || spun) || mission) return;
    setMission(recordVisit(date));
  }, [chosen, cardNo, kind, spun, mission, date]);

  if (!chosen) {
    return (
      <div className="luck-page">
        <h1>오늘의 행운</h1>
        <MeaningPicker onChosen={setChosen} />
      </div>
    );
  }

  const card = kind === 'tarot' ? deck.tarot?.[cardNo] : deck.iching?.find((h) => h.n === cardNo);
  const cardShown = Boolean(card && (kind === 'iching' || spun));
  return (
    <div className="luck-page">
      <h1>오늘의 행운 <span className="muted date">{kDate(date)}</span></h1>
      <ChosenBar chosen={chosen} onChange={() => setChosen(null)} />

      <section aria-labelledby="card-h">
        <h2 id="card-h">오늘의 행운 카드</h2>
        <div className="chips small" role="radiogroup" aria-label="카드 종류">
          {[['tarot', '타로'], ['iching', '주역']].map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>
          ))}
        </div>
        {kind === 'tarot' && cardNo != null && deck.tarot && (
          <Roulette key={`${chosen.text}-${cardNo}`} labels={deck.tarot.map((c) => String(c.n))} target={cardNo} play={!reduced} highlight={spun}
            onDone={() => setSpun(true)} caption={`타로 룰렛이 ${cardNo}번에서 멈췄어요`} />
        )}
        {card && (kind === 'iching' || spun) && (
          <div className="reason-card fortune">
            {kind === 'tarot' ? <TarotArt n={card.n} name={card.name} size={72} /> : <Hexagram lines={card.lines} />}
            <div>
              <p className="card-name">{kind === 'tarot' ? `${card.n}번 ${card.name}` : `${card.n}괘 ${card.name}(${card.hanja})`}</p>
              <p className="tiny">{card.keywords.join(' · ')}</p>
              <p>{card.tradition}</p>
              <p className="tiny muted">{kind === 'tarot' ? '라이더-웨이트-스미스 정방향의 전통 의미를 요약했어요.' : '주역 괘사의 전통 의미를 쉬운 말로 옮겼어요.'} 고른 곳과 오늘 날짜로 정해져요.</p>
            </div>
          </div>
        )}
        {cardShown && mission && (
          <p className="mission-note" role="status">
            {mission.gained.includes('today') ? '오늘의 미션 완료! 귀땅 마을에 1팜이 늘었어요.' : '오늘의 미션은 이미 완료했어요.'}
            {mission.gained.includes('week') && ' 이번 주 5일 방문도 채워 1팜을 더 받았어요.'}
            {' '}<a href="#/my">내 귀땅 마을 보기</a>
          </p>
        )}
      </section>

      <section aria-labelledby="near-h">
        <h2 id="near-h">오늘의 행운 장소 3곳</h2>
        <DistanceChips value={range} onChange={setRange} />
        {!near && <p className="muted">찾는 중…</p>}
        {near && near.items.length === 0 && <p>이 근처에는 추천할 공개 장소 자료가 아직 없어요.</p>}
        {near && near.items.length > 0 && (
          <>
            {near.widened && <p className="tiny warn-soft">{RANGE_LABELS[range]} 안에는 3곳이 없어 {near.rangeKm}km까지 넓혀 찾았어요.</p>}
            <MyLocationBar pos={pos} />
            <ol className="near-list">
              {withDistanceFromMe(pos.me, near.items, (p) => p).map((p) => (
                <li key={p.id}>
                  <div><strong>{p.name}</strong> <span className="muted">· {p.theme} · 고른 곳에서 약 {p.distanceKm}km</span></div>
                  <div className="route-row"><FromMe km={p.fromMeKm} /><RouteLink href={kakaoRouteUrl(p)} name={p.name} /></div>
                </li>
              ))}
            </ol>
            <LuckyMap base={chosen} items={near.items} label={`${chosen.place}에서 추천 장소 ${near.items.length}곳`} />
            <p className="tiny muted">한국관광공사 TourAPI의 공개 장소예요. 광고가 아니고, 운영 여부는 방문 전 확인하세요. 거리는 직선거리예요.</p>
            <p className="tiny muted">{ROUTE_NOTE}</p>
          </>
        )}
      </section>
    </div>
  );
}
