// ‘행복’: 행복위치(의미 있는 숫자 → 후보 → 한 곳) · 행복메시지(타로·주역·점성술 회전판, [조언받기]) · 오늘의 국가지점 · 추천장소(두 사람 만남)
// 누구나 쓸 수 있다(19세 확인 없음). 행복메시지를 다 보면 귀땅 마을 ‘오늘의 행복메시지 보기’ 미션을 기록한다(날짜만).
import { useEffect, useMemo, useRef, useState } from 'react';
import MeaningPicker, { ChosenBar } from '../components/MeaningPicker.jsx';
import NationalPointBadge from '../components/NationalPointBadge.jsx';
import Roulette from '../components/Roulette.jsx';
import TarotArt from '../components/TarotArt.jsx';
import MeetPlaces from '../components/MeetPlaces.jsx';
import { todayTarot, todayHexagram, todayZodiac, MESSAGE_KINDS } from '../engine/fortune.js';
import { kstDateString } from '../engine/kstDate.js';
import { kDate, loadTarot, loadHexagrams, loadZodiac, prefersReducedMotion, recordVisit } from '../lib/luck.js';

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

function Message({ kind, card }) {
  if (kind === 'tarot') {
    return (
      <div className="reason-card fortune">
        <TarotArt n={card.n} name={card.name} size={72} />
        <div>
          <p className="card-name">타로 {card.n}번 {card.name}</p>
          <p className="tiny">{card.keywords.join(' · ')}</p>
          <p>{card.tradition}</p>
          <p className="tiny muted">라이더-웨이트-스미스 정방향의 전통 의미를 요약했어요.</p>
        </div>
      </div>
    );
  }
  if (kind === 'iching') {
    return (
      <div className="reason-card fortune">
        <Hexagram lines={card.lines} />
        <div>
          <p className="card-name">주역 {card.n}괘 {card.name}({card.hanja})</p>
          <p className="tiny">{card.keywords.join(' · ')}</p>
          <p>{card.tradition}</p>
          {card.luck && <p className="tiny">{card.luck}</p>}
          <p className="tiny muted">주역 괘사의 전통 의미를 쉬운 말로 옮겼어요.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="reason-card fortune">
      <span className="zodiac-mark" aria-hidden="true">{card.symbol}{'\uFE0E'}</span>
      <div>
        <p className="card-name">점성술 {card.name}</p>
        <p className="tiny">{card.element} · {card.modality} · 지배 행성 {card.ruler} · {card.keywords.join(' · ')}</p>
        <p>{card.tradition}</p>
        <p><strong>오늘의 조언:</strong> {card.advice}</p>
        <p className="tiny muted">서양 점성술의 전통 별자리 성질(원소·특성·지배 행성)을 바탕으로 했어요. 오늘의 별자리는 놀이용 추첨이며 내 생일 별자리나 운세 예보가 아니에요.</p>
      </div>
    </div>
  );
}

export default function Happy({ chosen, setChosen, section }) {
  const date = useMemo(() => kstDateString(), []);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [kind, setKind] = useState('tarot');
  const [decks, setDecks] = useState({});
  const [cardNo, setCardNo] = useState(null);
  const [go, setGo] = useState(false);
  const [shown, setShown] = useState(false);
  const [mission, setMission] = useState(null);
  const refs = { pos: useRef(null), message: useRef(null), place: useRef(null) };

  useEffect(() => {
    Promise.all([loadTarot().catch(() => null), loadHexagrams().catch(() => null), loadZodiac().catch(() => null)])
      .then(([tarot, iching, zodiac]) => setDecks({ tarot, iching, zodiac }));
  }, []);
  useEffect(() => { refs[section]?.current?.scrollIntoView?.({ block: 'start' }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [section]);

  useEffect(() => {
    setGo(false); setShown(false); setCardNo(null);
    if (!chosen) return;
    PICKERS[kind]({ date, np: chosen.text }).then(setCardNo);
  }, [chosen, kind, date]);

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
          <li>멈춘 칸이 오늘의 행복메시지(조언)예요.</li>
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
        {shown && card && <Message kind={kind} card={card} />}
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
        <MeetPlaces idPrefix="happy-meet" />
      </section>
    </div>
  );
}
