import { test, expect } from '@playwright/test';
import { openHome, findByDate, chooseCandidate, prepare, pickDate } from './helpers.js';

test.describe('별땅 (v5)', () => {
  test('첫 화면: 주메뉴 3개(내·우리·MBTI 별땅 분양받기), 머리에 메뉴 아이콘과 작은 [내 위치]·[긴급 신고]', async ({ page }) => {
    await openHome(page);
    await expect(page.locator('.hero h1')).toHaveText('별땅');
    await expect(page.locator('.hero-deed img')).toBeVisible();
    const tiles = page.locator('.menu-grid .menu-tile');
    await expect(tiles).toHaveCount(3);
    await expect(tiles.locator('.menu-name')).toHaveText(['내 생일 땅이 있다고?', '처음 만난 날 땅을 샀습니다', 'MBTI 궁합으로 땅을 산다고?']);
    await expect(tiles.locator('.menu-label')).toHaveCount(0);
    await expect(page.locator('header .top-menu .flow-link')).toHaveCount(5);
    await expect(page.locator('header .top-menu .flow-link').last()).toHaveText('국가지점?');
    await expect(page.locator('header .mini.here')).toBeVisible();
    await expect(page.locator('header .mini.sos')).toBeVisible();
    // 머리 아이콘으로 바로 옮겨 가기, 지금 메뉴 표시
    await page.locator('header .flow-link.love').click();
    await expect(page.locator('h1')).toHaveText('기념일 선물, 이번엔 땅으로');
    await expect(page.locator('header .flow-link.love')).toHaveAttribute('aria-current', 'page');
    await page.locator('header .flow-link.mbti').click();
    await expect(page.locator('.mbti-box')).toBeVisible();
  });

  test('메뉴마다 입력이 다르다: 내 별땅=누구의 생일 칩, 우리 별땅=기념일 칩, MBTI=두 사람 MBTI 필수', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/mine/1');
    await expect(page.getByRole('radiogroup', { name: '누구의 생일인가요?' }).getByRole('radio')).toHaveCount(10);
    await expect(page.getByRole('radio', { name: '나', exact: true })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('radio', { name: '엄마' }).click();
    await page.goto('/#/us/1');
    await expect(page.getByRole('radio', { name: '결혼기념일' })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: '번호 종류' })).toHaveCount(0);
    await page.goto('/#/mbti/1');
    await expect(page.getByLabel('날짜 연대')).toHaveCount(0); // MBTI 별땅은 날짜가 없다
    await expect(page.getByRole('button', { name: '추천 별 받기' })).toBeDisabled();
    await page.locator('.mbti-box select').nth(0).selectOption('INFP');
    await page.locator('.mbti-box select').nth(1).selectOption('ESTJ');
    await expect(page.locator('#mbti-hint')).toContainText('3785 4637'); // 휴대폰 자판: ESTJ 3785 + INFP 4637
    await expect(page.getByRole('button', { name: '추천 별 받기' })).toBeEnabled();
    await page.goto('/#/mine/1');
    await page.getByRole('radio', { name: '의미 있는 수' }).click();
    await expect(page.getByText('숫자 8자리(띄어쓰기 무관)')).toBeVisible();
    await page.getByRole('radio', { name: '전화번호' }).click();
    await expect(page.getByLabel(/전화번호/)).toHaveValue('010-'); // 010 다음에 바로 이어 쓰기
  });

  test('날짜를 안 넣으면 다음으로 못 감, 넣으면 전국 후보 별 (구역마다 다른 글자, 같은 숫자)', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/mine/1');
    await expect(page.getByRole('button', { name: '후보 별 보기' })).toBeDisabled();
    await pickDate(page, '1962-03-07');
    await expect(page.locator('#date-hint')).toContainText('1962 0307');
    await page.getByRole('button', { name: '후보 별 보기' }).click();
    await page.waitForSelector('.cand-list');
    const items = page.locator('.cand-list button');
    const n = await items.count();
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(13);
    const nps = await page.locator('.cand-list .np').allTextContents();
    expect(new Set(nps.map((t) => t.slice(0, 2))).size).toBe(n);
    for (const t of nps) expect(t.slice(3)).toBe('1962 0307');
    await expect(page.locator('h1')).toHaveText(`전국에 별이 ${n}개 떴어요`);
  });

  test('하나 고르면 내 별땅: 이름·번호·수호 카드, 확대하면 10m 칸', async ({ page }) => {
    await findByDate(page, '1962-03-07');
    await chooseCandidate(page, 0, '우리 가족 고향 근처');
    await expect(page.locator('.land-stamp .np')).toHaveText(/^\S\S 1962 0307$/);
    await expect(page.locator('.land-reason')).toContainText('우리 가족 고향 근처');
    await expect(page.locator('.land-card h2')).toHaveText('이 땅의 행운 카드');
    await expect(page.locator('.land-card .year-card')).toHaveCount(0);
    // 1+9+6+2+0+3+0+7 = 28 → 10 운명의 수레바퀴
    await expect(page.locator('.land-card').first()).toContainText('10. 운명의 수레바퀴');
    await page.getByRole('button', { name: '내 별땅으로 확대' }).click();
    await expect(page.locator('.land-map path.leaflet-interactive')).toHaveCount(1);
    await expect(page.locator('.cell-label')).toContainText('10m × 10m');
    await expect(page.locator('.cell-note')).toContainText('실제 분양이나 소유가 아닌');
    await expect(page.locator('.disclaimer')).toContainText('실제 토지 소유권과 관계없');
  });

  test('연인 MBTI: 추천 별이 미리 골라져 있고, 순서를 바꿔도 같은 추천', async ({ page }) => {
    await findByDate(page, '2019-05-04', { couple: ['INFP', 'ESTJ'] });
    const a = await page.locator('.cand-list button[aria-checked="true"]').innerText();
    await expect(page.locator('.badge.rec')).toHaveCount(1);
    await expect(page.locator('.rec-note')).toContainText('추천한 별');
    await findByDate(page, '2019-05-04', { couple: ['ESTJ', 'INFP'] });
    expect(await page.locator('.cand-list button[aria-checked="true"]').innerText()).toBe(a);
  });

  test('전화번호는 가려서 보여 주고, [번호 모두 보기]로만 다 보인다', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/mine/1');
    await page.getByRole('radio', { name: '전화번호' }).click();
    await page.getByLabel(/전화번호/).fill('010-5796-0488');
    await page.getByRole('button', { name: '후보 별 보기' }).click();
    await page.waitForSelector('.cand-list');
    for (const t of await page.locator('.cand-list .np').allTextContents()) expect(t).toMatch(/^\S\S 57●● ●●88$/);
    await chooseCandidate(page, 0);
    await expect(page.locator('.land-stamp .np')).toHaveText(/57●● ●●88/);
    await page.getByRole('button', { name: '번호 모두 보기' }).click();
    await expect(page.locator('.land-stamp .np')).toHaveText(/5796 0488/);
  });

  test('선물: 동의해야 보낼 수 있고, 링크에는 MBTI·날짜 종류가 없으며, 받은 사람도 같은 별땅과 카드', async ({ page, context, browser }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await findByDate(page, '2019-05-04', { couple: ['INFP', 'ESTJ'] });
    await chooseCandidate(page, 0, '첫 여행');
    const place = await page.locator('.land-hero h1').innerText();
    const card = await page.locator('.land-card').first().locator('.cname').innerText();
    await expect(page.getByRole('button', { name: '선물 링크 보내기' })).toBeDisabled();
    await page.getByRole('checkbox', { name: /괜찮아요/ }).check();
    await page.evaluate(() => { delete Navigator.prototype.share; });
    await page.getByRole('button', { name: '선물 링크 보내기' }).click();
    await expect(page.locator('.status')).toContainText('복사');
    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain('#/g?');
    expect(decodeURIComponent(url)).not.toMatch(/INFP|ESTJ|2019-05-04|birthday|anniv/);
    const other = await browser.newPage();
    await prepare(other);
    await other.goto(url.replace(/^https?:\/\/[^/]+/, ''));
    await other.waitForSelector('.land-hero');
    await expect(other.locator('.land-hero h1')).toHaveText(place);
    await expect(other.locator('.land-card').first().locator('.cname')).toHaveText(card);
    await expect(other.locator('.gift-message')).toContainText('첫 여행');
    await expect(other.getByRole('link', { name: '나도 내 별땅 분양받기' })).toBeVisible();
    await other.close();
  });

  test('기념 땅문서 이미지 저장, 휴대폰 달력 파일', async ({ page }) => {
    await findByDate(page, '2019-05-04');
    await chooseCandidate(page, 1, '엄마, 생신 축하드려요. 늘 건강하시고 우리 가족 곁에 오래오래 계셔 주세요. 사랑해요!');
    await page.getByRole('checkbox', { name: /괜찮아요/ }).check();
    const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '별땅문서 이미지 저장' }).click()]);
    expect(png.suggestedFilename()).toBe('byeolttang.png');
    await png.saveAs(test.info().outputPath('deed.png'));
    const [ics] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '휴대폰 달력에 추가' }).click()]);
    expect(ics.suggestedFilename()).toBe('byeolttang.ics');
  });

  test('기념일로 기억하기 → 첫 화면 D-day → 보관함에서 다시 보기·모두 지우기', async ({ page }) => {
    await findByDate(page, '2019-05-04');
    await chooseCandidate(page, 0);
    const place = await page.locator('.land-hero h1').innerText();
    await page.getByRole('button', { name: /기념일로 기억하기/ }).click();
    await page.goto('/#/');
    await expect(page.locator('.dday-list')).toContainText('내 생일');
    await expect(page.locator('.dday-item span')).toHaveText(/^D-\d+ · D\+/);
    await page.goto('/#/archive');
    await expect(page.locator('.archive-list li')).toHaveCount(1);
    await page.getByRole('button', { name: '다시 보기' }).click();
    await expect(page.locator('.land-hero h1')).toHaveText(place);
    await page.goto('/#/archive');
    await page.getByRole('button', { name: '모두 지우기' }).click();
    await expect(page.locator('.archive-list li')).toHaveCount(0);
  });

  test('우리 별땅 첫 화면의 만남 별자리: 날짜 없이 두 동네 + 거리 → 공개 장소 3곳(A·B·1·2·3)과 근처 맛집, 같은 동네도 됨', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/us/1');
    await expect(page.locator('.meet-card h2')).toContainText('우리 둘 만남 별자리');
    await expect(page.locator('.meet-card')).toContainText('오늘 날짜의 수호 카드');
    await page.locator('.jump-meet').click();
    await expect(page.getByRole('button', { name: '만남 장소 3곳 찾기' })).toBeDisabled();
    await expect(page.getByRole('radio', { name: /가까운 곳/ })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('radio', { name: /조금 먼 곳/ }).click();
    await page.getByLabel('나 시·도').selectOption('11');
    await page.getByLabel('나 시·군·구').selectOption('11440');
    await page.getByLabel('상대 시·도').selectOption('11');
    await page.getByLabel('상대 시·군·구').selectOption('11680');
    await page.getByRole('button', { name: '만남 장소 3곳 찾기' }).click();
    await expect(page.locator('.meet-list b.no')).toHaveText(['1', '2', '3'], { timeout: 20000 });
    expect(await page.locator('.meet-star text').allTextContents()).toEqual(expect.arrayContaining(['A', 'B', '1', '2', '3']));
    await expect(page.locator('.meet-list .food-list').first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.meet-list li.home')).toHaveText(['A 나: 내가 출발하는 지점', 'B 상대: 상대가 출발하는 지점']);
    // 날짜를 고르면 그 날의 카드 방향으로 바뀐다
    await pickDate(page, '2019-05-04');
    await expect(page.locator('.meet-card')).toContainText('우리 날의 수호 카드');
    await page.getByRole('checkbox', { name: /같은 동네/ }).check();
    await page.getByRole('button', { name: '만남 장소 3곳 찾기' }).click();
    await expect(page.locator('.meet-list b.no')).toHaveText(['1', '2', '3'], { timeout: 20000 });
    // 내 별땅에는 없다
    await page.goto('/#/mine/1');
    await expect(page.locator('.meet-card')).toHaveCount(0);
  });

  test('알아보기: 퀴즈와 기준점 구역 지도(예시를 바꾸면 그림도 바뀜)', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/learn');
    await expect(page.locator('.quiz')).toBeVisible();
    await expect(page.locator('.zone-map')).toContainText('기준점');
    await expect(page.locator('.zm-name.here').first()).toHaveText('다사');
    await page.getByRole('button', { name: '부산시청 인근' }).click();
    await expect(page.locator('.zm-name.here').first()).toHaveText('마라');
    await expect(page.locator('.zm-steps')).toContainText('마라 4341 8830');
  });
});

test('첫 화면 오늘의 행운: 카드 1장 + 1~45 번호 3개, 다시 열어도 같은 날엔 같다', async ({ page }) => {
  await openHome(page);
  const box = page.locator('.daily-luck');
  await expect(box.locator('h2')).toHaveText('오늘의 행운');
  await expect(box.locator('.cname')).toBeVisible();
  const balls = await box.locator('.ball').allTextContents();
  expect(balls).toHaveLength(3);
  const nums = balls.map(Number);
  expect(new Set(nums).size).toBe(3);
  for (const n of nums) expect(n >= 1 && n <= 45).toBe(true);
  const card = await box.locator('.cname').innerText();
  await page.reload();
  await expect(box.locator('.cname')).toHaveText(card);
  expect(await box.locator('.ball').allTextContents()).toEqual(balls);
  await expect(box).toContainText('당첨 확률과도 관계없어요');
  await expect(box).not.toContainText('로또');
});
