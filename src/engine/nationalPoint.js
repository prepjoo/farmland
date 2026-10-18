// 국가지점번호 계산 (순수 함수)
// 기준: UTM-K(EPSG:5179) 좌표를 100km 구역 문자 2개 + 10m 단위 숫자 4+4자리로 나타낸다.
// - 첫 글자: 동서(x) 구역, 700,000m부터 100km마다 가·나·다…
// - 둘째 글자: 남북(y) 구역, 1,300,000m부터 100km마다 가·나·다…
// - 숫자: 구역 남서쪽 모서리에서 동쪽/북쪽으로 10m 단위(버림)
// 화면에는 항상 '계산값'으로 표시한다. 공식 조회 대조는 tests/unit/nationalPoint.test.js 참고.
import proj4 from 'proj4';

const UTMK =
  '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs';
const WGS84 = 'EPSG:4326';
const toUtmk = proj4(WGS84, UTMK);

const LETTERS = ['가', '나', '다', '라', '마', '바', '사', '아'];
const X_ORIGIN = 700000;
const Y_ORIGIN = 1300000;
const ZONE = 100000;
const CELL = 10;

/** 위도·경도 → UTM-K [x, y] (미터) */
export function wgs84ToUtmk(lat, lon) {
  return toUtmk.forward([lon, lat]);
}

/** UTM-K [x, y] → [위도, 경도] */
export function utmkToWgs84(x, y) {
  const [lon, lat] = toUtmk.inverse([x, y]);
  return [lat, lon];
}

const pad4 = (n) => String(n).padStart(4, '0');

/** UTM-K 좌표 → 국가지점번호. 구역 밖이면 null */
export function utmkToNationalPoint(x, y) {
  const xi = Math.floor((x - X_ORIGIN) / ZONE);
  const yi = Math.floor((y - Y_ORIGIN) / ZONE);
  if (xi < 0 || yi < 0 || xi >= LETTERS.length || yi >= LETTERS.length) return null;
  const east = pad4(Math.floor((x - X_ORIGIN - xi * ZONE) / CELL));
  const north = pad4(Math.floor((y - Y_ORIGIN - yi * ZONE) / CELL));
  const zone = LETTERS[xi] + LETTERS[yi];
  return { zone, east, north, text: formatNationalPoint({ zone, east, north }) };
}

/** 위도·경도 → 국가지점번호 { zone, east, north, text }. 구역 밖이면 null */
export function toNationalPoint(lat, lon) {
  const [x, y] = wgs84ToUtmk(lat, lon);
  return utmkToNationalPoint(x, y);
}

/** '다사 5390 5203' 같은 글자를 읽는다. 띄어쓰기·하이픈은 무시. 틀리면 null */
export function parseNationalPoint(text) {
  if (typeof text !== 'string') return null;
  const m = text.replace(/[\s-]/g, '').match(/^([가-힣])([가-힣])(\d{4})(\d{4})$/);
  if (!m) return null;
  if (!LETTERS.includes(m[1]) || !LETTERS.includes(m[2])) return null;
  return { zone: m[1] + m[2], east: m[3], north: m[4] };
}

/** { zone, east, north } → '다사 5390 5203' */
export function formatNationalPoint({ zone, east, north }) {
  return `${zone} ${east} ${north}`;
}

/** 국가지점번호 → 10m 칸 가운데의 { lat, lon, x, y }. 틀리면 null */
export function fromNationalPoint(text) {
  const p = typeof text === 'string' ? parseNationalPoint(text) : text;
  if (!p) return null;
  const xi = LETTERS.indexOf(p.zone[0]);
  const yi = LETTERS.indexOf(p.zone[1]);
  const x = X_ORIGIN + xi * ZONE + Number(p.east) * CELL + CELL / 2;
  const y = Y_ORIGIN + yi * ZONE + Number(p.north) * CELL + CELL / 2;
  const [lat, lon] = utmkToWgs84(x, y);
  return { lat, lon, x, y };
}
