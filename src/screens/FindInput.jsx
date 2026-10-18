import ChipGroup from '../components/ChipGroup.jsx';
import MeetSection from '../components/MeetSection.jsx';
import DateSelect from '../components/DateSelect.jsx';
import FlowIcon from '../components/FlowIcon.jsx';
import { MBTI_TYPES } from '../engine/constants.js';
import { digitsFrom, mbtiDigits } from '../engine/landNumber.js';
import { flowOf } from '../lib/flows.js';

export const initialFind = { flow: 'mine', kind: 'birthday', date: '', phone: '010-', number: '', who: '나', whoText: '', label: '첫 만난 날', labelText: '', mbtiA: '', mbtiB: '' };

const MINE_KINDS = [
  { id: 'birthday', name: '생일' },
  { id: 'phone', name: '전화번호' },
  { id: 'number', name: '의미 있는 수' },
];
export const WHO = ['나', '연인', '친구', '아내', '남편', '딸', '아들', '엄마', '아빠', '직접 쓰기'];
export const ANNIV = ['첫 만난 날', '결혼기념일', '사귄 날', '아이 생일', '직접 쓰기'];

/** 메뉴에 따라 실제로 쓰는 번호 종류 */
export const kindOf = (f) => (f.flow === 'mine' ? f.kind : f.flow === 'mbti' ? 'mbti' : 'anniv');

export function digitsOf(f) {
  const kind = kindOf(f);
  if (kind === 'mbti') return mbtiDigits(f.mbtiA, f.mbtiB);
  if (kind === 'birthday' || kind === 'anniv') return digitsFrom('date', f.date);
  if (kind === 'phone') return digitsFrom('phone', f.phone);
  return digitsFrom('number', f.number);
}

/** 1단계: 번호 넣기. flow: 'mine' | 'us' | 'mbti' */
export default function FindInput({ flow, find, setFind, busy, onNext }) {
  const f = flowOf(flow);
  const set = (patch) => setFind((x) => ({ ...x, ...patch }));
  const kind = kindOf(find);
  const digits = digitsOf(find);
  const isDate = kind === 'birthday' || kind === 'anniv';
  const mbtiOk = flow !== 'mbti' || (find.mbtiA && find.mbtiB);

  const mbtiBox = (
    <fieldset className="field mbti-box">
      <legend>두 사람의 MBTI <span className="req">필수</span></legend>
      <div className="selects">
        <label>
          <span className="code-label">나</span>
          <select value={find.mbtiA} onChange={(e) => set({ mbtiA: e.target.value })}>
            <option value="">MBTI 고르기</option>
            {MBTI_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          <span className="code-label">상대</span>
          <select value={find.mbtiB} onChange={(e) => set({ mbtiB: e.target.value })}>
            <option value="">MBTI 고르기</option>
            {MBTI_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <p className="hint" id="mbti-hint" role="status">{digits ? `숫자 8자리: ${digits.slice(0, 4)} ${digits.slice(4)} — 휴대폰 자판처럼 글자를 숫자로 바꿨어요.` : '휴대폰 자판처럼 MBTI 8글자를 숫자 8자리로 바꿔요. 예: ESTJ + INFP → 3785 4637'}</p>
      <p className="hint">누가 먼저 넣어도 같은 번호예요. 추천 별은 놀이용 추첨이라 궁합을 평가하지 않아요.</p>
    </fieldset>
  );

  return (
    <section className="input-screen">
      <p className="eyebrow flow-eyebrow"><FlowIcon id={flow} size={18} /> {f.name} · 1 / 2</p>
      <h1>{f.h1}</h1>
      <p className="lead">{f.lead}</p>
      {flow === 'us' && (
        <button type="button" className="link-btn jump-meet" onClick={() => document.getElementById('meet')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          데이트 장소만 찾을래요 → 우리 둘 만남 별자리
        </button>
      )}

      {flow === 'mbti' && mbtiBox}

      {flow === 'mine' && <ChipGroup label="번호 종류" options={MINE_KINDS} value={find.kind} onChange={(k) => set({ kind: k })} />}

      {flow === 'mine' && kind === 'birthday' && (
        <>
          <ChipGroup label="누구의 생일인가요?" options={WHO.map((w) => ({ id: w, name: w }))} value={find.who} onChange={(who) => set({ who })} />
          {find.who === '직접 쓰기' && (
            <label className="text-field">
              <span>누구인지 써 주세요</span>
              <input type="text" maxLength={10} placeholder="예: 할머니, 우리 강아지" value={find.whoText} onChange={(e) => set({ whoText: e.target.value })} />
            </label>
          )}
        </>
      )}

      {flow === 'us' && (
        <>
          <ChipGroup label="어떤 날인가요?" options={ANNIV.map((a) => ({ id: a, name: a }))} value={find.label} onChange={(label) => set({ label })} />
          {find.label === '직접 쓰기' && (
            <label className="text-field">
              <span>날짜 이름을 써 주세요</span>
              <input type="text" maxLength={12} placeholder="예: 프러포즈한 날" value={find.labelText} onChange={(e) => set({ labelText: e.target.value })} />
            </label>
          )}
        </>
      )}

      {isDate && (
        <div className="field">
          <DateSelect key={flow} label="날짜" value={find.date} onChange={(date) => set({ date })} hintId="date-hint" />
          <p className="hint" id="date-hint">{digits ? `숫자 8자리: ${digits.slice(0, 4)} ${digits.slice(4)}` : '연대 → 년 → 월 → 일 순서로 골라 주세요. 예: 1960년대 → 1962년 → 3월 → 7일 = 1962 0307'}</p>
        </div>
      )}

      {kind === 'phone' && (
        <div className="field">
          <label className="text-field">
            <span>전화번호 <span className="req">필수</span></span>
            <input type="text" inputMode="tel" autoComplete="off" placeholder="010-0000-0000" value={find.phone} onChange={(e) => set({ phone: e.target.value })} aria-describedby="phone-hint" />
          </label>
          <p className="hint" id="phone-hint">뒤 8자리만 써요. 결과 화면에서는 번호 가운데를 가려서 보여 줘요.</p>
        </div>
      )}

      {kind === 'number' && (
        <div className="field">
          <label className="text-field">
            <span>의미 있는 수 <span className="req">필수</span> 숫자 8자리(띄어쓰기 무관)</span>
            <input type="text" inputMode="numeric" autoComplete="off" maxLength={12} placeholder="예: 우리 집 첫 차 번호, 행운의 숫자 1234 5678" value={find.number} onChange={(e) => set({ number: e.target.value })} />
          </label>
        </div>
      )}

      <div className="submit-bar">
        {!mbtiOk && <p className="hint" role="status">두 사람의 MBTI를 모두 골라 주세요.</p>}
        {mbtiOk && !digits && kind !== 'mbti' && <p className="hint" role="status">{isDate ? '날짜를 골라 주세요.' : kind === 'phone' ? '전화번호를 8자리 이상 넣어 주세요.' : '숫자 8자리를 넣어 주세요.'}</p>}
        <button type="button" className="primary" disabled={!digits || !mbtiOk || busy} onClick={() => onNext(digits)}>
          {busy ? '전국에서 찾는 중…' : flow === 'mbti' ? '추천 별 받기' : '후보 별 보기'}
        </button>
      </div>
      {flow === 'us' && <MeetSection digits={digits} />}
    </section>
  );
}
