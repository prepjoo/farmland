// ‘행복’: 행복위치(의미 있는 숫자 → 후보 → 한 곳) · 행복메시지(타로·주역·점성술 회전판, [조언받기]) · 오늘의 국가지점 · 추천장소(두 사람 만남)
// 누구나 쓸 수 있다(19세 확인 없음). 행복메시지를 다 보면 귀땅 마을 ‘오늘의 행복메시지 보기’ 미션을 기록한다(날짜만).
import { useEffect, useMemo, useRef, useState } from 'react';
import MeaningPicker, { ChosenBar } from '../components/MeaningPicker.jsx';
import NationalPointBadge from '../components/NationalPointBadge.jsx';
import Roulette from '../components/Roulette.jsx';
import TarotArt from '../components/TarotArt.jsx';
import MeetPlaces from '../components/MeetPlaces.jsx';
import { todayTarot, todayHexagram, todayZodiac, MESSAGE_KINDS, luckyDirection } from '../engine/fortune.js';
import { kstDateString } from '../engine/kstDate.js';
import { guardianCardNumber } from '../engine/landCard.js';
import { kDate, loadTarot, loadHexagrams, loadZodiac, loadFortuneDetail, prefersReducedMotion, recordVisit } from '../lib/luck.js';

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

const PICKERS = { tarot: todayTarot, iching: async (a) => (await todayHexagram(a)) - 1, zodiac: todayZodiac }; // 모두 0부터의 칸 번호

function Head({ kind, card }) {
  if (kind === 'tarot') return <><TarotArt n={card.n} name={card.name} size={72} /><div><p className="card-name">타로 {card.n}번 {card.name}</p><p className="tiny">{card.en} · {card.keywords.join(' · ')}</p></div></>;
  if (kind === 'iching') return <><Hexagram lines={card.lines} /><div><p className="card-name">주역 {card.n}괘 {card.name}({card.hanja})</p><p className="tiny">위 {card.upper} · 아래 {card.lower} · {card.keywords.join(' · ')}</p></div></>;
  return <><span className="zodiac-mark" aria-hidden="true">{card.symbol}{'\uFE0E'}</span><div><p className="card-name">점성술 {card.name}</p><p className="tiny">{card.dates} · {card.element} · {card.modality} · 지배 행성 {card.ruler}</p></div></>;
}

/** 오늘의 운세처럼: 한마디 → 오늘의 흐름 → 사람·관계 / 일·공부·돈 / 마음·건강 → 오늘의 작은 실천 → 행운의 방향 */
function Message({ kind, card, detail, date }) {
  const dir = luckyDirection(kind, card);
  const one = kind === 'zodiac' ? card.keywords.join(' · ') : card.keywords.join(' · ');
  const flow = kind === 'zodiac' ? card.tradition : `${card.tradition}${card.luck ? ` ${card.luck}` : ''}`;
  return (
    <article className="fortune reading" aria-labelledby="reading-h">
      <div className="reading-head"><Head kind={kind} card={card} /></div>
      <h3 id="reading-h" className="reading-title">{kDate(date)} 오늘의 행복메시지</h3>
      <p className="reading-one">“{one}”</p>
      <dl className="reading-list">
        <div><dt>오늘의 흐름</dt><dd>{flow}</dd></div>
        {detail && <div><dt>사람·관계</dt><dd>{detail.love}</dd></div>}
        {detail && <div><dt>일·공부·돈</dt><dd>{detail.work}</dd></div>}
        {detail && <div><dt>마음·건강</dt><dd>{detail.mind}</dd></div>}
        {detail && <div className="do"><dt>오늘의 작은 실천</dt><dd>{detail.action}</dd></div>}
        {dir && <div><dt>행운의 방향</dt><dd>{dir}쪽 <span className="tiny muted">({kind === 'tarot' ? '카드 번호 × 360/22도, 0번이 정북' : `위 괘 ‘${card.upper}’의 후천팔괘 방위`})</span></dd></div>}
      </dl>
      <p className="tiny muted">
        {kind === 'tarot' && '라이더-웨이트-스미스 정방향의 전통 의미를 바탕으로 생활 속 조언으로 풀었어요.'}
        {kind === 'iching' && '주역 괘사의 전통 의미를 바탕으로 생활 속 조언으로 풀었어요.'}
        {kind === 'zodiac' && '서양 점성술의 전통 별자리 성질(원소·특성·지배 행성)을 바탕으로 했어요. 오늘의 별자리는 놀이용 추첨이며 내 생일 별자리가 아니에요.'}
        {' '}미래를 맞히는 예보가 아니라 하루를 돌아보는 놀이용 조언이에요.
      </p>
    </article>
  );
}

const WHY = [
  ['나만의 장소가 생겨요', '생일·전화번호·MBTI처럼 나에게 의미 있는 숫자가 국가지점번호로 들어 있는 곳이에요. 우리나라 지도 위에 나와 숫자로 이어진 곳이 생겨요.'],
  ['매일 나만의 조언을 받아요', '행복위치와 오늘 날짜로 행복메시지가 정해져요. 같은 날 같은 곳이면 언제 다시 와도 같은 조언이라, 하루를 시작하는 나만의 작은 의식이 돼요.'],
  ['위급할 때 쓰는 번호를 익혀요', '국가지점번호는 산·바닷가처럼 주소가 없는 곳에서 119에 위치를 알릴 때 쓰는 번호예요. 놀이처럼 자주 보면 읽는 법이 익숙해져요.'],
];

function WhyBox() {
  return (
    <details className="why-box" open>
      <summary>행복위치가 나에게 주는 것</summary>
      <ul>{WHY.map(([t, d]) => <li key={t}><strong>{t}</strong> — {d}</li>)}</ul>
      <p className="tiny muted">행복위치는 숫자로 이어진 상징이에요. 실제로 찾아가는 곳이 아니고, 입력한 숫자와 고른 곳은 저장하지 않아요.</p>
    </details>
  );
}

export default function Happy({ chosen, setChosen, section }) {
  const date = useMemo(() => kstDateString(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [kind, setKind] = useState('tarot');
  const [decks, setDecks] = useState({});
  const [detail, setDetail] = useState(null);
  const [cardNo, setCardNo] = useState(null);
  const [go, setGo] = useState(false);
  const [shown, setShown] = useState(false);
  const [mission, setMission] = useState(null);
  const [starCard, setStarCard] = useState(null); // 만남 별자리 방향 카드
  const refs = { pos: useRef(null), message: useRef(null), place: useRef(null) };

  useEffect(() => {
    Promise.all([loadTarot().catch(() => null), loadHexagrams().catch(() => null), loadZodiac().catch(() => null)])
      .then(([tarot, iching, zodiac]) => setDecks({ tarot, iching, zodiac }));
    loadFortuneDetail().then(setDetail).catch(() => setDetail(null));
  }, []);
  useEffect(() => { refs[section]?.current?.scrollIntoView?.({ block: 'start' }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [section]);

  useEffect(() => {
    setGo(false); setShown(false); setCardNo(null);
    if (!chosen) return;
    PICKERS[kind]({ date, np: chosen.text }).then(setCardNo);
  }, [chosen, kind, date]);

  useEffect(() => {
    // 행복위치가 있으면 오늘의 타로 행복메시지 카드, 없으면 오늘 날짜의 수호 카드(별땅과 같은 규칙)
    if (chosen) todayTarot({ date, np: chosen.text }).then((n) => setStarCard({ n, why: '(행복위치와 오늘 날짜로 정해진 오늘의 타로 카드)' }));
    else setStarCard({ n: guardianCardNumber(date.replaceAll('-', '')), why: '(오늘 날짜 숫자를 더해 정한 수호 카드. 위에서 행복위치를 고르면 나만의 카드로 바뀌어요)' });
  }, [chosen, date]);

  useEffect(() => {
    if (shown && !mission) setMission(recordVisit(date));
  }, [shown, mission, date]);

  const deck = decks[kind];
  const labels = deck ? (kind === 'tarot' ? deck.map((c) => String(c.n)) : kind === 'iching' ? deck.map((h) => String(h.n)) : deck.map((s) => s.name.replace('자리', ''))) : null;
  const card = deck && cardNo != null ? (kind === 'iching' ? deck.find((h) => h.n === cardNo + 1) : deck[cardNo]) : null;
  const kindLabel = MESSAGE_KINDS.find((k) => k.id === kind).label;

  return (
    <div className="luck-page sub-page happy-page">
      <h1>행복 <span className="muted date">{kDate(date)}</span></h1>

      <section className="sub-panel" ref={refs.pos} aria-labelledby="pos-h">
        <h2 id="pos-h" className="sub-label">행복위치</h2>
        <WhyBox />
        {!chosen && (
          <>
            <ol className="how-to tiny">
              <li>생일·전화번호·MBTI 중 하나를 고르고</li>
              <li>숫자 8자리가 되는 값을 넣으면</li>
              <li>그 숫자가 국가지점번호로 들어 있는 곳 중 오늘의 행복위치를 골라요.</li>
            </ol>
            <MeaningPicker onChosen={setChosen} />
          </>
        )}
        {chosen && <ChosenBar chosen={chosen} onChange={() => setChosen(null)} label="오늘의 행복위치" />}
      </section>

      <section className="sub-panel" ref={refs.message} aria-labelledby="msg-h">
        <h2 id="msg-h" className="sub-label">행복메시지</h2>
        <ol className="how-to tiny">
          <li>타로·주역·점성술 중 하나를 고르고</li>
          <li>[조언받기]를 누르면 회전판이 돌아요.</li>
          <li>멈춘 칸으로 오늘의 흐름과 사람·일·마음에 대한 조언, 작은 실천을 알려 드려요.</li>
        </ol>
        <div className="chips small" role="radiogroup" aria-label="행복메시지 종류">
          {MESSAGE_KINDS.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} className={kind === k.id ? 'on' : ''} onClick={() => setKind(k.id)}>{k.label}</button>
          ))}
        </div>
        {!chosen && <p className="tiny muted">먼저 위에서 행복위치를 골라 주세요. 행복메시지는 행복위치와 오늘 날짜로 정해져요.</p>}
        {chosen && labels && cardNo != null && (
          <div className="wheel-row">
            <Roulette key={kind} labels={labels} target={cardNo} go={go} reduced={reduced} dense={kind === 'iching'} onDone={() => setShown(true)}
              caption={shown ? `${kindLabel} 회전판이 ${labels[cardNo]}에서 멈췄어요` : `${kindLabel} 회전판 ${labels.length}칸`} />
            <button type="button" className="cta" disabled={go} onClick={() => setGo(true)}>{go && !shown ? '도는 중…' : shown ? '오늘의 조언을 받았어요' : '조언받기'}</button>
          </div>
        )}
        {chosen && !deck && <p className="muted">회전판을 준비하는 중…</p>}
        {shown && card && <Message kind={kind} card={card} date={date} detail={detail?.[kind]?.find((x) => x.n === card.n)} />}
        {shown && <p className="tiny muted">같은 날·같은 행복위치면 다시 와도 같은 조언이 나와요. 회전판은 정해진 결과를 보여 주는 연출이에요.</p>}
      </section>

      {shown && chosen && (
        <section className="sub-panel today-np" aria-labelledby="np-h">
          <h2 id="np-h" className="sub-label">오늘의 국가지점</h2>
          <p><strong>{chosen.place}</strong> <NationalPointBadge np={{ text: chosen.npShown }} /></p>
          <p className="tiny muted">오늘의 행복메시지를 받은 곳이에요. 실제로 찾아가는 곳이 아니라 숫자로 이어진 상징이에요.</p>
          {mission && (
            <p className="mission-note" role="status">
              {mission.gained.includes('today') ? '오늘의 미션 완료! 귀땅 마을에 1팜이 늘었어요.' : '오늘의 미션은 이미 완료했어요.'}
              {mission.gained.includes('week') && ' 이번 주 5일 방문도 채워 1팜을 더 받았어요.'}
              {' '}<a href="#/my">내 귀땅 마을 보기</a>
            </p>
          )}
        </section>
      )}

      <section className="sub-panel" ref={refs.place} aria-labelledby="meet-h">
        <h2 id="meet-h" className="sub-label">추천장소</h2>
        {starCard && <MeetPlaces cardNo={starCard.n} cardName={decks.tarot?.[starCard.n]?.name ?? `${starCard.n}번`} cardWhy={starCard.why} />}
      </section>
    </div>
  );
}
