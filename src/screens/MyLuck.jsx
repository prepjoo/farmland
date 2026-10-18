// ‘나만의 행운’: 생일·기념일 번호, 둘의 번호 (docs/spec.md 1.2). 입력은 이 기기에서 계산한 뒤 버린다.
import { useMemo, useState } from 'react';
import BallMachine from '../components/BallMachine.jsx';
import { personalNumbers, pairNumbers, roundForDate, drawDateOfRound } from '../engine/lotto.js';
import { kstDateString } from '../engine/kstDate.js';
import { getAge, kDate, prefersReducedMotion } from '../lib/luck.js';
import { ODDS } from '../lib/brand.js';

const MBTI = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];
const ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

function Person({ title, value, onChange }) {
  return (
    <fieldset className="person">
      <legend>{title}</legend>
      <select aria-label={`${title} 방법`} value={value.kind} onChange={(e) => onChange({ kind: e.target.value, v: '' })}>
        <option value="zodiac">띠</option>
        <option value="bday">생일(월·일)</option>
        <option value="mbti">MBTI</option>
      </select>
      {value.kind === 'zodiac' && (
        <select aria-label={`${title} 띠`} value={value.v} onChange={(e) => onChange({ ...value, v: e.target.value })}>
          <option value="">고르세요</option>
          {ZODIAC.map((z, i) => <option key={z} value={String(i).padStart(2, '0')}>{z}띠</option>)}
        </select>
      )}
      {value.kind === 'bday' && (
        <input aria-label={`${title} 생일(월일 4자리)`} inputMode="numeric" maxLength={4} placeholder="예: 0412" value={value.v}
          onChange={(e) => onChange({ ...value, v: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
      )}
      {value.kind === 'mbti' && (
        <select aria-label={`${title} MBTI`} value={value.v} onChange={(e) => onChange({ ...value, v: e.target.value })}>
          <option value="">고르세요</option>
          {MBTI.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      )}
    </fieldset>
  );
}

const validDay = (s) => /^\d{4}$/.test(s) && +s.slice(0, 2) >= 1 && +s.slice(0, 2) <= 12 && +s.slice(2) >= 1 && +s.slice(2) <= 31;
const tokenOf = (p) => (p.kind === 'bday' ? (validDay(p.v) ? `bday:${p.v}` : '') : p.v ? `${p.kind}:${p.v}` : '');

export default function MyLuck() {
  const today = useMemo(() => kstDateString(), []);
  const round = roundForDate(today);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const adult = getAge()?.ok === true;
  const [day, setDay] = useState('');
  const [mine, setMine] = useState(null);
  const [a, setA] = useState({ kind: 'zodiac', v: '' });
  const [b, setB] = useState({ kind: 'zodiac', v: '' });
  const [pair, setPair] = useState(null);

  if (!adult) {
    return (
      <div className="my-luck">
        <h1>나만의 행운</h1>
        <p>행운번호는 만 19세 이상만 볼 수 있어요. <a href="#/">오늘의 행운</a>에서 먼저 확인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="my-luck">
      <h1>나만의 행운</h1>
      <p className="lead">{round}회({kDate(drawDateOfRound(round))} 추첨) 동안 같은 번호가 나와요. 넣은 값은 저장하지 않아요.</p>

      <section aria-labelledby="mine-h">
        <h2 id="mine-h">생일·기념일 행운번호</h2>
        <label className="field-inline">월·일 4자리
          <input inputMode="numeric" maxLength={4} placeholder="예: 0412" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </label>
        <button type="button" className="cta" disabled={!validDay(day)} onClick={async () => setMine(await personalNumbers({ round, dateInput: day }))}>번호 받기</button>
        {mine && <BallMachine key={`m${day}-${mine[0].drawn.join()}`} drawn={mine[0].drawn} play={!reduced} interval={420} label="생일·기념일 행운번호" />}
      </section>

      <section aria-labelledby="pair-h">
        <h2 id="pair-h">둘의 행운번호</h2>
        <p className="tiny muted">두 사람이 각자 다른 방법을 골라도 돼요. 순서를 바꿔도 같은 번호예요.</p>
        <div className="pair-row">
          <Person title="나" value={a} onChange={setA} />
          <Person title="상대" value={b} onChange={setB} />
        </div>
        <button type="button" className="cta" disabled={!tokenOf(a) || !tokenOf(b)} onClick={async () => setPair(await pairNumbers({ round, tokens: [tokenOf(a), tokenOf(b)] }))}>둘의 번호 받기</button>
        {pair && <BallMachine key={`p${pair[0].drawn.join()}`} drawn={pair[0].drawn} play={!reduced} interval={420} label="둘의 행운번호" />}
      </section>
      <p className="odds">{ODDS}</p>
    </div>
  );
}
