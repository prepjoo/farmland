// ‘행운’: 만 19세 확인 → 행운지점(현재 위치 또는 의미 있는 숫자) → 행운번호([추첨] 1게임씩, 이번 주 최대 5게임) → 행운장소([행운장소] 1등 판매점 3곳, [출발])
// 번호는 행운위치의 국가지점번호 + 이번 주 회차로 정해진다(일요일에 바뀜). 추첨은 정해진 번호를 차례로 보여 줄 뿐 다시 뽑기가 아니다.
// [출발]을 누르면 행운위치 좌표를 출발지로 카카오맵에 넘긴다(사용자 결정 2026-10-19, 화면에 안내).
import { useEffect, useMemo, useRef, useState } from 'react';
import MeaningPicker, { ChosenBar, DistanceChips, RANGE_LABELS } from '../components/MeaningPicker.jsx';
import NationalPointBadge from '../components/NationalPointBadge.jsx';
import BallMachine from '../components/BallMachine.jsx';
import Balls from '../components/Balls.jsx';
import ScratchCard from '../components/ScratchCard.jsx';
import LuckyMap from '../components/LuckyMap.jsx';
import { RouteLink } from '../components/RouteTools.jsx';
import { kakaoSearchUrl, kakaoFromToUrl } from '../engine/route.js';
import { weeklyNumbers, roundForDate, drawDateOfRound, GAMES } from '../engine/lotto.js';
import { nearestStores } from '../engine/nearby.js';
import { toNationalPoint } from '../engine/nationalPoint.js';
import { kstDateString } from '../engine/kstDate.js';
import { getAge, setAge, loadPlaceData, kDate, prefersReducedMotion, ballClass } from '../lib/luck.js';
import { lookupOne } from '../lib/landLookup.js';
import { useMyPosition } from '../lib/useMyPosition.js';
import { luckCardPng } from '../lib/luckPng.js';
import { ODDS, SHOW_NOTE, PLACE_NOTE } from '../lib/brand.js';

const kmText = (km) => (km < 1 ? `${Math.max(100, Math.round(km * 10) * 100)}m` : `${km.toFixed(1)}km`);

function BallBox() {
  // 45개 행운 볼 상자(추첨 전 모습)
  return (
    <div className="ball-box" role="img" aria-label="1부터 45까지 행운 볼 45개가 든 상자">
      {Array.from({ length: 45 }, (_, i) => <span key={i} className={`mini-ball ${ballClass(i + 1)}`} aria-hidden="true">{i + 1}</span>)}
    </div>
  );
}

export default function Luck({ chosen, setChosen, section }) {
  const today = useMemo(() => kstDateString(), []);
  const round = roundForDate(today);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [age, setAgeState] = useState(() => getAge());
  const [source, setSource] = useState(chosen ? 'meaning' : 'here');
  const [point, setPoint] = useState(chosen ?? null); // 행운위치(화면 메모리에만)
  const [games, setGames] = useState(null);
  const [revealed, setRevealed] = useState(0); // 추첨으로 보여 준 게임 수
  const [play, setPlay] = useState(false);
  const [gameIdx, setGameIdx] = useState(0);
  const [data, setData] = useState(undefined);
  const [range, setRange] = useState(6);
  const [showStores, setShowStores] = useState(false);
  const [openStart, setOpenStart] = useState(null);
  const [sharing, setSharing] = useState('');
  const pos = useMyPosition();
  const [locating, setLocating] = useState(false);
  const refs = { pos: useRef(null), number: useRef(null), place: useRef(null) };

  useEffect(() => { loadPlaceData().then(setData); }, []);
  useEffect(() => { refs[section]?.current?.scrollIntoView?.({ block: 'start' }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [section, age]);
  useEffect(() => {
    setRevealed(0); setGameIdx(0); setPlay(false); setShowStores(false); setOpenStart(null); setGames(null);
    if (!point) return;
    weeklyNumbers({ round, np: point.text }).then(setGames);
  }, [point, round]);

  // 현재 위치 → 그 10m 칸의 국가지점번호
  useEffect(() => {
    if (source !== 'here' || pos.status !== 'found' || !locating) return;
    setLocating(false);
    const np = toNationalPoint(pos.me.lat, pos.me.lon);
    if (!np) return;
    lookupOne({ ...np, lat: pos.me.lat, lon: pos.me.lon }).then((c) => setPoint({ ...c, text: np.text, npShown: np.text, masked: false, source: 'here' }));
  }, [source, pos.status, pos.me, locating]);

  const stores = useMemo(() => (point && data && showStores ? nearestStores({ point, stores: data.stores, anchors: data.anchors, rangeKm: range }) : null), [point, data, range, showStores]);

  if (!age) {
    return (
      <div className="luck-page sub-page">
        <h1>행운</h1>
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
      <div className="luck-page sub-page">
        <h1>행운</h1>
        <p className="minor">행운번호와 행운장소는 만 19세 이상만 볼 수 있어요. <a href="#/happy">행복</a>과 <a href="#/my">내 귀땅 마을</a>은 누구나 쓸 수 있어요.</p>
      </div>
    );
  }

  const game = games && revealed > 0 ? games[gameIdx] : null;
  const pickMeaning = (c) => { setChosen(c); setPoint(c); };
  const reset = () => { setPoint(null); pos.forget(); if (source === 'meaning') setChosen(null); };

  function draw() {
    if (!games || revealed >= GAMES.length) return;
    setGameIdx(revealed);
    setRevealed(revealed + 1);
    setPlay(!reduced);
  }

  async function share() {
    if (!game) return;
    setSharing('만드는 중…');
    try {
      const top = stores?.items?.[0];
      const blob = await luckCardPng({
        dateText: `${round}회(${kDate(drawDateOfRound(round))} 추첨) 주간`, game: game.game, numbers: game.sorted,
        placeLine: top ? top.store.name : '행운장소는 [행운장소]를 눌러 보세요',
        placeSub: top ? `${top.region.sidoName ?? ''} ${top.region.name} · 최근 1년 자동 1등 ${top.store.wins}회` : '',
        cardLine: `행운위치: ${point.place}`,
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
    <div className="luck-page sub-page luck-sub">
      <h1>행운 <span className="muted date">{round}회 · {kDate(drawDateOfRound(round))} 추첨</span></h1>

      <section className="sub-panel" ref={refs.pos} aria-labelledby="lpos-h">
        <h2 id="lpos-h" className="sub-label">행운지점</h2>
        {!point && (
          <>
            <ol className="how-to tiny">
              <li>현재 위치 또는 의미 있는 숫자(생일·전화번호·MBTI) 중 하나를 고르고</li>
              <li>[위치찾기]를 누르면</li>
              <li>오늘의 행운위치(국가지점)가 정해져요.</li>
            </ol>
            <div className="chips small" role="radiogroup" aria-label="행운지점 찾는 방법">
              {[['here', '국가지점으로 현재 위치'], ['meaning', '의미 있는 숫자로']].map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={source === k} className={source === k ? 'on' : ''} onClick={() => setSource(k)}>{l}</button>
              ))}
            </div>
            {source === 'here' && (
              <div>
                <button type="button" className="cta" disabled={pos.status === 'finding'} onClick={() => { setLocating(true); pos.locate(); }}>{pos.status === 'finding' ? '위치 찾는 중…' : '위치찾기'}</button>
                {pos.status === 'error' && <p className="tiny warn-soft" role="alert">{pos.message}</p>}
                <p className="tiny muted">누를 때만 위치를 찾아요. 지금 서 있는 10m 칸의 국가지점번호(계산값)를 행운위치로 쓰고, 저장하지 않아요.</p>
              </div>
            )}
            {source === 'meaning' && <MeaningPicker onChosen={pickMeaning} buttonLabel="위치찾기" />}
          </>
        )}
        {point && <ChosenBar chosen={point} onChange={reset} label={point.source === 'here' ? '오늘의 행운위치 · 현재 위치' : '오늘의 행운위치'} changeLabel="다시 찾기" />}
      </section>

      <section className="sub-panel numbers" ref={refs.number} aria-labelledby="num-h">
        <h2 id="num-h" className="sub-label">행운번호</h2>
        <ol className="how-to tiny">
          <li>45개 행운 볼 상자 옆 [추첨]을 누르면</li>
          <li>행운의 번호 6개가 나와요. 누를 때마다 다음 게임(이번 주 최대 5게임).</li>
        </ol>
        {!point && <p className="tiny muted">먼저 위에서 행운지점을 정해 주세요.</p>}
        {point && (
          <div className="draw-row">
            {game ? (
              <BallMachine key={`${gameIdx}-${play}`} drawn={game.drawn} play={play} interval={gameIdx === 0 ? 900 : 420} label={`행운번호 ${game.game}`} onDone={() => setPlay(false)} />
            ) : <BallBox />}
            <div className="draw-side">
              <button type="button" className="cta" disabled={!games || play || revealed >= GAMES.length} onClick={draw}>
                {revealed >= GAMES.length ? '이번 주 5게임을 모두 뽑았어요' : `추첨 (${GAMES[revealed]}게임)`}
              </button>
              {play && <button type="button" className="link-btn" onClick={() => setPlay(false)}>건너뛰기</button>}
            </div>
          </div>
        )}
        {revealed > 0 && !play && (
          <ul className="game-list" aria-label="뽑은 게임">
            {games.slice(0, revealed).map((g, i) => (
              <li key={g.game}>
                <button type="button" className={i === gameIdx ? 'on' : ''} aria-pressed={i === gameIdx} onClick={() => setGameIdx(i)}>{g.game}</button>
                <Balls numbers={g.sorted} small />
              </li>
            ))}
          </ul>
        )}
        <p className="tiny muted">{SHOW_NOTE} 같은 주·같은 행운위치면 다시 와도 같은 번호예요.</p>
        <p className="odds">{ODDS}</p>
      </section>

      <section className="sub-panel" ref={refs.place} aria-labelledby="store-h">
        <h2 id="store-h" className="sub-label">행운장소</h2>
        <ol className="how-to tiny">
          <li>지도 옆 [행운장소]를 누르면 행운의 장소 3곳(최근 1년 1등 나온 판매점)이 나와요.</li>
          <li>[출발]을 누르면 행운위치에서 행운장소까지 거리를 보고 길찾기를 할 수 있어요.</li>
        </ol>
        {!point && <p className="tiny muted">먼저 위에서 행운지점을 정해 주세요.</p>}
        {point && (
          <>
            <div className="map-row">
              <LuckyMap base={point} items={stores ? stores.items.map((m) => m.region) : []} label={stores ? `${point.place} 주변 1등 판매점이 있는 시·군·구` : `행운위치 ${point.place}`} />
              <button type="button" className="cta" disabled={showStores || data === undefined} onClick={() => setShowStores(true)}>행운장소</button>
            </div>
            {showStores && <DistanceChips value={range} onChange={setRange} />}
            {data === null && <p>자료 준비 중이에요.</p>}
            {stores && stores.items.length > 0 && (
              <>
                {stores.widened && <p className="tiny warn-soft">{RANGE_LABELS[range]} 안에는 3곳이 없어 더 넓혀 찾았어요.</p>}
                <ol className="near-list">
                  {stores.items.map((m) => (
                    <li key={m.store.id}>
                      <div><strong>{m.store.name}</strong> <span className="muted">· {m.region.sidoName} {m.region.name} · 최근 1년 자동 1등 {m.store.wins}회</span></div>
                      <div className="route-row">
                        <button type="button" className="ghost small" aria-expanded={openStart === m.store.id} onClick={() => setOpenStart(openStart === m.store.id ? null : m.store.id)}>출발</button>
                        <RouteLink search href={kakaoSearchUrl(`${m.store.name} ${m.region.name}`)} name={m.store.name} />
                      </div>
                      {openStart === m.store.id && (
                        <div className="start-box">
                          <p className="tiny">행운위치에서 {m.region.name} 대표 지점까지 직선 약 <strong>{kmText(m.distanceKm)}</strong></p>
                          <RouteLink href={kakaoFromToUrl({ name: '행운위치', lat: point.lat, lon: point.lon }, { name: `${m.region.name}(${m.store.name} 근처)`, lat: m.region.lat, lon: m.region.lon })} name={`행운위치에서 ${m.region.name}까지`} />
                          <p className="tiny muted">길찾기를 누르면 <strong>행운위치의 좌표</strong>가 출발지로 카카오맵에 전달돼요{point.source === 'here' ? '(지금 내 위치)' : '(입력한 숫자로 정한 곳)'}. 가게 주소가 자료에 없어 도착지는 그 시·군·구 대표 지점이에요. 가게는 [카카오맵에서 찾기]로 확인하세요.</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="tiny muted">핀과 거리는 그 시·군·구의 대표 지점 기준이에요(자료에 가게 주소가 없음). 같은 이름의 다른 가게가 검색될 수 있어요. {PLACE_NOTE}</p>
              </>
            )}
          </>
        )}
      </section>

      {game && !play && (
        <>
          <section aria-labelledby="why-h">
            <h2 id="why-h">왜 이 번호와 장소인가요?</h2>
            <ScratchCard>
              <div className="reasons">
                <h3>번호 이유</h3>
                <ol className="reason-list">
                  <li>행운위치의 국가지점번호와 이번 주 회차({round}회)로 뽑았어요. 이번 주에는 다시 와도 같은 번호예요.</li>
                  <li>이 조합({game.game})은 홀수 {game.odd} · 짝수 {game.even}, 합계 {game.sum}, 연속 번호 {game.hasConsecutive ? '있음' : '없음'}. 계산한 사실일 뿐 좋고 나쁨이 아니에요.</li>
                  <li>모든 번호 조합의 1등 확률은 8,145,060분의 1로 같아요.</li>
                </ol>
                <h3>장소 이유</h3>
                <ol className="reason-list">
                  <li>행운위치에서 가까운 시·군·구부터, 같은 곳이면 1등이 많이 나온 가게부터 3곳을 골랐어요.</li>
                  <li className="tiny muted">자료: {data?.meta.source ?? '—'}. 최근 1년 자동 1등만 들어 있어요.</li>
                </ol>
              </div>
            </ScratchCard>
          </section>
          <div className="share-row">
            <button type="button" className="cta" onClick={share}>행운 카드 공유하기</button>
            {sharing && <p className="tiny" role="status">{sharing}</p>}
            <p className="tiny muted">공유 이미지에는 지역 이름만 들어가고 국가지점번호는 넣지 않아요.</p>
          </div>
        </>
      )}
      {point && <p className="tiny muted np-note">행운위치 <NationalPointBadge np={{ text: point.npShown }} /> 는 이 화면을 연 동안만 기억해요.</p>}
    </div>
  );
}
