import { lazy, Suspense, useState } from 'react';
import { maskNationalPoint } from '../engine/landNumber.js';
import { LAND_NAME } from '../lib/brand.js';
import { MESSAGE_MAX } from '../engine/giftLink.js';
import FlowIcon from '../components/FlowIcon.jsx';
import { flowOf } from '../lib/flows.js';

const LandMap = lazy(() => import('../components/LandMap.jsx'));

/** 2단계: 전국 후보 별 중 내 별땅 고르기 */
export default function FindPick({ pick, find, busy, onChoose }) {
  const { candidates, rec, digits } = pick;
  const [sel, setSel] = useState(rec >= 0 ? rec : -1);
  const [reason, setReason] = useState('');
  const masked = find.kind === 'phone';
  const show = (t) => (masked ? maskNationalPoint(t) : t);
  const chosen = sel >= 0 ? candidates[sel] : null;
  return (
    <section className="input-screen pick-screen">
      <p className="eyebrow flow-eyebrow"><FlowIcon id={pick.flow} size={18} /> {flowOf(pick.flow).name} · 2 / 2</p>
      <h1>전국에 별이 {candidates.length}개 떴어요</h1>
      <p className="lead">
        같은 숫자 {masked ? '8자리' : `${digits.slice(0, 4)} ${digits.slice(4)}`}가 100km 구역마다 한 번씩 있어서, 육지에 떨어진 곳이 {candidates.length}곳이에요.
        마음에 드는 곳 하나를 골라 내 {LAND_NAME}으로 삼아 보세요.
      </p>
      {rec >= 0 && (
        <p className="notice rec-note">
          두 사람의 MBTI가 추천한 별은 <b>{rec + 1}번 {candidates[rec].place}</b>이에요. 미리 골라 두었어요. 다른 곳이 더 좋으면 바꿔도 돼요.
        </p>
      )}

      <Suspense fallback={<p className="loading">지도를 불러오는 중…</p>}>
        <LandMap
          points={candidates.map((c, i) => ({ id: String(i), lat: c.lat, lon: c.lon, label: String(i + 1), title: `${i + 1}. ${c.place}`, kind: i === sel ? 'mine' : i === rec ? 'rec' : 'cand' }))}
          onSelect={(id) => setSel(Number(id))}
          ariaLabel={`지도: 후보 별 ${candidates.length}개. 같은 내용이 아래 목록에 있어요.`}
        />
      </Suspense>

      <fieldset className="field">
        <legend>내 {LAND_NAME} 고르기</legend>
        <div role="radiogroup" aria-label={`내 ${LAND_NAME} 고르기`}>
        <ul className="cand-list">
          {candidates.map((c, i) => (
            <li key={c.zone}>
              <button type="button" role="radio" aria-checked={sel === i} className={sel === i ? 'on' : ''} onClick={() => setSel(i)}>
                <span className="cand-no">{i + 1}</span>
                <span className="cand-name">
                  {c.place}
                  {i === rec && <span className="badge rec">두 사람 추천</span>}
                </span>
                <span className="np-badge"><span className="np">{show(c.text)}</span></span>
              </button>
            </li>
          ))}
        </ul>
        </div>
        <p className="hint">바다에 떨어진 곳은 아직 고를 수 없어요. 고향, 여행지, 살고 싶은 곳처럼 이유가 있는 곳을 골라 보세요.</p>
      </fieldset>

      {chosen && (
        <label className="text-field">
          <span>고른 이유 한 줄 <span className="opt">선택</span></span>
          <input type="text" maxLength={MESSAGE_MAX} placeholder="예: 우리가 처음 여행 간 바다 근처" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      )}

      <div className="submit-bar">
        <button type="button" className="primary" disabled={!chosen || busy} onClick={() => onChoose(chosen, reason.trim())}>
          {busy ? '별땅 문서를 만드는 중…' : chosen ? `${chosen.sggName}에 내 ${LAND_NAME} 정하기` : '후보를 하나 골라 주세요'}
        </button>
        <a className="linkish" href={`#/${pick.flow}/1`}>번호 다시 넣기</a>
      </div>
    </section>
  );
}
