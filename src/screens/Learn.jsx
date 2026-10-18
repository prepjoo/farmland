import { useState } from 'react';
import { toNationalPoint } from '../engine/nationalPoint.js';
import NationalPointBadge from '../components/NationalPointBadge.jsx';
import ZoneMap from '../components/ZoneMap.jsx';

const SAMPLES = [
  { name: '서울시청 앞', lat: 37.5665, lon: 126.978 },
  { name: '부산시청 인근', lat: 35.1798, lon: 129.075 },
  { name: '한라산 정상 인근', lat: 33.3617, lon: 126.5312 },
];

const QUIZ = [
  {
    q: '국가지점번호 한 칸의 크기는?',
    options: ['10m × 10m', '100m × 100m', '1km × 1km'],
    answer: 0,
    why: '대한민국 땅을 가로세로 10m 칸으로 나눠 칸마다 번호를 붙여요.',
  },
  {
    q: '‘다사 5390 5203’에서 ‘다사’는 무엇일까요?',
    options: ['동네 이름의 줄임말', '가로·세로 100km 구역을 나타내는 글자', '우편번호'],
    answer: 1,
    why: '첫 글자는 동서 방향, 둘째 글자는 남북 방향 100km 구역이에요.',
  },
  {
    q: '산에서 길을 잃었을 때 119에 알리면 좋은 것은?',
    options: ['휴대폰 기종', '출발한 날짜', '가까운 국가지점번호판의 번호'],
    answer: 2,
    why: '주소가 없는 곳에서도 번호 하나로 위치를 정확히 알릴 수 있어요.',
  },
];

export default function Learn() {
  const [pick, setPick] = useState(0);
  const s = SAMPLES[pick];
  const np = toNationalPoint(s.lat, s.lon);
  return (
    <section className="learn result">
      <h1>국가지점번호 알아보기</h1>
      <article className="card">
        <h2>20초 만에 알기</h2>
        <p>
          국가지점번호는 대한민국 땅을 10m × 10m 칸으로 나눠 붙인 위치 번호예요. 주소가 없는 산이나 바닷가에서도
          내 위치를 정확히 알릴 수 있어요.
        </p>
        <div className="chips">
          {SAMPLES.map((x, i) => (
            <button key={x.name} type="button" className={i === pick ? 'on' : ''} onClick={() => setPick(i)}>
              {x.name}
            </button>
          ))}
        </div>
        <div aria-live="polite"><NationalPointBadge np={np} large /></div>
        <ul className="explain">
          <li><b>{np.zone[0]}</b> — 동서 방향 100km 구역</li>
          <li><b>{np.zone[1]}</b> — 남북 방향 100km 구역</li>
          <li><b>{np.east}</b> — 구역 서쪽 경계에서 동쪽으로 {(Number(np.east) / 100).toFixed(2)}km</li>
          <li><b>{np.north}</b> — 구역 남쪽 경계에서 북쪽으로 {(Number(np.north) / 100).toFixed(2)}km</li>
        </ul>
        <p className="tip">읽는 법: 글자 둘, 숫자 넷, 숫자 넷. “{np.zone} {np.east} {np.north}”</p>
      </article>

      <article className="card">
        <h2>지도로 보는 번호 읽는 법</h2>
        <p className="hint">위에서 고른 예시({s.name})가 어느 구역, 어느 칸인지 보여 줘요. 예시를 바꾸면 그림도 바뀌어요.</p>
        <ZoneMap np={np} lat={s.lat} lon={s.lon} name={s.name} />
      </article>

      <article className="card say-card">
        <h2>위급할 때 이렇게 알려요</h2>
        <p>산이나 바닷가처럼 주소가 없는 곳에서는 <b>국가지점번호</b>가 가장 정확한 위치 설명이에요. 번호판을 찾지 못해도 이 앱으로 바로 알릴 수 있어요.</p>
        <ol className="say-steps">
          <li>오른쪽 위 <b>[긴급 신고]</b>를 누르면 지금 서 있는 곳의 번호를 바로 찾아요.</li>
          <li><b>[119에 문자 보내기]</b>를 누르면 국가지점번호·오차·측정 시각이 담긴 문자가 준비돼요. 보내기만 누르면 돼요.</li>
          <li>[위치 복사해서 가족·지인에게 보내기]로 가족에게도 같은 위치를 알려요.</li>
          <li>말할 수 있으면 <b>119에 전화</b>해서 화면의 문장을 그대로 읽어 주세요.</li>
        </ol>
        <a className="btn" href="#/sos">긴급 신고 화면 열기</a>
        <blockquote className="say">
          전화로 읽을 때: “제 위치는 국가지점번호 <b>다사 5390 5203</b>, 오차 약 20m입니다.”
        </blockquote>
        <p className="hint">숫자는 한 자리씩 또박또박(오·삼·구·공…). 앱의 번호는 휴대폰 위치로 계산한 값이라, 근처에 번호판이 보이면 그 번호도 함께 알려 주세요.</p>
      </article>

      <Quiz />

      <article className="card">
        <h2>더 알아보기</h2>
        <p>
          국가지점번호의 공식 안내와 번호 조회는{' '}
          <a href="https://www.juso.go.kr" target="_blank" rel="noopener noreferrer">주소정보누리집</a>에서 볼 수 있어요.
        </p>
      </article>
    </section>
  );
}

function Quiz() {
  const [answers, setAnswers] = useState({});
  const score = QUIZ.filter((q, i) => answers[i] === q.answer).length;
  const done = Object.keys(answers).length === QUIZ.length;
  return (
    <article className="card quiz">
      <h2>퀴즈 3문제</h2>
      {QUIZ.map((item, i) => {
        const chosen = answers[i];
        return (
          <fieldset key={i} className="field">
            <legend>{i + 1}. {item.q}</legend>
            <div className="chips">
              {item.options.map((o, j) => {
                const state = chosen == null ? '' : j === item.answer ? 'right' : j === chosen ? 'wrong' : '';
                return (
                  <button key={o} type="button" className={state} disabled={chosen != null} onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}>
                    {o}
                  </button>
                );
              })}
            </div>
            {chosen != null && <p className="hint">{chosen === item.answer ? '맞아요! ' : '아쉬워요. '}{item.why}</p>}
          </fieldset>
        );
      })}
      {done && <p className="dday" role="status"><b>{score}/3</b> {score === 3 ? '국가지점번호 박사예요!' : '다시 한 번 읽어 보면 금방 익혀요.'}</p>}
    </article>
  );
}
