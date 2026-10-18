import { useState } from 'react';
import { EMERGENCY_NUMBERS, telHref, smsHref, reportText, sayText, roundAcc, toDms, describeAccuracy, measuredAt } from '../engine/emergency.js';
import { useLocation } from '../lib/useLocation.js';

/**
 * 긴급 신고 (docs/changes.md 일곱 번째, 사용자 결정 2026-10-14)
 * 순서: ① 119에 문자로 내 위치 보내기(가장 크게) → ② 가족·지인에게 위치 보내기 → ③ 전화 신고 + 읽을 문장 → ④ 지금 내 위치 자세히.
 * 들어오면 바로 위치를 찾는다. 위치는 이 화면에서만 쓰고 저장하거나 어디로도 보내지 않는다.
 */
export default function Sos() {
  const { state, locate: find, refining } = useLocation();
  const [shared, setShared] = useState('');
  const locate = () => {
    setShared('');
    find();
  };
  const fix = state.fix;
  const text = fix ? reportText(fix) : '';
  const wide = fix && fix.accuracy > 100;
  const finding = !fix && state.status !== 'error';

  async function shareToFamily() {
    const msg = text.split(' / ').join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ text: msg });
        setShared('보냈어요.');
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(msg);
      setShared('위치 문구를 복사했어요. 카톡·문자 창에 붙여 넣어 가족·지인에게 보내세요.');
    } catch {
      setShared('복사하지 못했어요. 아래 문구를 길게 눌러 복사해 주세요.');
    }
  }

  return (
    <section className="result sos">
      <h1>긴급 신고</h1>
      <p className="lead">지금 위치를 찾아 <b>119에 문자로</b> 바로 보낼 수 있어요. 말할 수 있으면 아래 <b>전화</b>가 가장 빨라요.</p>

      {/* ① 119 문자 */}
      <article className="sos-block sms-block" aria-labelledby="sos-sms">
        <h2 id="sos-sms"><span className="step-no">1</span> 119에 문자로 내 위치 보내기</h2>
        {finding && <p className="sos-finding" role="status">📍 위치를 찾는 중이에요… 휴대폰이 물어보면 <b>허용</b>을 눌러 주세요.</p>}
        {state.status === 'error' && <p className="warn" role="alert">{state.message} 아래 <b>전화</b>로 바로 신고하세요.</p>}
        {fix ? (
          <a className="sos-sms-btn" href={smsHref('119', text)}>
            <span aria-hidden="true">✉</span> 119에 문자 보내기
            <small>{fix.np ? `국가지점번호 ${fix.np}` : '위도·경도'} · 오차 약 {roundAcc(fix.accuracy)}m</small>
          </a>
        ) : (
          <button type="button" className="sos-sms-btn" disabled>
            <span aria-hidden="true">✉</span> 119에 문자 보내기 <small>위치를 찾으면 누를 수 있어요</small>
          </button>
        )}
        {wide && (
          <p className="warn sos-wide" role="alert">오차가 약 {roundAcc(fix.accuracy)}m로 커요. 번호가 실제 위치와 다를 수 있어요. 하늘이 보이는 곳으로 옮긴 뒤 아래 [다시 찾기]를 눌러 주세요. 급하면 먼저 보내고, 다시 찾은 뒤 한 번 더 보내도 돼요.</p>
        )}
        {fix && (
          <>
            <p className="report-label">보낼 문구</p>
            <p className="report-text">{text.split(' / ').map((line) => <span key={line}>{line}</span>)}</p>
          </>
        )}
      </article>

      {/* ② 가족·지인 */}
      <article className="sos-block" aria-labelledby="sos-family">
        <h2 id="sos-family"><span className="step-no">2</span> 가족·지인에게 내 위치 알리기</h2>
        <button type="button" className="sos-family-btn" onClick={shareToFamily} disabled={!fix}>
          <span aria-hidden="true">👪</span> 위치 복사해서 가족·지인에게 보내기
        </button>
        <p className="hint" role="status" aria-live="polite">{shared || '카톡이나 문자로 같은 위치 문구를 보낼 수 있어요.'}</p>
      </article>

      {/* ③ 전화 */}
      <article className="sos-block" aria-labelledby="sos-call">
        <h2 id="sos-call"><span className="step-no">3</span> 말할 수 있으면 전화로 신고하기</h2>
        <div className="sos-calls">
          {EMERGENCY_NUMBERS.map((e) => (
            <a key={e.number} className={`call ${e.number === '119' ? 'call-119' : ''}`} href={telHref(e.number)} aria-label={`${e.name}에 전화 걸기: ${e.desc}`}>
              <span aria-hidden="true">☎</span> <b>{e.number}</b> <small>{e.number === '119' ? '구조·구급' : '경찰'}</small>
            </a>
          ))}
        </div>
        {fix && (
          <div className="say-box">
            <p className="say-label">☎ 전화로 이렇게 읽어 주세요</p>
            <p className="say-text">“{sayText(fix)}”</p>
          </div>
        )}
        <p className="hint">전화가 가장 빨라요. 휴대폰에서 누르면 바로 걸리고, 컴퓨터에서는 걸리지 않아요.</p>
      </article>

      {/* ④ 지금 내 위치 */}
      <article className="card sos-where" aria-labelledby="sos-where">
        <h2 id="sos-where">지금 내 위치</h2>
        {fix ? (
          <div className="sos-fix" aria-live="polite">
            {fix.np ? (
              <>
                <p className="sheet-np">{fix.np}</p>
                <p className="sheet-status">국가지점번호 · 휴대폰으로 계산한 값</p>
              </>
            ) : (
              <p className="warn">국가지점번호 구역 밖이에요(대한민국 밖이거나 먼 바다 위). 위도·경도로 알려 주세요.</p>
            )}
            <p className="hint">
              오차 약 {roundAcc(fix.accuracy)}m · {describeAccuracy(fix.accuracy)}
              {refining ? ' · 더 정확하게 찾는 중…' : ''}
            </p>
            <p className="sos-time">{measuredAt(fix.at)} 측정</p>
            <details className="sos-more">
              <summary>위도·경도 더 보기</summary>
              <dl className="sos-coords">
                <dt>위도·경도</dt><dd>{fix.lat.toFixed(5)}, {fix.lon.toFixed(5)}</dd>
                <dt>도·분·초</dt><dd>{toDms(fix.lat, 'lat')}, {toDms(fix.lon, 'lon')}</dd>
              </dl>
            </details>
          </div>
        ) : (
          <p className="hint">{finding ? '위치를 찾는 중이에요…' : '위치를 찾지 못했어요.'}</p>
        )}
        <button type="button" className="primary" onClick={locate} disabled={state.status === 'finding'}>
          {state.status === 'finding' ? '위치 찾는 중…' : fix ? '다시 찾기' : '내 위치 찾기'}
        </button>
      </article>

      <article className="card">
        <h2>꼭 알아 두세요</h2>
        <ul className="facts">
          <li>말할 수 있다면 <b>전화</b>가 가장 빨라요. 문자는 말하기 어렵거나 소리를 낼 수 없을 때 특히 도움이 돼요.</li>
          <li>번호는 휴대폰 위치로 계산한 값이에요. 오차가 수백 m 이상이면 하늘이 보이는 곳으로 옮긴 뒤 [다시 찾기]를 눌러 주세요.</li>
          <li>근처에 국가지점번호판(산길·해안의 표지판)이 보이면 그 번호도 함께 알려 주세요.</li>
          <li>문자 앱이 열리지 않으면 [위치 복사해서 가족·지인에게 보내기]로 복사한 뒤 119 문자에 붙여 넣으세요.</li>
          <li>이 사이트는 위치를 저장하거나 어디로도 보내지 않아요. 전화와 문자는 휴대폰에서 직접 걸고 보내요.</li>
        </ul>
      </article>
    </section>
  );
}
