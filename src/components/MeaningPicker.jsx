// 의미 있는 숫자 고르기 → 국가지점 후보 목록 → 한 곳 고르기 (2026-10-18 구조 변경, docs/spec.md 5장)
// 입력 방식: 생년월일 · 전화번호 · MBTI. 입력은 이 기기 안에서만 계산하고 저장·전송하지 않는다.
import { useState } from 'react';
import DateSelect from './DateSelect.jsx';
import NationalPointBadge from './NationalPointBadge.jsx';
import { digitsFrom, maskNationalPoint } from '../engine/landNumber.js';
import { landCandidates } from '../lib/landLookup.js';

const METHODS = [
  { id: 'date', label: '생년월일' },
  { id: 'phone', label: '전화번호' },
  { id: 'mbti', label: 'MBTI' },
];
const MBTI = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'];

export default function MeaningPicker({ onChosen }) {
  const [method, setMethod] = useState('date');
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('010-');
  const [mbti, setMbti] = useState('');
  const [cands, setCands] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const value = method === 'date' ? date : method === 'phone' ? phone : mbti;
  const digits = digitsFrom(method, value);

  async function showCandidates() {
    if (!digits) return;
    setBusy(true); setError('');
    try {
      const list = await landCandidates(digits);
      setCands(list);
      if (!list.length) setError('이 숫자로는 육지에 닿는 곳이 없어요. 다른 방식으로 넣어 보세요.');
    } catch {
      setError('후보를 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const masked = method === 'phone';
  return (
    <div className="picker">
      <section aria-labelledby="pick1-h">
        <h2 id="pick1-h"><span className="step-no">1</span> 의미 있는 숫자 넣기</h2>
        <p className="privacy">🔒 입력한 생년월일·전화번호·MBTI는 <strong>이 기기 안에서만</strong> 계산에 쓰고, 저장하거나 밖으로 보내지 않아요.</p>
        <div className="chips" role="radiogroup" aria-label="입력 방식">
          {METHODS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={method === m.id} className={method === m.id ? 'on' : ''}
              onClick={() => { setMethod(m.id); setCands(null); setError(''); }}>{m.label}</button>
          ))}
        </div>
        {method === 'date' && <DateSelect label="생년월일" value={date} onChange={(v) => { setDate(v); setCands(null); }} />}
        {method === 'phone' && (
          <label className="field-inline">전화번호
            <input type="tel" inputMode="numeric" autoComplete="off" value={phone} onChange={(e) => { setPhone(e.target.value); setCands(null); }} />
            <span className="tiny muted">마지막 8자리를 써요. 화면에서는 가운데를 가려서 보여 드려요.</span>
          </label>
        )}
        {method === 'mbti' && (
          <label className="field-inline">MBTI
            <select value={mbti} onChange={(e) => { setMbti(e.target.value); setCands(null); }}>
              <option value="">고르세요</option>
              {MBTI.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="tiny muted">글자마다 알파벳 순서 두 자리로 바꿔요(예: ESTJ → 05·19·20·10).</span>
          </label>
        )}
        <button type="button" className="cta" disabled={!digits || busy} onClick={showCandidates}>{busy ? '찾는 중…' : '맞는 지역 보기'}</button>
        {error && <p className="warn" role="alert">{error}</p>}
      </section>

      {cands?.length > 0 && (
        <section aria-labelledby="pick2-h">
          <h2 id="pick2-h"><span className="step-no">2</span> 마음에 드는 곳 고르기 <span className="muted tiny">({cands.length}곳)</span></h2>
          <p className="tiny muted">같은 숫자가 국가지점번호로 들어 있는 곳들이에요. 한 곳을 고르면 그곳을 중심으로 행운을 봐요.</p>
          <ul className="cand-list">
            {cands.map((c) => (
              <li key={c.text}>
                <button type="button" onClick={() => onChosen({ ...c, masked, npShown: masked ? maskNationalPoint(c.text) : c.text })}>
                  <strong>{c.place}</strong>
                  <NationalPointBadge np={{ text: masked ? maskNationalPoint(c.text) : c.text }} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** 고른 곳 표시 줄 */
export function ChosenBar({ chosen, onChange }) {
  return (
    <div className="chosen-bar">
      <div>
        <span className="tiny muted">고른 곳</span>
        <p><strong>{chosen.place}</strong> <NationalPointBadge np={{ text: chosen.npShown }} /></p>
      </div>
      <button type="button" className="ghost small" onClick={onChange}>다른 곳 고르기</button>
    </div>
  );
}

export const RANGES = [[1.5, '걸어서 1.5km'], [6, '가까운 곳 6km'], [15, '조금 먼 곳 15km'], [60, '당일치기 60km']];
export const RANGE_LABELS = Object.fromEntries(RANGES);

export function DistanceChips({ value, onChange }) {
  return (
    <div className="chips small" role="radiogroup" aria-label="거리">
      {RANGES.map(([k, label]) => (
        <button key={k} type="button" role="radio" aria-checked={k === value} className={k === value ? 'on' : ''} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  );
}
