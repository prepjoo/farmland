// 오늘의 행운 장소 칸: 룰렛 → 장소 이름·근거 → 작은 지도. 자료가 없으면 ‘자료 준비 중’.
import { useState } from 'react';
import Roulette from './Roulette.jsx';
import LuckyMap from './LuckyMap.jsx';
import { PLACE_NOTE } from '../lib/brand.js';

const SIDO_SHORT = { 11: '서울', 12: '전남광주', 26: '부산', 27: '대구', 28: '인천', 30: '대전', 31: '울산', 36: '세종', 41: '경기', 43: '충북', 44: '충남', 47: '경북', 48: '경남', 50: '제주', 51: '강원', 52: '전북' };

export default function PlaceResult({ place, anchors, base, cards, play, onDone }) {
  const [spun, setSpun] = useState(!play);
  if (!place) return <section className="place-card"><p className="muted">행운 장소를 찾는 중…</p></section>;
  if (place.mode === 'unavailable') {
    return (
      <section className="place-card" aria-labelledby="place-h">
        <h2 id="place-h">오늘의 행운 장소</h2>
        <p>자료 준비 중이에요. 번호와 오늘의 카드는 그대로 볼 수 있어요.</p>
      </section>
    );
  }
  const national = place.mode === 'national';
  const labels = national ? place.sidoCodes.map((c) => SIDO_SHORT[c] ?? c) : cards.map((c) => String(c.n));
  const target = national ? place.sidoCodes.indexOf(place.sido) : place.card;
  const anchor = anchors[place.region.code];
  const cardName = cards[place.card]?.name;
  return (
    <section className="place-card" aria-labelledby="place-h">
      <h2 id="place-h">오늘의 행운 장소</h2>
      <Roulette
        labels={labels}
        target={target}
        play={play}
        highlight={spun}
        onDone={() => { setSpun(true); onDone?.(); }}
        caption={national ? `시·도 룰렛이 ${anchor.sidoName}에서 멈췄어요` : `카드 룰렛이 ${place.card}번 ${cardName}에서 멈췄어요`}
      />
      {spun && (
        <div className="place-info">
          <p className="place-name"><strong>{place.store.name}</strong> <span className="muted">· {anchor.sidoName} {place.region.name}</span></p>
          <p className="place-facts">
            {national
              ? '오늘의 전국 행운 장소'
              : `${place.dirName}쪽 약 ${place.distanceKm}km${place.fallback ? ' (이 방향에 없어 가장 가까운 곳)' : ''}`}
            {' · '}최근 1년 자동 1등 {place.store.wins}회
          </p>
          <LuckyMap base={national ? null : base} place={anchor} label={`${anchor.sidoName} ${place.region.name} 대표 지점`} />
          <p className="tiny muted">핀은 {place.region.name}의 대표 지점이에요. 가게의 정확한 위치는 복권 공식 판매점 검색에서 확인하세요. {PLACE_NOTE}</p>
        </div>
      )}
    </section>
  );
}
