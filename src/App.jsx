// 귀땅 화면 틀: 머리(로고 + 작은 [내 위치]·[긴급 신고]) · 본문 · 아래 탭 4개 (docs/plan.md)
import { useHashRoute } from './lib/useHashRoute.js';
import Today from './screens/Today.jsx';
import PlaceFinder from './screens/PlaceFinder.jsx';
import MyLuck from './screens/MyLuck.jsx';
import Village from './screens/Village.jsx';
import Learn from './screens/Learn.jsx';
import Placeholder from './screens/Placeholder.jsx';
import Sos from './screens/Sos.jsx';
import Here from './screens/Here.jsx';
import { SITE_NAME, NOT_OFFICIAL, HELPLINE } from './lib/brand.js';
import { clearAll } from './lib/luck.js';

const TABS = [
  { path: '/', label: '오늘의 행운', icon: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M7.5 12h9" /></> },
  { path: '/place', label: '행운 장소', icon: <><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></> },
  { path: '/me', label: '나만의 행운', icon: <><path d="M12 3.5l2.6 5.5 6 .7-4.5 4.1 1.2 5.9L12 16.8l-5.3 2.9 1.2-5.9-4.5-4.1 6-.7z" /></> },
  { path: '/my', label: '내 귀땅 마을', icon: <><path d="M3.5 20.5h17M5.5 20.5v-8l6.5-5 6.5 5v8" /><path d="M10 20.5v-5h4v5" /></> },
];

export default function App() {
  const route = useHashRoute();
  let screen;
  if (route === '/' || route === '') screen = <Today />;
  else if (route === '/place') screen = <PlaceFinder />;
  else if (route === '/me') screen = <MyLuck />;
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
          <a href="#/here" className="mini here" aria-current={route === '/here' ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></svg>
            내 위치
          </a>
          <a href="#/sos" className="mini sos" aria-current={route === '/sos' ? 'page' : undefined} aria-label="긴급 신고: 119·112 전화, 내 위치 문자">긴급 신고</a>
        </nav>
      </header>
      <main>{screen}</main>
      <footer className="foot">
        <p>{NOT_OFFICIAL}</p>
        <p>{HELPLINE}</p>
        <p>개인정보: 생일·MBTI 같은 입력은 이 기기 안에서 계산만 하고 저장하거나 보내지 않아요. 지도 그림은 OpenStreetMap 서버에서 받아 와서, 보고 있는 지도 범위가 그 서버에 전달돼요. 위치는 [내 위치]·[긴급 신고]·[내 위치로 찾기]를 눌렀을 때만 찾고 저장하지 않아요.</p>
        <p>판매점 자료: 공공데이터포털 ‘기획예산처 온라인복권 1등 당첨 판매점 현황 정보’(이용허락범위 제한 없음). 행정구역 경계: 통계청 SGIS(공공누리 제1유형) 행정동 경계를 가공한 vuski/admdongkor(CC BY 4.0). <a href="#/learn">국가지점번호란?</a></p>
        <p><button type="button" className="link-btn" onClick={() => { clearAll(); window.location.reload(); }}>이 기기에 저장한 것 모두 지우기</button></p>
      </footer>
      <nav className="tabbar" aria-label="주메뉴">
        {TABS.map((t) => (
          <a key={t.path} href={`#${t.path}`} aria-current={route === t.path || (t.path === '/' && route === '') ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
            <span>{t.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
