// ‘내 귀땅 마을’(가상 마을) — 그림 마을 2종, 캐릭터 3가지, 미션 2가지(docs/plan.md, CLAUDE.md 10).
// 1팜은 그림 속 가상 칸(100㎡ 상징)이며 실제 땅·소유가 아니다. 돈으로 사지 않고 현금 가치가 없다.
// 미션은 ‘오늘’(누구나)에만 묶고, 번호 보기·복권 구매·판매점 방문에는 보상하지 않는다.
import { useMemo, useState } from 'react';
import VillageArt, { Pin } from '../components/VillageArt.jsx';
import { THEMES, PINS, chooseTheme, choosePin, doneToday, weekProgress, MAX_DRAWN } from '../engine/village.js';
import { kstDateString } from '../engine/kstDate.js';
import { getVillage, putVillage, clearVillage } from '../lib/luck.js';

const themeName = (id) => THEMES.find((t) => t.id === id)?.name ?? '';
const pinName = (id) => PINS.find((p) => p.id === id)?.name ?? '';

export default function Village() {
  const date = useMemo(() => kstDateString(), []);
  const [v, setV] = useState(() => getVillage());
  const [stored, setStored] = useState(true);
  const [asking, setAsking] = useState(false);

  const update = (next) => {
    if (next === v) return;
    setStored(putVillage(next));
    setV(next);
  };

  const notice = (
    <div className="soon-box village-note">
      <p className="tiny"><strong>1팜은 그림 속 가상 칸</strong>이에요. 100㎡(약 30평)를 상징할 뿐 실제 땅이나 소유와 관계없고, 돈으로 사거나 바꿀 수 없어요.</p>
      <p className="tiny muted">팜은 ‘오늘의 행운 보기’와 ‘이번 주 5일 방문’으로만 늘어요. 번호 보기·복권 구매·판매점 방문에는 팜을 주지 않아요.</p>
    </div>
  );

  if (!v.theme) {
    return (
      <div className="village">
        <h1>내 귀땅 마을</h1>
        <p className="lead">오늘의 행운을 보러 올 때마다 그림 속 내 마을 땅이 한 칸(1팜)씩 넓어져요. 먼저 마을 그림을 골라 주세요.</p>
        <div className="theme-pick" role="group" aria-label="마을 그림 고르기">
          {THEMES.map((t) => (
            <button key={t.id} type="button" className="theme-card" onClick={() => update(choosePin(chooseTheme(v, t.id), v.pin ?? 'sprout'))}>
              <VillageArt theme={t.id} farms={9} pin="sprout" small label={`${t.name} 미리보기 그림`} />
              <strong>{t.name}</strong>
              <span className="tiny muted">{t.line}</span>
            </button>
          ))}
        </div>
        <p className="tiny muted">고르면 첫 1팜이 생겨요. 그림은 나중에 바꿀 수 있어요.</p>
        {notice}
      </div>
    );
  }

  const today = doneToday(v, date);
  const week = weekProgress(v, date);
  return (
    <div className="village">
      <h1>내 귀땅 마을</h1>
      <p className="farm-count"><strong>{v.farms}팜</strong> <span className="muted">· {themeName(v.theme)} · {pinName(v.pin ?? 'sprout')}</span></p>
      <VillageArt theme={v.theme} farms={v.farms} pin={v.pin ?? 'sprout'} label={`${themeName(v.theme)} 그림, 내 땅 ${v.farms}팜`} />
      {v.farms > MAX_DRAWN && <p className="tiny muted">그림에는 {MAX_DRAWN}칸까지 보여요. 나머지 {v.farms - MAX_DRAWN}팜은 숫자로 세어 둘게요.</p>}

      <section aria-labelledby="mission-h">
        <h2 id="mission-h">미션</h2>
        <ul className="missions">
          <li className={today ? 'done' : ''}>
            <div>
              <strong>오늘의 행운 보기</strong> <span className="muted tiny">하루 1팜</span>
              <p className="tiny">{today ? '오늘은 완료했어요. 내일 또 만나요.' : '오늘의 행운 카드를 보면 1팜이 늘어요.'}</p>
            </div>
            {today ? <span className="badge-done">완료</span> : <a className="mission-go" href="#/today">보러 가기</a>}
          </li>
          <li className={week.rewarded ? 'done' : ''}>
            <div>
              <strong>이번 주 5일 방문</strong> <span className="muted tiny">주 1팜</span>
              <p className="tiny">이번 주에 오늘의 행운을 본 날 <strong>{week.done}/{week.goal}일</strong>{week.rewarded ? ' — 이번 주 1팜을 받았어요.' : ''}</p>
              <span className="dots" aria-hidden="true">{Array.from({ length: week.goal }, (_, i) => <i key={i} className={i < week.done ? 'on' : ''} />)}</span>
              <p className="tiny muted">이번 주는 일요일에 새로 시작해요.</p>
            </div>
            {week.rewarded && <span className="badge-done">완료</span>}
          </li>
        </ul>
      </section>

      <section aria-labelledby="deco-h">
        <h2 id="deco-h">꾸미기</h2>
        <p className="tiny muted" id="pin-label">내 캐릭터</p>
        <div className="chips pins" role="radiogroup" aria-labelledby="pin-label">
          {PINS.map((p) => {
            const on = (v.pin ?? 'sprout') === p.id;
            return (
              <button key={p.id} type="button" role="radio" aria-checked={on} className={on ? 'on' : ''} onClick={() => update(choosePin(v, p.id))}>
                <svg viewBox="-20 -48 40 52" width="22" height="28" aria-hidden="true"><Pin id={p.id} x={0} y={0} /></svg>
                {p.name}
              </button>
            );
          })}
        </div>
        <p className="tiny muted" id="theme-label">마을 그림</p>
        <div className="chips" role="radiogroup" aria-labelledby="theme-label">
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={v.theme === t.id} className={v.theme === t.id ? 'on' : ''} onClick={() => update(chooseTheme(v, t.id))}>{t.name}</button>
          ))}
        </div>
      </section>

      {notice}
      <div className="soon-box">
        <p className="tiny">마을 기록(고른 그림·캐릭터·팜 수·미션을 한 날짜)만 이 브라우저에 저장해요. 입력한 숫자나 고른 곳은 남기지 않고, 다른 기기와 이어지지 않아요.</p>
        {!stored && <p className="tiny warn-soft" role="status">이 브라우저에는 저장할 수 없어서, 화면을 닫으면 마을 기록이 사라져요.</p>}
        {!asking && <button type="button" className="link-btn" onClick={() => setAsking(true)}>마을 기록 지우기</button>}
        {asking && (
          <div className="row" role="group" aria-label="마을 기록 지우기 확인">
            <span className="tiny">팜과 미션 기록이 모두 사라져요. 지울까요?</span>
            <button type="button" className="ghost" onClick={() => { clearVillage(); setV(getVillage()); setAsking(false); }}>지우기</button>
            <button type="button" className="ghost" onClick={() => setAsking(false)}>그만두기</button>
          </div>
        )}
      </div>
    </div>
  );
}
