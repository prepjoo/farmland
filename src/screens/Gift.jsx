import { useEffect, useState } from 'react';
import LandView from '../components/LandView.jsx';
import { decodeGift } from '../engine/giftLink.js';
import { parseNationalPoint, fromNationalPoint } from '../engine/nationalPoint.js';
import { lookupOne, dongNameOf } from '../lib/landLookup.js';
import { loadDecks } from '../lib/data.js';
import { guardianCardNumber } from '../engine/landCard.js';
import { saveLand } from '../lib/myLands.js';
import { LAND_NAME, CTA } from '../lib/brand.js';

/** 선물 받은 별땅 (#/g?n=…) */
export default function Gift() {
  const [state, setState] = useState({ status: 'loading' });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const g = decodeGift(window.location.hash.split('?')[1] ?? '');
    if (!g) {
      setState({ status: 'bad' });
      return;
    }
    (async () => {
      const p = parseNationalPoint(g.np);
      const one = await lookupOne({ ...p, text: g.np, ...fromNationalPoint(p) });
      const dong = one.sea ? '' : await dongNameOf(one);
      const { tarot } = await loadDecks();
      const find = (n) => (n == null ? null : tarot.cards.find((c) => c.n === n));
      setState({ status: 'ok', g, land: { ...one, dong }, guardian: find(guardianCardNumber(p.east + p.north)) });
    })().catch(() => setState({ status: 'bad' }));
  }, []);

  if (state.status === 'loading') return <p className="loading">선물을 여는 중…</p>;
  if (state.status === 'bad')
    return (
      <section className="result">
        <h1>선물 링크를 열지 못했어요</h1>
        <p className="lead">링크가 잘렸거나 바뀐 것 같아요. 보낸 사람에게 다시 받아 주세요.</p>
        <a className="btn" href="#/mine/1">{CTA}</a>
      </section>
    );
  const { g, land, guardian } = state;
  const title = land.sea ? `바다 위 ${LAND_NAME}` : `${land.place}${land.dong ? ` ${land.dong}` : ''}`;
  return (
    <section className="result">
      {g.message && <p className="gift-message">“{g.message}”</p>}
      <LandView land={land} guardian={guardian} masked={g.masked} eyebrow={`선물 받은 ${LAND_NAME}`} />
      <div className="actions">
        <a className="primary as-link" href="#/mine/1">나도 {CTA}</a>
        <button type="button" disabled={saved} onClick={() => { saveLand({ np: g.np, place: title, label: '받은 선물', kind: 'gift', date: null, masked: g.masked, reason: g.message }); setSaved(true); }}>
          {saved ? '보관함에 저장했어요' : '받은 별땅 보관함에 저장'}
        </button>
      </div>
    </section>
  );
}
