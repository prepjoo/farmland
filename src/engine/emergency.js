// 긴급 신고 도구 (docs/changes.md 여섯 번째 변경). 위치는 휴대폰 안에서만 쓰고 저장·전송하지 않는다.
export const EMERGENCY_NUMBERS = [
  { number: '119', name: '119 화재·구조·구급', desc: '다쳤거나 아플 때, 길을 잃었을 때, 불이 났을 때' },
  { number: '112', name: '112 경찰', desc: '범죄·위협을 당했을 때' },
];
// 122(해양)는 2016년 긴급신고전화 통합 이후의 현재 운영 방식을 공식 안내로 확인하기 전까지 1차 버튼에서 뺀다 (확인 필요)

export const telHref = (number) => `tel:${number}`;

/** 문자 앱 열기. 'sms:번호?&body=' 형식이 안드로이드·아이폰 모두에서 열린다 */
export const smsHref = (number, body) => `sms:${number}?&body=${encodeURIComponent(body)}`;

const round = (v, n = 5) => Math.round(v * 10 ** n) / 10 ** n;
export const roundAcc = (m) => (m < 100 ? Math.round(m / 10) * 10 || 10 : Math.round(m / 50) * 50);

const kstTime = (d) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

/**
 * 신고할 때 보내거나 복사할 위치 문구. 줄은 ' / '로 나눈다.
 * 국가지점번호(휴대폰 계산값)를 맨 위에, 오차·측정 시각, 위경도는 아래에 참고로 (사용자 결정 2026-10-14).
 * 계산값이 공식 조회와 대조되기 전이라 '휴대폰 계산값'이라고 꼭 붙인다.
 */
export function reportText({ np, lat, lon, accuracy, at }) {
  const parts = ['[긴급 신고] 제 위치입니다.'];
  if (np) parts.push(`국가지점번호 ${np} (휴대폰 계산값)`);
  const meta = [accuracy != null ? `오차 약 ${roundAcc(accuracy)}m` : null, at ? `${kstTime(at)} 측정` : null].filter(Boolean).join(' · ');
  if (meta) parts.push(meta);
  if (lat != null && lon != null) parts.push(`${np ? '(참고) ' : ''}위도 ${round(lat)}, 경도 ${round(lon)}`);
  return parts.join(' / ');
}

const SINO = ['공', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const readDigits = (s) => [...s].map((c) => SINO[Number(c)]).join('');

/** 전화로 또박또박 읽을 문장. 숫자는 한 자리씩(공·일·이…) 읽게 쓴다 */
export function sayText({ np, lat, lon, accuracy }) {
  const acc = accuracy != null ? `, 오차 약 ${roundAcc(accuracy)}m` : '';
  if (np) {
    const [zone, e, n] = np.split(' ');
    return `제 위치는 국가지점번호 ${zone} ${readDigits(e)} ${readDigits(n)}${acc}입니다.`;
  }
  return `제 위치는 위도 ${round(lat, 4)}, 경도 ${round(lon, 4)}${acc}입니다.`;
}

export const measuredAt = (at) => kstTime(at);

/** 도·분·초 (119 상황실에서 묻는 경우 대비) */
export function toDms(value, axis) {
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  const head = axis === 'lat' ? (value >= 0 ? '북위' : '남위') : value >= 0 ? '동경' : '서경';
  return `${head} ${d}° ${m}′ ${s}″`;
}

export function describeAccuracy(m) {
  if (m <= 20) return '아주 정확해요';
  if (m <= 100) return '꽤 정확해요';
  return '오차가 넓어요. 하늘이 보이는 곳으로 옮기거나 잠시 기다리면 더 정확해져요';
}
