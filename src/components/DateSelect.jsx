// 날짜 고르기: 연대 → 년 → 월 → 일 (달력에서 1960년대까지 넘기다 실수하는 문제, 사용자 요청 2026-10-14)
// 올해(가장 최근 연도)는 보는 날의 연도로 저절로 바뀐다. value / onChange: 'YYYY-MM-DD' (다 고르기 전에는 '')
import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');
const daysIn = (y, m) => (y && m ? new Date(Date.UTC(Number(y), Number(m), 0)).getUTCDate() : 31);

export default function DateSelect({ label, value, onChange, maxYear = new Date().getFullYear(), minYear = 1920, hintId }) {
  const [dec, setDec] = useState(value ? String(Math.floor(Number(value.slice(0, 4)) / 10) * 10) : '');
  const [y, setY] = useState(value ? value.slice(0, 4) : '');
  const [m, setM] = useState(value ? String(Number(value.slice(5, 7))) : '');
  const [d, setD] = useState(value ? String(Number(value.slice(8, 10))) : '');
  // 다 골랐을 때만 날짜로 알린다
  useEffect(() => {
    const ok = y && m && d && Number(d) <= daysIn(y, m);
    const next = ok ? `${y}-${pad(m)}-${pad(d)}` : '';
    if (next !== value) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, m, d]);

  const decades = [];
  for (let x = Math.floor(maxYear / 10) * 10; x >= Math.floor(minYear / 10) * 10; x -= 10) decades.push(x);
  const years = [];
  if (dec) for (let yy = Math.min(Number(dec) + 9, maxYear); yy >= Math.max(Number(dec), minYear); yy--) years.push(yy);
  const max = daysIn(y, m);
  const pickDec = (v) => {
    setDec(v);
    if (!v || !y || Math.floor(Number(y) / 10) * 10 !== Number(v)) setY('');
  };
  return (
    <fieldset className="field date-select">
      <legend>{label} <span className="req">필수</span></legend>
      <div className="date-row">
        <label>
          <span className="sr">{label} 연대</span>
          <select value={dec} onChange={(e) => pickDec(e.target.value)} aria-describedby={hintId}>
            <option value="">연대</option>
            {decades.map((x) => <option key={x} value={x}>{x}년대</option>)}
          </select>
        </label>
        <label>
          <span className="sr">{label} 년</span>
          <select value={y} onChange={(e) => setY(e.target.value)} disabled={!dec}>
            <option value="">년</option>
            {years.map((yy) => <option key={yy} value={yy}>{yy}년</option>)}
          </select>
        </label>
        <label>
          <span className="sr">{label} 월</span>
          <select value={m} onChange={(e) => setM(e.target.value)}>
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}월</option>)}
          </select>
        </label>
        <label>
          <span className="sr">{label} 일</span>
          <select value={d} onChange={(e) => setD(e.target.value)}>
            <option value="">일</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1} disabled={i + 1 > max}>{i + 1}일</option>)}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
