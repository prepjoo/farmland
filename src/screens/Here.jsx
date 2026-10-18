import { useState } from 'react';
import { describeAccuracy, measuredAt } from '../engine/emergency.js';
import { useLocation } from '../lib/useLocation.js';
import { LAND_NAME } from '../lib/brand.js';

/** 내 위치 국가지점번호: 지금 서 있는 10m 칸의 번호(계산값). 위치는 이 화면에서만 쓰고 저장·전송하지 않는다 */
export default function Here() {
  const { state, locate, refining } = useLocation();
  const [copied, setCopied] = useState(false);
  const fix = state.fix;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${fix.np} (국가지점번호 계산값, 오차 약 ${Math.round(fix.accuracy)}m)`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return (
    <section className="result here">
      <h1>여긴 어디?</h1>
      <p className="sub-title">내 위치 국가지점번호</p>
      <p className="lead">지금 서 있는 가로세로 10m 칸의 번호를 휴대폰 위치로 계산해요. 위치는 이 화면에서만 쓰고 저장하거나 보내지 않아요.</p>

      <article className="card here-card">
        {state.status === 'finding' && !fix && <p className="loading" role="status">위치 찾는 중… 휴대폰이 물어보면 <b>허용</b>을 눌러 주세요.</p>}
        {state.status === 'error' && <p className="warn" role="alert">{state.message}</p>}
        {fix && (
          <div aria-live="polite">
            {fix.np ? (
              <div className="land-stamp big" role="img" aria-label={`지금 내 위치 국가지점번호 ${fix.np}, 계산값`}>
                <span className="np">{fix.np}</span>
                <small>국가지점번호 · 계산값</small>
              </div>
            ) : (
              <p className="warn">국가지점번호 구역 밖이에요(대한민국 밖이거나 먼 바다 위).</p>
            )}
            <p className="hint">오차 약 {Math.round(fix.accuracy)}m · {describeAccuracy(fix.accuracy)}{refining ? ' · 더 정확하게 찾는 중…' : ''}</p>
            <p className="sos-time">{measuredAt(fix.at)} 측정 · 위도 {fix.lat.toFixed(5)}, 경도 {fix.lon.toFixed(5)}</p>
            {fix.np && <p className="hint">이 칸의 숫자는 <b>{fix.np.slice(3)}</b>이에요. 같은 숫자를 가진 생일이나 전화번호가 있다면, 그 사람의 {LAND_NAME} 후보 중 한 곳이 바로 여기예요.</p>}
          </div>
        )}
        <div className="actions">
          <button type="button" className="primary" onClick={locate} disabled={state.status === 'finding'}>
            {state.status === 'finding' ? '위치 찾는 중…' : fix ? '다시 찾기' : '내 위치 찾기'}
          </button>
          {fix?.np && <button type="button" onClick={copy}>{copied ? '복사했어요' : '번호 복사'}</button>}
        </div>
      </article>

      <article className="card">
        <h2>알아 두세요</h2>
        <ul className="facts">
          <li>휴대폰 위치로 계산한 값이라 공식 번호와 다를 수 있어요. 건물 안이나 골짜기에서는 수십 m 이상 틀릴 수 있어요.</li>
          <li>근처에 <b>국가지점번호판</b>이 보이면 그 번호가 정확해요.</li>
          <li>위급할 때는 아래 <b>[긴급 신고]</b>를 눌러 먼저 119·112에 전화하세요.</li>
        </ul>
        <a href="#/learn">국가지점번호 더 알아보기</a>
      </article>
    </section>
  );
}
