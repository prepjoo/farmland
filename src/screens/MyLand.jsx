import { useState } from 'react';
import LandView from '../components/LandView.jsx';
import { encodeGift, MESSAGE_MAX } from '../engine/giftLink.js';
import { maskNationalPoint } from '../engine/landNumber.js';
import { buildIcs } from '../engine/ics.js';
import { saveLand } from '../lib/myLands.js';
import { landDeedPng } from '../lib/landPng.js';
import { dedication } from '../engine/dedication.js';
import { LAND_NAME } from '../lib/brand.js';

const siteUrl = () => `${window.location.origin}${window.location.pathname}`;

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 내 별땅: 보여 주기 + 선물하기 + 기억하기 */
export default function MyLand({ land }) {
  const isDate = land.kind === 'birthday' || land.kind === 'anniv';
  const [agree, setAgree] = useState(false);
  const [message, setMessage] = useState(land.reason ?? '');
  const [status, setStatus] = useState('');
  const title = land.sea ? `바다 위 ${LAND_NAME}` : `${land.place}${land.dong ? ` ${land.dong}` : ''}`;

  const link = () => `${siteUrl()}#/g?${encodeGift({ np: land.text, masked: land.masked, message })}`;

  async function shareLink() {
    const url = link();
    const text = `${LAND_NAME}을 선물해요: ${title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: LAND_NAME, text, url });
        setStatus('보냈어요.');
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setStatus('선물 링크를 복사했어요. 카톡·문자에 붙여 넣어 보내세요.');
    } catch {
      setStatus(`이 링크를 길게 눌러 복사해 주세요: ${url}`);
    }
  }

  async function saveImage() {
    setStatus('이미지를 만드는 중…');
    try {
      const land0 = await fetch(`${import.meta.env.BASE_URL}data/regions/land.json`).then((r) => r.json());
      const blob = await landDeedPng({
        place: title,
        np: land.masked ? maskNationalPoint(land.text) : land.text,
        dedication: dedication({ kind: land.kind, label: land.label }),
        dateText: new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()),
        cardName: land.guardian ? `${land.guardian.n}. ${land.guardian.name}` : '',
        cardLine: land.guardian?.luck ?? '',
        message,
        lat: land.lat,
        lon: land.lon,
        landFeatures: land0.features,
      });
      download(blob, 'byeolttang.png');
      setStatus('기념 땅문서 이미지를 저장했어요.');
    } catch (e) {
      console.error(e);
      setStatus('이미지를 만들지 못했어요.');
    }
  }

  function keep(withDate) {
    saveLand({ np: land.text, place: title, label: land.label, kind: land.kind, flow: land.flow, date: withDate ? land.date : null, masked: land.masked, reason: land.reason ?? '' });
    setStatus(withDate ? `첫 화면에 ‘${land.label}’ D-day를 보여 드릴게요. 이 기기에만 저장돼요.` : '보관함에 저장했어요. 이 기기에만 저장돼요.');
  }

  function calendar() {
    const ics = buildIcs({ title: `${land.label} · ${LAND_NAME}`, date: land.date, url: siteUrl(), description: `${title} ${LAND_NAME}` });
    download(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), 'byeolttang.ics');
    setStatus('달력 파일을 내려받았어요. 파일을 열면 휴대폰 달력에 해마다 돌아오는 일정으로 들어가요.');
  }

  return (
    <section className="result">
      <LandView land={land} guardian={land.guardian} masked={land.masked} reason={land.reason} eyebrow={`내 ${LAND_NAME} · ${land.label}`} />

      {land.flow === 'us' && (
        <p className="notice">두 동네 사이 데이트 장소를 찾고 싶다면 <a href="#/us/1">우리 별땅 첫 화면의 ‘우리 둘 만남 별자리’</a>로 가 보세요.</p>
      )}

      <article className="card gift-card">
        <h2>{LAND_NAME} 선물하기</h2>
        <label className="text-field">
          <span>받는 사람에게 한 줄 <span className="opt">선택</span></span>
          <input type="text" maxLength={MESSAGE_MAX} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="예: 우리 첫 여행지 근처에 별을 찍었어" />
        </label>
        <label className="toggle consent">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            괜찮아요, 보낼게요
            <small>
              {land.masked
                ? '전화번호는 가려서 보내지만, 지도 위치를 계산하면 번호를 알아낼 수 있어요. 가까운 사람에게만 보내 주세요.'
                : land.kind === 'mbti'
                  ? `${LAND_NAME} 번호를 보면 두 사람의 MBTI를 알 수 있어요(휴대폰 자판으로 바꾼 숫자라서요).`
                  : isDate
                  ? `${LAND_NAME} 번호를 보면 날짜 숫자가 보여서, 받는 사람이 ${land.label} 날짜를 알 수 있어요.`
                  : `${LAND_NAME} 번호를 보면 넣은 숫자 8자리가 보여요.`}
            </small>
          </span>
        </label>
        <div className="actions">
          <button type="button" className="primary" disabled={!agree} onClick={shareLink}>선물 링크 보내기</button>
          <button type="button" disabled={!agree} onClick={saveImage}>별땅문서 이미지 저장</button>
        </div>
      </article>

      <article className="card">
        <h2>기억하기</h2>
        <p className="hint">이 기기(브라우저)에만 저장되고 서버로 보내지 않아요. 브라우저 기록을 지우면 함께 지워져요. 휴대폰 브라우저 메뉴의 [홈 화면에 추가]를 누르면 앱처럼 바로 열 수 있어요.</p>
        <div className="actions">
          {isDate && <button type="button" onClick={() => keep(true)}>기념일로 기억하기 (첫 화면 D-day)</button>}
          <button type="button" onClick={() => keep(false)}>보관함에 저장</button>
          {isDate && <button type="button" onClick={calendar}>휴대폰 달력에 추가</button>}
        </div>
      </article>

      <p className="status" role="status" aria-live="polite">{status}</p>

      <div className="links">
        <a className="btn" href={`#/${land.flow ?? 'mine'}/2`}>다른 후보 고르기</a>
        <a className="btn" href={`#/${land.flow ?? 'mine'}/1`}>다른 번호로 찾기</a>
      </div>
    </section>
  );
}
