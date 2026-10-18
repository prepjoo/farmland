import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
// 글꼴: 시안 C (2026-10-13). 사이트 안에서 제공(외부 글꼴 서버 없음, SIL 오픈 폰트 라이선스)
import '@fontsource/do-hyeon/400.css';
import '@fontsource/gothic-a1/400.css';
import '@fontsource/gothic-a1/600.css';
import '@fontsource/gothic-a1/800.css';
import '@fontsource/nanum-myeongjo/400.css'; // 별땅문서 이미지용 (SIL OFL)
import '@fontsource/nanum-myeongjo/700.css';
import '@fontsource/nanum-myeongjo/800.css';
import './styles/base.css';
import './styles/farm.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
