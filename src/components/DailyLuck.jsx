// 첫 화면 ‘오늘의 행운’: 하루 한 장의 타로 카드 + 행운의 번호 3개(1~45). 한국 날짜가 바뀌면 새로 뽑는다.
// 기기마다 다르게 나오도록 이 기기에만 무작위 글자 하나를 저장한다(개인정보 아님, 지우면 새로 만든다).
import { useEffect, useState } from 'react';
import TarotArt from './TarotArt.jsx';
import { dailyLuck } from '../engine/daily.js';
import { kstDateString } from '../engine/kstDate.js';
import { loadDecks } from '../lib/data.js';
import { load, save } from '../lib/storage.js';

function deviceSalt() {
  let s = load('dailySalt');
  if (typeof s !== 'string' || s.length < 8) {
    const b = new Uint8Array(8);
    globalThis.crypto.getRandomValues(b);
    s = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    save('dailySalt', s);
  }
  return s;
}

export default function DailyLuck() {
  const [luck, setLuck] = useState(null);
  const date = kstDateString();
  useEffect(() => {
    let alive = true;
    Promise.all([dailyLuck({ date, salt: deviceSalt() }), loadDecks()])
      .then(([d, { tarot }]) => alive && setLuck({ ...d, info: tarot.cards.find((c) => c.n === d.card) }))
      .catch(() => {});
    return () => { alive = false; };
  }, [date]);
  const [y, m, d] = date.split('-').map(Number);
  return (
    <section className="card daily-luck" aria-labelledby="daily-title">
      <p className="eyebrow">{y}년 {m}월 {d}일 · 하루에 한 번 바뀌어요</p>
      <h2 id="daily-title">오늘의 행운</h2>
      {!luck ? <p className="hint">카드를 뽑는 중…</p> : (
        <>
          <div className="daily-face">
            <TarotArt n={luck.info.n} name={luck.info.name} size={84} />
            <div>
              <span className="card-role">오늘의 행운 카드</span>
              <b className="cname">{luck.info.n}. {luck.info.name}</b> <small lang="en">{luck.info.en}</small>
              <p className="luck-line">{luck.info.luck}</p>
            </div>
          </div>
          <details className="year-card">
            <summary><span className="card-role">전통 풀이</span>{luck.info.keywords.join(' · ')}</summary>
            <p>{luck.info.tradition}</p>
          </details>
          <div className="lucky-numbers">
            <span className="card-role" id="lucky-label">오늘의 행운의 번호</span>
            <ul aria-labelledby="lucky-label">
              {luck.numbers.map((n) => <li key={n} className="ball">{n}</li>)}
            </ul>
          </div>
          <p className="hint">카드와 번호는 놀이용 추첨이에요. 행운의 번호는 1~45 중 3개이며 어떤 당첨 확률과도 관계없어요. 내일 다시 오면 새로 뽑아 드려요.</p>
        </>
      )}
    </section>
  );
}
