// 동네 고르기: 시·도 → 시·군·구 → 읍·면·동(골라도 되고 안 골라도 됨). 고른 동네는 화면 메모리에만.
import { useEffect, useState } from 'react';
import { loadRegionIndex } from '../lib/data.js';
import { loadDongs } from '../lib/runMeet.js';

export default function RegionPicker({ who, value, onChange }) {
  const [idx, setIdx] = useState(null);
  const [dongs, setDongs] = useState([]);
  useEffect(() => { loadRegionIndex().then(setIdx).catch(() => setIdx(null)); }, []);
  useEffect(() => {
    let alive = true;
    setDongs([]);
    if (!value.sido || !value.sgg) return undefined;
    loadDongs(value.sido)
      .then((fs) => alive && setDongs(fs.filter((f) => f.properties.sgg === value.sgg).map((f) => f.properties).sort((a, b) => a.name.localeCompare(b.name, 'ko'))))
      .catch(() => alive && setDongs([]));
    return () => { alive = false; };
  }, [value.sido, value.sgg]);
  const sggs = idx ? idx.sgg.filter((g) => g.sido === value.sido).sort((a, b) => a.name.localeCompare(b.name, 'ko')) : [];
  const label = (v) => [idx?.sido.find((x) => x.code === v.sido)?.name, idx?.sgg.find((x) => x.code === v.sgg)?.name, dongs.find((x) => x.code === v.dong)?.name].filter(Boolean).join(' ');
  const set = (v) => onChange({ ...v, label: label(v) });
  return (
    <div className="region-pick" role="group" aria-label={`${who} 동네`}>
      <select aria-label={`${who} 시·도`} value={value.sido} onChange={(e) => set({ sido: e.target.value, sgg: '', dong: '' })} disabled={!idx}>
        <option value="">시·도</option>
        {idx?.sido.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
      </select>
      <select aria-label={`${who} 시·군·구`} value={value.sgg} onChange={(e) => set({ ...value, sgg: e.target.value, dong: '' })} disabled={!value.sido}>
        <option value="">시·군·구</option>
        {sggs.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
      </select>
      <select aria-label={`${who} 읍·면·동`} value={value.dong} onChange={(e) => set({ ...value, dong: e.target.value })} disabled={!value.sgg || !dongs.length}>
        <option value="">읍·면·동 (선택)</option>
        {dongs.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
      </select>
    </div>
  );
}

