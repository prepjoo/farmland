// 첫 화면 ‘오늘의 행운’: 번호 → 장소 → 이유 (docs/plan.md, CLAUDE.md 3~7번)
// 그날 처음이면 추첨기와 룰렛 연출을 모두, 같은 날 다시 오면 결과부터. ‘동작 줄이기’ 설정이면 연출 없음.
import { useEffect, useMemo, useState } from 'react';
import BallMachine from '../components/BallMachine.jsx';
import PlaceResult from '../components/PlaceResult.jsx';
import ScratchCard from '../components/ScratchCard.jsx';
import Reasons from '../components/Reasons.jsx';
import TarotArt from '../components/TarotArt.jsx';
import { todayNumbers, GAMES } from '../engine/lotto.js';
import { todayCard } from '../engine/luckyDirection.js';
import { pickLuckyPlace } from '../engine/luckyPlace.js';
import { kstDateString } from '../engine/kstDate.js';
import { getSalt, getAge, setAge, seenToday, markSeen, getHome, loadPlaceData, loadTarot, kDate, prefersReducedMotion } from '../lib/luck.js';
import { luckCardPng } from '../lib/luckPng.js';
import { HEADLINE, LEAD, CTA, ODDS, SHOW_NOTE } from '../lib/brand.js';

export default function Today() {
  const date = useMemo(() => kstDateString(), []);
  const { salt, stored } = useMemo(() => getSalt(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [age, setAgeState] = useState(() => getAge());
  const firstToday = !seenToday(date);
  const [phase, setPhase] = useState(firstToday ? 'idle' : 'done'); // idle → draw → spin → done
  const [games, setGames] = useState(null);
  const [gameIdx, setGameIdx] = useState(0);
  const [replayGame, setReplayGame] = useState(false);
  const [card, setCard] = useState(null);
  const [cards, setCards] = useState(null);
  const [data, setData] = useState(undefined);
  const [place, setPlace] = useState(null);
  const [sharing, setSharing] = useState('');
  const homeCode = getHome();

  useEffect(() => {
    let alive = true;
    (async () => {
      const [g, c, deck, d] = await Promise.all([todayNumbers({ date, salt }), todayCard(date), loadTarot().catch(() => null), loadPlaceData()]);
      if (!alive) return;
      setGames(g); setCard(c); setCards(deck); setData(d);
      if (!d) { setPlace({ mode: 'unavailable' }); return; }
      const a = homeCode && d.anchors[homeCode];
      const base = a ? { lat: a.lat, lon: a.lon, sggCode: homeCode } : null;
      setPlace(await pickLuckyPlace({ date, card: c, base, anchors: d.anchors, stores: d.stores, meta: d.meta }));
    })();
    return () => { alive = false; };
  }, [date, salt, homeCode]);

  const adult = age?.ok === true;
  const start = () => {
    if (!age) { setPhase('age'); return; }
    if (adult) setPhase(reduced ? 'done' : 'draw');
  };
  const answerAge = (ok) => {
    setAge(ok, date);
    setAgeState({ ok, date });
    if (ok) setPhase(reduced ? 'done' : 'draw');
  };
  useEffect(() => { if (phase === 'done') markSeen(date); }, [phase, date]);

  const game = games?.[gameIdx];
  const todaysCard = cards && card != null ? cards[card] : null;
  const homeAnchor = data && homeCode ? data.anchors[homeCode] : null;

  async function share() {
    if (!game || !place) return;
    setSharing('만드는 중…');
    try {
      const a = place.mode !== 'unavailable' ? data.anchors[place.region.code] : null;
      const blob = await luckCardPng({
        dateText: kDate(date), game: game.game, numbers: game.sorted,
        placeLine: a ? place.store.name : '자료 준비 중',
        placeSub: a ? `${a.sidoName} ${place.region.name} · 최근 1년 자동 1등 ${place.store.wins}회` : '',
        cardLine: todaysCard ? `오늘의 카드 ${todaysCard.n}번 ${todaysCard.name}` : '',
        basisLine: place.basis ? `판매점 자료: 기획예산처 공개 자료(${place.basis.rounds[0]}~${place.basis.rounds[1]}회, 자동 1등만)` : '',
        siteText: window.location.host || '귀땅',
      });
      const file = new File([blob], `귀땅-${date}-${game.game}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '귀땅 · 오늘의 행운' });
        setSharing('');
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = file.name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setSharing('이미지를 저장했어요.');
      }
    } catch (e) {
      setSharing(e?.name === 'AbortError' ? '' : '이미지를 만들지 못했어요.');
    }
  }

  return (
    <div className="today">
      <h1>{HEADLINE}</h1>
      <p className="lead">{kDate(date)} · {LEAD}</p>

      {phase === 'idle' && (
        <button type="button" className="cta" onClick={start} disabled={!games}>{CTA}</button>
      )}

      {phase === 'age' && (
        <section className="age-box" aria-labelledby="age-h">
          <h2 id="age-h">만 19세 이상인가요?</h2>
          <p className="tiny muted">복권은 만 19세 이상만 살 수 있어요. 스스로 답해 주세요. 답은 이 기기에만 기억해요.</p>
          <div className="row">
            <button type="button" className="cta" onClick={() => answerAge(true)}>네, 만 19세 이상이에요</button>
            <button type="button" className="ghost" onClick={() => answerAge(false)}>아니요</button>
          </div>
        </section>
      )}

      {age?.ok === false && (
        <section className="minor" aria-labelledby="minor-h">
          <h2 id="minor-h">오늘의 카드</h2>
          {todaysCard && (
            <div className="reason-card">
              <TarotArt n={todaysCard.n} name={todaysCard.name} size={72} />
              <div><p className="card-name">{todaysCard.n}번 {todaysCard.name}</p><p>{todaysCard.keywords.join(' · ')} — {todaysCard.tradition}</p></div>
            </div>
          )}
          <p>행운번호와 행운 장소는 만 19세 이상만 볼 수 있어요. <a href="#/my">내 귀땅 마을</a>은 누구나 쓸 수 있어요.</p>
        </section>
      )}

      {adult && game && (phase === 'draw' || phase === 'spin' || phase === 'done') && (
        <>
          <section className="numbers" aria-labelledby="num-h">
            <h2 id="num-h" className="sr">오늘의 행운번호</h2>
            <BallMachine
              key={`${gameIdx}-${replayGame}`}
              drawn={game.drawn}
              play={phase === 'draw' || replayGame}
              interval={phase === 'draw' ? 900 : 420}
              label={`행운번호 ${game.game}`}
              onDone={() => { if (phase === 'draw') setPhase('spin'); setReplayGame(false); }}
            />
            {phase === 'draw' && <button type="button" className="link-btn" onClick={() => setPhase('spin')}>건너뛰기</button>}
            {phase === 'done' && (
              <div className="games" role="tablist" aria-label="5게임">
                {GAMES.map((g, i) => (
                  <button key={g} type="button" role="tab" aria-selected={i === gameIdx} className={i === gameIdx ? 'on' : ''}
                    onClick={() => { setGameIdx(i); setReplayGame(!reduced); }}>{g}</button>
                ))}
              </div>
            )}
            <p className="tiny muted">{SHOW_NOTE}</p>
          </section>

          {(phase === 'spin' || phase === 'done') && (
            <>
              <PlaceResult
                place={place}
                anchors={data?.anchors ?? {}}
                base={homeAnchor}
                cards={cards ?? Array.from({ length: 22 }, (_, n) => ({ n }))}
                play={phase === 'spin'}
                onDone={() => setPhase('done')}
              />
              {phase === 'spin' && <button type="button" className="link-btn" onClick={() => setPhase('done')}>건너뛰기</button>}
              {!homeCode && phase === 'done' && <p className="tiny"><a href="#/place">내 동네를 고르면</a> 오늘의 카드 방향으로 가까운 행운 장소를 찾아 드려요.</p>}
            </>
          )}

          {phase === 'done' && (
            <>
              <section aria-labelledby="why-h">
                <h2 id="why-h">왜 이 번호와 장소인가요?</h2>
                <ScratchCard>
                  <Reasons date={date} game={game} card={todaysCard} place={place} saltStored={stored} />
                </ScratchCard>
              </section>
              <div className="share-row">
                <button type="button" className="cta" onClick={share}>행운 카드 공유하기</button>
                {sharing && <p className="tiny" role="status">{sharing}</p>}
              </div>
              <p className="tiny"><button type="button" className="link-btn" onClick={() => { setGameIdx(0); setPhase('draw'); }}>연출 다시 보기</button></p>
            </>
          )}
          <p className="odds">{ODDS}</p>
        </>
      )}
    </div>
  );
}
