# 귀땅 개발 명세 (0단계, 2026-10-18)

기획은 `docs/plan.md`, 이 문서는 **어떻게 계산하고 어떤 자료를 쓰는지**를 적는다. 계산은 모두 `src/engine/`의 순수 함수로 만들고 테스트를 먼저 쓴다. 날짜는 모두 한국 날짜(`kstDateString`, YYYY-MM-DD).

## 1. 행운번호 (`engine/lotto.js`)

### 1.1 오늘의 행운번호
- 입력: `date`(한국 날짜), `salt`(이 기기의 무작위 값), `game`('A'~'E')
- 무작위 값: 처음 들어온 날 `crypto.getRandomValues`로 16바이트 → 32자리 16진수 글자. 이 기기 저장소 `farmland:salt`에 둔다. 저장이 막힌 브라우저면 메모리에만 두고 “이 창을 닫으면 번호가 바뀔 수 있어요”를 보여 준다.
- 씨앗값: `makeSeed(['fl-lotto-v1', date, salt, game].join('|'))` → `createRng`(별땅 `seed.js`, sfc32)
- 뽑기: 1~45 배열을 피셔-예이츠로 앞에서부터 6번 섞어 앞 6개. 섞는 방식이라 중복이 없다. 이 순서가 추첨기에서 공이 나오는 순서다.
- 표시: 작은 수부터 정렬(값은 바뀌지 않음).
- 게임끼리 겹침: 앞 게임과 6개가 모두 같으면 `game + '#1'`, `'#2'`…로 다시 뽑는다.
- 출력: `{ game, drawn: [6개, 나온 순서], sorted: [6개], odd, even, sum, hasConsecutive }`
- 번호는 저장하지 않는다. 다시 들어오면 같은 계산으로 다시 만든다. 한국 날짜가 바뀔 때만 바뀐다.

### 1.2 나만의·둘의 행운번호
- 회차: 1회 = 2002-12-07(토). n회 추첨일 = 2002-12-07 + 7×(n−1)일(1227회 = 2026-06-06로 공공데이터와 일치 확인). ‘이번 주 회차’ = 오늘 또는 오늘 뒤 가장 가까운 토요일의 회차. 일요일 0시(한국시간)에 다음 회차로 넘어간다.
- 나만의: `['fl-lotto-me-v1', 회차, 날짜입력(YYYYMMDD 또는 MMDD), game]`
- 둘의: `['fl-lotto-pair-v1', 회차, 표준글자A, 표준글자B, game]` — 표준 글자는 v3 궁합 규칙(taste:…, zodiac:…, bday:…, mbti:…), 두 글자는 가나다순으로 정렬해 순서가 바뀌어도 같은 결과.
- 입력값은 계산 뒤 버린다.

### 1.3 테스트
같은 입력=같은 결과 / 6개 모두 1~45이고 서로 다름 / A~E 서로 다름 / 날짜가 바뀌면 다름 / sorted는 drawn을 정렬한 것 / 회차 계산(1회, 1227회).

## 2. (폐기 2026-10-18) 오늘의 카드와 행운 방향 — 5장으로 바뀜
- 오늘의 카드: `makeSeed(['fl-card-v1', date].join('|'))` → `floor(rng() × 22)`. **기기와 상관없이 그날 전국 같은 카드**(같은 동네를 고른 사람은 같은 장소를 본다).
- 각도 = 카드 × 360/22 (0번 정북, 시계 방향).
- 방향 이름 = 16방위 `['북','북북동','북동','동북동','동','동남동','남동','남남동','남','남남서','남서','서남서','서','서북서','북서','북북서']`의 `round(각도/22.5) % 16`. 22장 전체 표는 기획안 5장.
- 테스트: 0번=북 0°, 11번=남 180°, 17번=서 278.2°, 18번=서북서 294.5°.

## 3. 행운 장소 (`engine/luckyPlace.js`)

### 3.1 자료 `public/data/lotto-stores.json`
- 만드는 법: `node scripts/build-lotto-stores.mjs data/raw/lotto-stores-20260606.csv`
- 출처: 공공데이터포털 ‘기획예산처_온라인복권 1등 당첨 판매점 현황 정보_20260606’(이용허락범위 제한 없음). 최근 1년(1176~1227회), **자동 1등만**, 상호·지역(시·군·구)·횟수. 주소 없음.
- 형식: `{ version, source, sourceUrl, rounds:[1176,1227], period, kind, regionsVersion, excluded:[…], stores:[{ id, name, region, sgg:[코드…], wins }] }`
- 가공 규칙: 온라인 판매(‘인터넷 복권판매사이트’, 16회)는 뺀다. 지역 이름 → 경계 자료 코드. 경계 자료(ver20260701)와 이름이 다르면 후보 코드를 모두 붙인다: 인천 중구→제물포구·영종구, 인천 동구→제물포구, 인천 서구→서해구·검단구, 경기 화성시→화성시 4개 구.
- 0단계 점검(2026-10-18): 463행 중 실제 가게 462곳 모두 시·군·구 코드 확인. 1등 판매점이 있는 시·군·구 178곳(전체 256곳). 한 가게 최다 4회.
- 1년에 한 번 갱신(다음 예정 2027-06-19). 자료 기준일이 13개월을 넘으면 “자료가 오래됐어요”를 보여 준다.

### 3.2 시·군·구 대표 지점 `public/data/sgg-anchors.json` (1단계에서 만듦)
- 별땅 `anchor.js`의 `regionAnchor`로 시·군·구마다 대표 지점 `[경도, 위도]`를 미리 계산해 둔다. 후보 코드가 여러 개인 판매점은 각 후보 지역에 모두 속한 것으로 친다.

### 3.3 (폐기 2026-10-18) 카드 방향으로 고르기 — 5.4로 바뀜
- 기준점 P: 고른 시·군·구의 대표 지점, 또는 [내 위치]를 눌렀을 때만 현재 위치(저장·전송 안 함).
- 후보 지역 D: 판매점이 하나라도 있는 시·군·구.
- 각 d에 대해 P→대표 지점의 거리 r, 방위 φ. 조건: |φ − 카드 각도| ≤ 22.5°, 1km ≤ r ≤ R.
- R은 6km → 15km → 60km 차례로 넓힌다. 조건을 만족하는 지역 중 r이 가장 작은 곳.
- 모두 없으면: 방향과 상관없이 가장 가까운 후보 지역(내 지역에 판매점이 있으면 내 지역)을 고르고 “이 방향에는 없어 가장 가까운 곳을 골랐어요”.
- 지역 안의 판매점: id 순으로 줄 세우고 `makeSeed(['fl-place-v1', date, 지역코드].join('|'))`의 첫 난수로 하나.
- 전국 모드(기준점 없음): `['fl-place-v1', date, '00']` 난수로 판매점이 있는 시·도 하나(룰렛 칸 수 = 판매점이 있는 시·도 수, 경계 자료의 시·도 16곳 중 판매점이 있는 곳, 현재 15곳(세종 없음)) → 같은 난수열로 그 시·도 안의 지역 하나 → 판매점 하나. 그날 전국이 같은 장소.
- 출력: `{ mode, card, angle, dirName, region:{code,name}, distanceKm, store:{name, wins, region}, basis:{rounds, source}, fallback }`
- 자료를 못 불러오면 장소를 만들지 않고 `{ mode:'unavailable' }` → 화면은 “자료 준비 중”.
- 테스트: 같은 날·같은 기준점=같은 장소 / 방향 조건 / 거리 넓히기 / 대체 규칙 / 전국 모드 결정성 / 자료 없음.

## 4. 이 기기 저장소 (`farmland:` 이름표)
| 키 | 내용 | 지우면 |
| --- | --- | --- |
| `farmland:salt` | 무작위 값 | 오늘의 번호가 바뀜 |
| `farmland:age` | 19세 확인 답과 날짜 | 다시 물음 |
| `farmland:seen` | 오늘 연출을 본 날짜 | 연출을 다시 보여 줌 |
| `farmland:home` | [기억하기]를 누른 동네 코드 | 다시 고름 |
| `farmland:village` | 가상 마을 상태(기념 지점·팜 수·미션) | 마을이 처음부터 |

생일·기념일·MBTI·궁합 입력, 위치, 번호는 저장하지 않는다. [모두 지우기] 버튼으로 위 키를 지운다.

## 5. 첫 화면 상태
대기 → (처음이면) 19세 확인 → 추첨(건너뛰기 가능) → 룰렛(건너뛰기 가능) → 결과(번호·장소·긁는 카드·공유). 같은 날 다시 오면 결과부터. 오류: 장소 자료 실패 → 번호·카드만, 장소 칸에 “자료 준비 중”. Web Crypto가 없으면 “이 브라우저에서는 쓸 수 없어요”.

## 6. 확인 필요
- 도박 문제 상담 번호(1336) 공식 확인.
- 19세 확인 방식·로또 표현·판매점 정보 사용의 법률 검토.
- 복권 수탁사업자 홈페이지 회차별 자료의 이용 조건(쓰지 않음, 확인 전까지).
- 국가지점번호 공식 조회 10곳 대조.

## 5. 구조 변경: ‘오늘’ · ‘이번 주’ (2026-10-18, 이 장이 1.1·2·3.3보다 우선)

### 5.1 의미 있는 숫자 → 후보 → 한 곳 (`components/MeaningPicker.jsx`, `lib/landLookup.js`)
- 입력 방식: 생년월일(YYYYMMDD) · 전화번호(마지막 8자리, 화면에서는 가운데 가림) · MBTI(글자마다 알파벳 순서 2자리, `engine/landNumber.js`의 `mbtiAlphaDigits`, 예: ESTJ → 05192010).
- 입력 칸 위에 “이 기기 안에서만 계산, 저장·전송 없음”을 크게 적는다.
- 8자리 → 64구역 후보 중 육지(시·군·구 경계 안)만 → 보통 9~12곳(6~13곳) 목록 → 한 곳 고르기. 별땅 엔진·경계 자료 그대로.
- 고른 곳의 국가지점번호는 입력 숫자와 같으므로 **저장하지 않고** 화면을 연 동안만 메모리에 둔다(오늘·이번 주가 함께 씀). 공유 이미지에는 지역 이름만 넣고 번호는 넣지 않는다.
- 참고: 생년월일은 국가지점번호 구조상 전국 22개 시·군·구 안에서만 후보가 나온다.

### 5.2 오늘 (`screens/TodayLuck.jsx`, 19세 확인 없음)
- 오늘의 카드: 타로 `todayTarot` = SHA-256('fl-tarot-v1' | 한국 날짜 | 고른 국가지점번호) → 0~21, 주역 `todayHexagram` = 'fl-iching-v1' → 1~64 (`engine/fortune.js`). 주역 자료 `public/data/hexagrams.json`은 별지점에서 복사(괘사 전통 의미).
- 타로는 22칸 룰렛 연출 뒤 카드, 주역은 괘 그림.
- 오늘의 행운 장소 3곳 `pickNearbyPlaces`(`engine/nearby.js`): TourAPI 공개 장소 중 고른 곳에서 거리(1.5·6·15·60km, 기본 6) 안의 장소를 id 순으로 줄 세워 SHA-256('fl-today-place-v1' | 날짜 | 국가지점번호 | 거리)로 섞어 3곳 → 가까운 순. 모자라면 다음 거리로 넓히고 알린다.

### 5.3 이번 주 (`screens/WeekLuck.jsx`, 만 19세 확인)
- 이번 주 행운번호 `weeklyNumbers` = 5게임, 씨앗 ['fl-week-v1', 회차, 고른 국가지점번호, 게임 글자]. 일요일 0시(한국시간)에 다음 회차. 추첨기 연출은 회차·지점마다 처음 한 번.
- 이번 주 행운 장소 = 1등 나온 판매점 3곳 `nearestStores`: 가게마다 후보 시·군·구 대표 지점까지 거리 중 가장 가까운 값 → 가까운 순 → 1등 횟수 많은 순 → id 순. 거리 안에 3곳이 없으면 넓히고, 60km에도 없으면 거리와 상관없이 가까운 곳.
- 화면 제목 ‘이번 주 행운 장소’, 설명 ‘1등 나온 판매점’(사용자 결정 2026-10-18).

### 5.4 화면 틀
- 첫 화면: 큰 기능 카드 두 개(오늘 · 이번 주) + 사용 순서 3줄.
- 머리: 로고 · [메뉴] 풀다운(처음 화면·오늘·이번 주·내 귀땅 마을·국가지점번호란?·내 위치 국가지점번호) · [긴급 신고](늘 보임). 아래 탭과 ‘나만의 행운’ 메뉴는 없앰.

## 6. 내 귀땅 마을 (`engine/village.js`, `screens/Village.jsx`, `components/VillageArt.jsx`)
- 상태 `{ v:1, theme:'field'|'sea'|null, pin:'sprout'|'chick'|'scarecrow'|null, farms, days:[YYYY-MM-DD 최근 14개], weeks:[회차] }`. 저장소에서 읽을 때 `normalizeVillage`로 고친다.
- `chooseTheme`: 처음 고르면 farms = 1. 다시 바꿔도 팜은 그대로.
- `recordTodayLuck(state, date)`: 그날 처음이면 +1(‘today’). 같은 회차 주(`roundForDate`, 일~토)의 날이 5일이 되고 그 회차를 아직 안 받았으면 +1(‘week’).
- 호출 위치: ‘오늘’ 화면에서 오늘의 카드를 다 보여 준 뒤 한 번(`lib/luck.js` `recordVisit`). ‘이번 주’ 화면은 부르지 않는다.
- `plotCells(n)`: 7×7 판 가운데 (3,3)에서 시작하는 시계 방향 나선, 최대 49칸.
- 이 기기 저장소에는 날짜·회차·그림·캐릭터·팜 수만. 입력한 숫자·고른 곳·번호는 남기지 않는다(e2e로 확인). 추첨기 연출 기록 `seen`도 `w<회차>`만.

## 7. 행운 장소로 가는 길 (`engine/route.js`, `components/RouteTools.jsx`, `lib/useMyPosition.js`)
- `kakaoRouteUrl({name, lat, lon})` → `https://map.kakao.com/link/to/<이름(쉼표→빈칸)>,<위도 6자리>,<경도 6자리>`. 위치가 없으면 null.
- `kakaoSearchUrl(q)` → `https://map.kakao.com/link/search/<q>` (판매점: ‘상호 시·군·구’).
- `withDistanceFromMe(me, items, pointOf)` → 각 항목에 `fromMeKm`(직선, 소수 1자리). `fromMeText(km)`로 문장.
- 위치: [내 위치에서 거리 보기]를 누를 때만 `getCurrentPosition` 한 번. 화면 메모리에만 두고 저장·전송하지 않는다. 링크는 `target=_blank rel="noopener noreferrer"`.

## 8. 메인 개편: 여기 · 행복 · 행운 (2026-10-19, 이 장이 5·7장보다 우선)
- 화면: `screens/Home.jsx`(카드 3개), `screens/Happy.jsx`(#/happy/<pos|message|place>), `screens/Luck.jsx`(#/luck/<pos|number|place>), `screens/Meet.jsx`(#/meet), `screens/Here.jsx`(#/here ‘여긴 어디?’).
- 행복메시지 `engine/fortune.js`: `todayTarot`(0~21, 'fl-tarot-v1') · `todayHexagram`(1~64, 'fl-iching-v1') · `todayZodiac`(0~11, 'fl-zodiac-v1'), 모두 SHA-256(규칙 | 한국 날짜 | 행복위치 국가지점번호). `MESSAGE_KINDS`. 회전판 `components/Roulette.jsx`는 `go`가 참이 될 때만 돈다(동작 줄이기면 바로 멈춘 칸).
- 점성술 자료 `public/data/zodiac.json`: 12궁 이름·기호·날짜·원소·특성·지배 행성·전통 풀이·조언. 놀이용 추첨(생일 별자리 아님). 문장은 콘텐츠 검수 필요.
- 오늘의 국가지점: 조언을 다 보면 나오는 칸. 행복위치 + 미션(`recordVisit`).
- 만남 장소 `engine/meet.js` `meetPlaces({a, b, places})`: 각 장소에 fromA·fromB(km), 정렬 = max(fromA, fromB) → |차| → 합 → id. 후보는 두 사람 가운데에서 반경 min(80, max(10, 거리/2+10))km 안의 TourAPI 관광지(places) 또는 음식점(food, cafe 여부로 맛집·카페). 부품 `components/MeetPlaces.jsx`.
- 행운지점: ‘국가지점으로 현재 위치’(getCurrentPosition 한 번 → `toNationalPoint` → `lookupOne`) 또는 `MeaningPicker`(버튼 ‘위치찾기’). 행운위치는 화면 메모리에만.
- 행운번호: `weeklyNumbers({round, np})` 5게임을 [추첨]마다 하나씩 보여 준다. 저장 없음(다시 오면 0게임부터, 번호는 같음).
- 행운장소: [행운장소] → `nearestStores`. [출발] → `kakaoFromToUrl(행운위치, 구 대표 지점)` (형식 확인 필요) + `kakaoSearchUrl(상호 시·군·구)`.

## 9. 만남 별자리 · 오늘의 운세 · 지도 (2026-10-19 일곱 번째, 8장의 만남 장소·여기 카드보다 우선)
- 여기 카드: 여긴 어디?(#/here, 들어가면 위치를 바로 찾음) · 긴급 신고. #/meet은 행복 추천장소로 보낸다.
- 행복메시지 풀이: `fortune-detail.json` {tarot[22], iching[64], zodiac[12]} 각 {n, love, work, mind, action}. 화면은 오늘의 흐름(tradition + luck) · 사람·관계 · 일·공부·돈 · 마음·건강 · 오늘의 작은 실천 · 행운의 방향(`fortune.luckyDirection`).
- 만남 별자리: `lib/runMeet.js` `buildMeet({A, B, bearing, rangeM})` → `engine/meetStar.js`(별땅과 같음) + `engine/starPath.js` `starOrder`(5점이면 0→2→4→1→3→0). A = 현재 위치(`pointFromLatLon`) 또는 `anchorOfRegion`, B = `anchorOfRegion({sido, sgg, dong})`(동을 고르면 `regions/dong-<시도>.json`의 그 동 대표 지점). bearing = `cardBearing(오늘 카드)`. 부품 `components/MeetPlaces.jsx`, `components/RegionPicker.jsx`.
- 지도 `components/LuckyMap.jsx`: zoomControl, Tooltip, `star` 선, `rangeKm` 원(바뀌면 fitBounds 다시).
