// 별땅 한 곳 보여 주기: 이름 → 지도(전국 ↔ 10m 칸 확대) → 수호 카드. (오늘의 행운 카드는 첫 화면으로 옮김) 내 별땅·선물 받은 화면이 함께 쓴다.
import { lazy, Suspense, useState } from 'react';
import TarotArt from './TarotArt.jsx';
import { maskNationalPoint } from '../engine/landNumber.js';
import { cardBearing, bearingWord } from '../engine/landCard.js';
import { DISCLAIMER, LAND_NAME } from '../lib/brand.js';

const LandMap = lazy(() => import('./LandMap.jsx'));

/** 이 땅의 행운 카드: 수호 카드(늘 같음) */
function LuckCards({ guardian, dir }) {
  if (!guardian) return null;
  return (
    <article className="card land-card">
      <h2>이 땅의 행운 카드</h2>
      <div className="land-card-face">
        <TarotArt n={guardian.n} name={guardian.name} size={72} />
        <div>
          <span className="card-role">수호 카드 · 늘 같은 카드</span>
          <b className="cname">{guardian.n}. {guardian.name}</b> <small lang="en">{guardian.en}</small>
          <p className="kw">{guardian.keywords.join(' · ')}</p>
        </div>
      </div>
      <p>{guardian.tradition}</p>
      <p className="luck-line">{guardian.luck}</p>
      <p className="hint">오늘의 행운 카드와 행운의 번호는 <a href="#/">첫 화면</a>에서 매일 새로 뽑아요. 수호 카드는 번호 8자리를 모두 더해 정해서 이 별땅에 늘 붙어 있어요. 카드의 고유 방위로 본 행운의 방향은 {dir}쪽이에요.</p>
    </article>
  );
}

/**
 * land: { text, lat, lon, x, y, place, dong, sea }
 * guardian: 수호 카드(tarot-major.json의 카드)
 * masked: 전화번호라 번호를 가렸는가
 */
export default function LandView({ land, guardian, masked, reason, eyebrow }) {
  const [zoom, setZoom] = useState(false);
  const [reveal, setReveal] = useState(false);
  const shown = masked && !reveal ? maskNationalPoint(land.text) : land.text;
  const title = land.sea ? `바다 위 ${LAND_NAME}` : `${land.place}${land.dong ? ` ${land.dong}` : ''}`;
  const dir = guardian ? bearingWord(cardBearing(guardian.n)) : null;
  return (
    <>
      <section className="result-hero land-hero">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="hero-menu">{LAND_NAME} · 가로세로 10m(약 30평)</p>
        <div className="land-stamp" role="img" aria-label={`국가지점번호 ${shown}, 계산값`}>
          <span className="np">{shown}</span>
          <small>국가지점번호 · 계산값</small>
        </div>
        {masked && (
          <button type="button" className="linkish on-accent" onClick={() => setReveal((v) => !v)} aria-pressed={reveal}>
            {reveal ? '번호 다시 가리기' : '번호 모두 보기'}
          </button>
        )}
        {reason && <p className="land-reason">“{reason}”</p>}
      </section>

      <section className="card map-card">
        <h2>{zoom ? '내 별땅 10m 칸' : '전국 지도 위의 별'}</h2>
        <Suspense fallback={<p className="loading">지도를 불러오는 중…</p>}>
          <LandMap
            points={zoom ? [] : [{ id: 'mine', lat: land.lat, lon: land.lon, label: '', title, kind: 'mine' }]}
            focus={zoom ? { id: 'mine', ...land } : null}
            ariaLabel={`지도: ${title}에 별이 찍혀 있어요. 손가락으로 확대·축소할 수 있어요.`}
          />
        </Suspense>
        <div className="links">
          <button type="button" className="btn" onClick={() => setZoom((v) => !v)}>{zoom ? '전국 보기' : '내 별땅으로 확대'}</button>
        </div>
        {zoom ? (
          <p className="notice cell-note">
            <b>초록 네모 = 가로세로 10m(약 30평) 별땅 칸</b>이에요. 실제 분양이나 소유가 아닌 <b>기념 표시</b>이고, 이 칸은 남의 땅일 수 있으니 찾아가지 마세요.
          </p>
        ) : (
          <p className="hint">[내 별땅으로 확대]를 누르면 10m × 10m 칸이 보여요.</p>
        )}
      </section>

      <LuckCards guardian={guardian} dir={dir} />
      <p className="hint disclaimer">{DISCLAIMER} 카드 풀이는 라이더-웨이트-스미스 타로의 전통 해석(정방향)을 바탕으로 해요.</p>
    </>
  );
}
