import { useEffect, useState } from 'react';
import { useHashRoute } from './lib/useHashRoute.js';
import Home from './screens/Home.jsx';
import FindInput, { initialFind, kindOf } from './screens/FindInput.jsx';
import FlowIcon from './components/FlowIcon.jsx';
import { FLOWS, flowOf } from './lib/flows.js';
import FindPick from './screens/FindPick.jsx';
import MyLand from './screens/MyLand.jsx';
import Gift from './screens/Gift.jsx';
import Learn from './screens/Learn.jsx';
import Placeholder from './screens/Placeholder.jsx';
import Archive from './screens/Archive.jsx';
import Sos from './screens/Sos.jsx';
import Here from './screens/Here.jsx';
import { landCandidates, dongNameOf, lookupOne } from './lib/landLookup.js';
import { loadDecks } from './lib/data.js';
import { recommendIndex } from './engine/coupleRecommend.js';
import { guardianCardNumber } from './engine/landCard.js';
import { parseNationalPoint, fromNationalPoint } from './engine/nationalPoint.js';
import { kstDateString } from './engine/kstDate.js';
import { SITE_NAME } from './lib/brand.js';

const go = (hash) => {
  window.location.hash = hash;
  window.scrollTo(0, 0);
};

/** 별땅 번호 → 수호 카드 (오늘의 행운 카드는 화면을 열 때마다 LandView에서 뽑는다) */
export async function cardsFor(np) {
  const { tarot } = await loadDecks();
  const p = parseNationalPoint(np);
  return { guardian: tarot.cards.find((c) => c.n === guardianCardNumber(p.east + p.north)) };
}

export default function App() {
  const route = useHashRoute();
  const [find, setFind] = useState(initialFind);
  const [pick, setPick] = useState(null); // { digits, candidates, rec }
  const [land, setLand] = useState(null); // 고른 별땅
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(fn) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError('계산하지 못했어요. 잠시 뒤 다시 눌러 주세요.');
    } finally {
      setBusy(false);
    }
  }

  /** 1단계 → 2단계: 후보 찾기 (+ 연인이면 추천 별) */
  const showCandidates = (digits) =>
    run(async () => {
      const candidates = await landCandidates(digits);
      const rec = find.flow === 'mbti' && find.mbtiA && find.mbtiB ? await recommendIndex({ mbtiA: find.mbtiA, mbtiB: find.mbtiB, digits, count: candidates.length }) : -1;
      setPick({ digits, candidates, rec, flow: find.flow });
      go(`#/${find.flow}/2`);
    });

  /** 2단계 → 내 별땅 */
  const chooseLand = (cand, reason) =>
    run(async () => {
      const dong = await dongNameOf(cand);
      const kind = kindOf(find);
      const date = kind === 'birthday' || kind === 'anniv' ? find.date : null;
      const cards = await cardsFor(cand.text);
      setLand({ ...cand, dong, reason, kind, flow: find.flow, date, label: labelOf(find), masked: kind === 'phone', ...cards });
      go('#/land');
    });

  /** 보관함에서 다시 열기 */
  const openSaved = (item) =>
    run(async () => {
      const p = parseNationalPoint(item.np);
      const pos = fromNationalPoint(p);
      const one = await lookupOne({ ...p, text: item.np, ...pos });
      const dong = one.sea ? '' : await dongNameOf(one);
      const cards = await cardsFor(item.np);
      setLand({ ...one, dong, reason: item.reason, kind: item.kind, flow: item.flow, date: item.date, label: item.label, masked: item.masked, ...cards });
      go('#/land');
    });

  const old = route.match(/^\/find(?:\/(\d))?$/); // 예전 주소(#/find)는 '내 별땅'으로
  const step = old ? ['', 'mine', old[1]] : route.match(/^\/(mine|us|mbti)(?:\/(\d))?$/);
  const flowId = step?.[1];
  useEffect(() => {
    if (flowId && find.flow !== flowId) setFind((f) => ({ ...f, flow: flowId }));
  }, [flowId, find.flow]);
  let screen;
  if (route === '/' || route === '') screen = <Home onOpen={openSaved} />;
  else if (step && Number(step[2] ?? 1) === 2 && pick && pick.flow === flowId) screen = <FindPick pick={pick} find={find} busy={busy} onChoose={chooseLand} />;
  else if (step) screen = find.flow === flowId ? <FindInput key={flowId} flow={flowId} find={find} setFind={setFind} busy={busy} onNext={showCandidates} /> : null;
  else if (route === '/land') screen = land ? <MyLand land={land} /> : <Placeholder title="아직 고른 별땅이 없어요" />;
  else if (route === '/g') screen = <Gift />;
  else if (route === '/learn') screen = <Learn />;
  else if (route === '/sos') screen = <Sos />;
  else if (route === '/here') screen = <Here />;
  else if (route === '/archive') screen = <Archive onOpen={openSaved} />;
  else screen = <Placeholder title="페이지를 찾을 수 없어요" />;

  const current = flowId ?? (route === '/land' ? land?.flow : null);
  const menu = route === '/sos' ? 'sos' : current ? flowOf(current).menu : route === '/land' || route === '/g' ? 'land' : 'home';
  return (
    <div className="app" data-menu={menu}>
      <header className="top">
        <a href="#/" className="logo">{SITE_NAME}</a>
        <nav className="top-menu" aria-label="주메뉴">
          {FLOWS.map((f) => (
            <a key={f.id} href={`#/${f.id}/1`} className={`flow-link ${f.menu}`} aria-current={current === f.id ? 'page' : undefined} title={f.name}>
              <FlowIcon id={f.id} size={22} />
              <span>{f.short}</span>
            </a>
          ))}
          <a href="#/archive" className="flow-link extra sep" aria-current={route === '/archive' ? 'page' : undefined}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3.5 7.5h17v12a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" /><path d="M2.5 3.5h19v4h-19zM9.5 11.5h5" /></svg>
            <span>보관함</span>
          </a>
          <a href="#/learn" className="flow-link extra" aria-current={route === '/learn' ? 'page' : undefined} title="국가지점번호란?">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" /></svg>
            <span>국가지점?</span>
          </a>
        </nav>
        <nav className="top-quick" aria-label="바로가기">
          <a href="#/here" className="mini here" aria-current={route === '/here' ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></svg>
            내 위치
          </a>
          <a href="#/sos" className="mini sos" aria-current={route === '/sos' ? 'page' : undefined} aria-label="긴급 신고: 119·112 전화, 내 위치 문자">긴급 신고</a>
        </nav>
      </header>
      <main>
        {error && <p className="warn" role="alert">{error}</p>}
        {screen}
      </main>
      <footer className="foot">
        <p>개인정보: 넣은 번호·MBTI는 이 기기 안에서만 계산하고 서버로 보내지 않아요. 선물 링크에는 별땅 번호·카드·한 줄 메시지만 담겨요. 지도 그림은 OpenStreetMap 서버에서 받아 와서, 보고 있는 지도 범위가 그 서버에 전달돼요.</p>
        <p>위치는 오른쪽 위 [내 위치]·[긴급 신고]를 눌렀을 때만 찾고, 화면에서만 쓰며 저장하거나 보내지 않아요.</p>
        <p>표시되는 국가지점번호는 계산값이에요. 별땅은 실제 토지 소유권과 관계없는 기념 표시예요.</p>
        <p>행정구역 경계: 통계청 SGIS(공공누리 제1유형) 행정동 경계를 가공한 vuski/admdongkor 자료(CC BY 4.0)를 간략화해 사용합니다.</p>
      </footer>
    </div>
  );
}

function labelOf(f) {
  const kind = kindOf(f);
  if (kind === 'birthday') {
    const who = f.who === '직접 쓰기' ? f.whoText.trim() : f.who;
    return !who || who === '나' ? '내 생일' : `${who} 생일`;
  }
  if (kind === 'anniv') {
    const name = (f.label === '직접 쓰기' ? f.labelText.trim() : f.label) || '기념일';
    return name;
  }
  if (kind === 'phone') return '전화번호';
  if (kind === 'mbti') return 'MBTI 별땅';
  return '의미 있는 수';
}
