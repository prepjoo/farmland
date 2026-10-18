// ‘이번 주’: 만 19세 확인 → 고른 곳 → 추첨기로 이번 주 행운번호(5게임) → 고른 곳 주변 1등 판매점 3곳(거리 선택)
// 번호는 고른 곳의 국가지점번호 + 이번 주 회차로 정해지고, 일요일(한국시간)에 다음 회차로 바뀐다.
import { useEffect, useMemo, useState } from 'react';
import MeaningPicker, { ChosenBar, DistanceChips, RANGE_LABELS } from '../components/MeaningPicker.jsx';
import BallMachine from '../components/BallMachine.jsx';
import ScratchCard from '../components/ScratchCard.jsx';
import { MyLocationBar, FromMe, RouteLink, ROUTE_NOTE } from '../components/RouteTools.jsx';
import { kakaoSearchUrl, withDistanceFromMe } from '../engine/route.js';
import { useMyPosition } from '../lib/useMyPosition.js';
import LuckyMap from '../components/LuckyMap.jsx';
import { weeklyNumbers, roundForDate, drawDateOfRound, GAMES } from '../engine/lotto.js';
import { nearestStores } from '../engine/nearby.js';
import { kstDateString } from '../engine/kstDate.js';
import { getAge, setAge, seenToday, markSeen, loadPlaceData, kDate, prefersReducedMotion } from '../lib/luck.js';
import { luckCardPng } from '../lib/luckPng.js';
import { ODDS, SHOW_NOTE, PLACE_NOTE } from '../lib/brand.js';

export default function WeekLuck({ chosen, setChosen }) {
  const today = useMemo(() => kstDateString(), []);
  const round = roundForDate(today);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [age, setAgeState] = useState(() => getAge());
  const [games, setGames] = useState(null);
  const [gameIdx, setGameIdx] = useState(0);
  const [play, setPlay] = useState(false);
  const [data, setData] = useState(undefined);
  const [range, setRange] = useState(6);
  const [sharing, setSharing] = useState('');
  const pos = useMyPosition(); // [내 위치에서 거리 보기]를 눌렀을 때만
  const seenKey = `w${round}`; // 고른 국가지점번호는 저장하지 않으므로 회차만 남긴다

  useEffect(() => { loadPlaceData().then(setData); }, []);
  useEffect(() => {
    if (!chosen) { setGames(null); return; }
    weeklyNumbers({ round, np: chosen.text }).then((g) => {
      setGames(g);
      setGameIdx(0);
      setPlay(!reduced && !seenToday(seenKey));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, round]);

  const stores = useMemo(() => (chosen && data ? nearestStores({ point: chosen, stores: data.stores, anchors: data.anchors, rangeKm: range }) : null), [chosen, data, range]);

  if (!age) {
    return (
      <div className="luck-page">
        <h1>이번 주 행운</h1>
        <section className="age-box" aria-labelledby="age-h">
          <h2 id="age-h">만 19세 이상인가요?</h2>
          <p className="tiny muted">복권은 만 19세 이상만 살 수 있어요. 스스로 답해 주세요. 답은 이 기기에만 기억해요.</p>
          <div className="row">
            <button type="button" className="cta" onClick={() => { setAge(true, today); setAgeState({ ok: true }); }}>네, 만 19세 이상이에요</button>
            <button type="button" className="ghost" onClick={() => { setAge(false, today); setAgeState({ ok: false }); }}>아니요</button>
          </div>
        </section>
      </div>
    );
  }
  if (!age.ok) {
    return (
      <div className="luck-page">
        <h1>이번 주 행운</h1>
        <p className="minor">이번 주 행운번호와 판매점은 만 19세 이상만 볼 수 있어요. <a href="#/today">오늘의 행운 카드</a>와 <a href="#/my">내 귀땅 마을</a>은 누구나 쓸 수 있어요.</p>
      </div>
    );
  }
  if (!chosen) {
    return (
      <div className="luck-page">
        <h1>이번 주 행운</h1>
        <MeaningPicker onChosen={setChosen} />
      </div>
    );
  }

  const game = games?.[gameIdx];
  async function share() {
    if (!game) return;
    setSharing('만드는 중…');
    try {
      const top = stores?.items?.[0];
      const blob = await luckCardPng({
        dateText: `${round}회(${kDate(drawDateOfRound(round))} 추첨) 주간`, game: game.game, numbers: game.sorted,
        placeLine: top ? top.store.name : '자료 준비 중',
        placeSub: top ? `${top.region.sidoName ?? ''} ${top.region.name} · 최근 1년 자동 1등 ${top.store.wins}회` : '',
        cardLine: `고른 곳: ${chosen.place}`,
        basisLine: data ? `판매점 자료: 기획예산처 공개 자료(${data.meta.rounds[0]}~${data.meta.rounds[1]}회, 자동 1등만)` : '',
        siteText: window.location.host || '귀땅',
      });
      const file = new File([blob], `귀땅-${round}회-${game.game}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: '귀땅 · 이번 주 행운' }); setSharing(''); }
      else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setSharing('이미지를 저장했어요.');
      }
    } catch (e) {
      setSharing(e?.name === 'AbortError' ? '' : '이미지를 만들지 못했어요.');
    }
  }

  return (
    <div className="luck-page">
      <h1>이번 주 행운 <span className="muted date">{round}회 · {kDate(drawDateOfRound(round))} 추첨</span></h1>
      <ChosenBar chosen={chosen} onChange={() => setChosen(null)} />

      <section className="numbers" aria-labelledby="num-h">
        <h2 id="num-h">이번 주 행운번호</h2>
        {game && (
          <>
            <BallMachine key={`${gameIdx}-${play}`} drawn={game.drawn} play={play} interval={gameIdx === 0 ? 900 : 420} label={`행운번호 ${game.game}`}
              onDone={() => { markSeen(seenKey); setPlay(false); }} />
            {play && <button type="button" className="link-btn" onClick={() => { markSeen(seenKey); setPlay(false); }}>건너뛰기</button>}
            {!play && (
              <div className="games" role="tablist" aria-label="5게임">
                {GAMES.map((g, i) => (
                  <button key={g} type="button" role="tab" aria-selected={i === gameIdx} className={i === gameIdx ? 'on' : ''}
                    onClick={() => { setGameIdx(i); setPlay(!reduced); }}>{g}</button>
                ))}
              </div>
            )}
            <p className="tiny muted">{SHOW_NOTE}</p>
          </>
        )}
      </section>

      {!play && game && (
        <>
          <section aria-labelledby="store-h">
            <h2 id="store-h">이번 주 행운 장소 <span className="muted tiny">1등 나온 판매점 3곳</span></h2>
            <DistanceChips value={range} onChange={setRange} />
            {data === null && <p>자료 준비 중이에요.</p>}
            {stores && stores.items.length > 0 && (
              <>
                {stores.widened && <p className="tiny warn-soft">{RANGE_LABELS[range]} 안에는 3곳이 없어 더 넓혀 찾았어요.</p>}
                <MyLocationBar pos={pos} />
                <ol className="near-list">
                  {withDistanceFromMe(pos.me, stores.items, (m) => m.region).map((m) => (
                    <li key={m.store.id}>
                      <div><strong>{m.store.name}</strong> <span className="muted">· {m.region.sidoName} {m.region.name} · 고른 곳에서 약 {m.distanceKm}km · 최근 1년 자동 1등 {m.store.wins}회</span></div>
                      <div className="route-row"><FromMe km={m.fromMeKm} /><RouteLink search href={kakaoSearchUrl(`${m.store.name} ${m.region.name}`)} name={m.store.name} /></div>
                    </li>
                  ))}
                </ol>
                <LuckyMap base={chosen} items={stores.items.map((m) => m.region)} label={`${chosen.place} 주변 1등 판매점이 있는 시·군·구`} />
                <p className="tiny muted">핀과 거리는 그 시·군·구의 대표 지점 기준이에요(자료에 가게 주소가 없음). 정확한 위치는 복권 공식 판매점 검색에서 확인하세요. {PLACE_NOTE}</p>
                <p className="tiny muted">판매점은 가게 주소가 자료에 없어, 카카오맵에서 ‘상호 + 시·군·구’로 찾아요. 같은 이름의 다른 가게가 나올 수 있어요. {ROUTE_NOTE}</p>
              </>
            )}
          </section>

          <section aria-labelledby="why-h">
            <h2 id="why-h">왜 이 번호와 장소인가요?</h2>
            <ScratchCard>
              <div className="reasons">
                <h3>번호 이유</h3>
                <ol className="reason-list">
                  <li>고른 곳의 국가지점번호와 이번 주 회차({round}회)로 뽑았어요. 이번 주에는 다시 와도 같은 번호예요.</li>
                  <li>이 조합({game.game})은 홀수 {game.odd} · 짝수 {game.even}, 합계 {game.sum}, 연속 번호 {game.hasConsecutive ? '있음' : '없음'}. 계산한 사실일 뿐 좋고 나쁨이 아니에요.</li>
                  <li>모든 번호 조합의 1등 확률은 8,145,060분의 1로 같아요.</li>
                </ol>
                <h3>장소 이유</h3>
                <ol className="reason-list">
                  <li>고른 곳에서 가까운 시·군·구부터, 같은 곳이면 1등이 많이 나온 가게부터 3곳을 골랐어요.</li>
                  <li className="tiny muted">자료: {data?.meta.source ?? '—'}. 최근 1년 자동 1등만 들어 있어요.</li>
                </ol>
              </div>
            </ScratchCard>
          </section>
          <div className="share-row">
            <button type="button" className="cta" onClick={share}>행운 카드 공유하기</button>
            {sharing && <p className="tiny" role="status">{sharing}</p>}
            <p className="tiny muted">공유 이미지에는 고른 지역 이름만 들어가고 국가지점번호(입력한 숫자)는 넣지 않아요.</p>
          </div>
        </>
      )}
      <p className="odds">{ODDS}</p>
    </div>
  );
}
