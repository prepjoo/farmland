// 귀땅 화면 틀: 머리(로고 · [긴급 신고] · [메뉴] 풀다운) · 본문 (2026-10-19 메인: 여기·행복·행운)
// 고른 곳(국가지점 후보)은 입력한 숫자와 같으므로 저장하지 않고, 이 화면을 연 동안만 기억해 두 기능이 함께 쓴다.
import { useEffect, useRef, useState } from 'react';
import { useHashRoute } from './lib/useHashRoute.js';
import Home from './screens/Home.jsx';
import Happy from './screens/Happy.jsx';
import Luck from './screens/Luck.jsx';
import Village from './screens/Village.jsx';
import Learn from './screens/Learn.jsx';
import Placeholder from './screens/Placeholder.jsx';
import Sos from './screens/Sos.jsx';
import Here from './screens/Here.jsx';
import { SITE_NAME, NOT_OFFICIAL, HELPLINE } from './lib/brand.js';
import { clearAll } from './lib/luck.js';

const MENU = [
  { href: '#/', label: '처음 화면' },
  { href: '#/here', label: '여긴 어디?' },
  { href: '#/happy', label: '행복' },
  { href: '#/luck', label: '행운' },
  { href: '#/my', label: '내 귀땅 마을' },
  { href: '#/learn', label: '국가지점번호란?' },
];

function MenuButton({ route }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setOpen(false); }, [route]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      <button type="button" className="menu-btn" aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        메뉴
      </button>
      {open && (
        <nav id="main-menu" className="menu-panel" aria-label="전체 메뉴">
          {MENU.map((m) => (
            <a key={m.href} href={m.href} aria-current={`#${route}` === m.href || (m.href !== '#/' && `#${route}`.startsWith(`${m.href}/`)) ? 'page' : undefined}>{m.label}</a>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const [chosen, setChosen] = useState(null);
  let screen;
  const [top, sub] = route.split('/').filter(Boolean);
  if (route === '/' || route === '') screen = <Home />;
  else if (top === 'happy' || top === 'today') screen = <Happy chosen={chosen} setChosen={setChosen} section={sub} />;
  else if (top === 'luck' || top === 'week') screen = <Luck chosen={chosen} setChosen={setChosen} section={sub} />;
  else if (route === '/meet') screen = <Happy chosen={chosen} setChosen={setChosen} section="place" />; // 옛 ‘우리 어디?’ 주소
  else if (route === '/my') screen = <Village />;
  else if (route === '/learn') screen = <Learn />;
  else if (route === '/sos') screen = <Sos />;
  else if (route === '/here') screen = <Here />;
  else screen = <Placeholder title="페이지를 찾을 수 없어요" />;

  return (
    <div className="app farm" data-menu={route === '/sos' ? 'sos' : 'luck'}>
      <header className="top">
        <a href="#/" className="logo">{SITE_NAME}</a>
        <nav className="top-quick" aria-label="바로가기">
          <a href="#/sos" className="mini sos" aria-current={route === '/sos' ? 'page' : undefined} aria-label="긴급 신고: 119·112 전화, 내 위치 문자">긴급 신고</a>
          <MenuButton route={route} />
        </nav>
      </header>
      <main>{screen}</main>
      <footer className="foot">
        <p>{NOT_OFFICIAL}</p>
        <p>{HELPLINE}</p>
        <p>개인정보: 생년월일·전화번호·MBTI는 이 기기 안에서 계산만 하고 저장하거나 보내지 않아요. 고른 곳도 이 화면을 연 동안만 기억해요. 지도 그림은 OpenStreetMap 서버에서 받아 와서, 보고 있는 지도 범위가 그 서버에 전달돼요. 위치는 [여긴 어디?]·[내 위치 찾기]·[위치찾기]·[긴급 신고]를 눌렀을 때만 찾고 저장하지 않아요. 길찾기를 누르면 장소 위치가 카카오맵으로 가고, 행운장소 [출발] 길찾기에는 행운위치도 함께 가요.</p>
        <p>판매점 자료: 공공데이터포털 ‘기획예산처 온라인복권 1등 당첨 판매점 현황 정보’(이용허락범위 제한 없음). 공개 장소: 한국관광공사 TourAPI. 행정구역 경계: 통계청 SGIS(공공누리 제1유형) 행정동 경계를 가공한 vuski/admdongkor(CC BY 4.0).</p>
        <p><button type="button" className="link-btn" onClick={() => { clearAll(); window.location.reload(); }}>이 기기에 저장한 것 모두 지우기</button></p>
      </footer>
    </div>
  );
}
