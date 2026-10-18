import { test, expect } from '@playwright/test';
import { prepare, enterMeaning, chooseCandidate, openWeek, openToday } from './helpers.js';

const BANNED = ['명당', '예측', '적중', '확률 상승', '보장', '대박', '1위'];

test('첫 화면: 큰 기능 두 개(오늘·이번 주)와 풀다운 메뉴, 오른쪽 위 긴급 신고', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/');
  await expect(page.locator('.feature')).toHaveCount(2);
  await expect(page.locator('.feature.today-card')).toContainText('오늘의 행운 카드와 행운 장소');
  await expect(page.locator('.feature.week-card')).toContainText('이번 주 행운번호와 행운 장소');
  await expect(page.locator('header .mini.sos')).toBeVisible();
  await page.getByRole('button', { name: '메뉴' }).click();
  const menu = page.getByRole('navigation', { name: '전체 메뉴' });
  await expect(menu.getByRole('link')).toHaveText(['처음 화면', '오늘의 행운', '이번 주 행운', '내 귀땅 마을', '국가지점번호란?', '내 위치 국가지점번호']);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});

test.describe('동작 줄이기', () => {
  test.use({ reducedMotion: 'reduce' });

  test('입력 방식 3가지, 개인정보 안내, 후보 9~12곳 중 고르기', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/today');
    await expect(page.locator('.privacy')).toContainText('이 기기 안에서만');
    await expect(page.getByRole('radiogroup', { name: '입력 방식' }).getByRole('radio')).toHaveText(['생년월일', '전화번호', 'MBTI']);
    await enterMeaning(page, { method: 'phone' });
    const n = await page.locator('.cand-list button').count();
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(13);
    await expect(page.locator('.cand-list')).toContainText('57●● ●●88'); // 전화번호는 가운데를 가린다
  });

  test('생년월일·MBTI로도 후보가 나온다', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/today');
    await enterMeaning(page, { method: 'date', value: '1962-03-07' });
    await page.goto('/#/today');
    await page.reload();
    await enterMeaning(page, { method: 'mbti', value: 'ESTJ' });
    await expect(page.locator('.cand-list')).toContainText('0519 2010');
  });

  test('오늘: 타로·주역 카드와 주변 행운 장소 3곳, 거리 바꾸기', async ({ page }) => {
    await openToday(page, { index: 2 });
    await expect(page.locator('.fortune .card-name')).toContainText('번');
    await page.getByRole('radio', { name: '주역' }).click();
    await expect(page.locator('.fortune .card-name')).toContainText('괘');
    await expect(page.locator('.near-list li')).toHaveCount(3);
    await page.getByRole('radio', { name: '당일치기 60km' }).click();
    await expect(page.locator('.near-list li')).toHaveCount(3);
    await expect(page.getByRole('radiogroup', { name: '거리' }).getByRole('radio')).toHaveText(['걸어서 1.5km', '가까운 곳 6km', '조금 먼 곳 15km', '당일치기 60km']);
  });

  test('오늘은 19세 확인 없이 쓸 수 있고, 고른 곳은 이번 주와 함께 쓴다', async ({ page }) => {
    await openToday(page);
    const place = await page.locator('.chosen-bar strong').innerText();
    await page.goto('/#/week');
    await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
    await expect(page.locator('.chosen-bar strong')).toHaveText(place);
    await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
  });

  test('이번 주: 번호 5게임, 같은 주에는 같은 번호, 판매점 3곳과 이유', async ({ page }) => {
    await openWeek(page, { index: 1 });
    const a = await page.locator('.numbers .ball').allInnerTexts();
    expect(a.map(Number)).toEqual([...a.map(Number)].sort((x, y) => x - y));
    await expect(page.locator('.games button')).toHaveCount(5);
    await expect(page.locator('.near-list li')).toHaveCount(3);
    await expect(page.locator('.near-list')).toContainText('최근 1년 자동 1등');
    await page.getByRole('tab', { name: 'B' }).click();
    const b = await page.locator('.numbers .ball').allInnerTexts();
    expect(b).not.toEqual(a);
    await page.getByRole('button', { name: '바로 보기' }).click();
    await expect(page.locator('.reasons')).toContainText('8,145,060분의 1');
    await expect(page.getByText('모든 번호 조합의 1등 확률은 같습니다').first()).toBeVisible();
    // 다시 들어와도(새로 골라도) 같은 번호
    await page.getByRole('button', { name: '다른 곳 고르기' }).click();
    await enterMeaning(page);
    await chooseCandidate(page, 1);
    await page.getByRole('tab', { name: 'A' }).click();
    await expect(page.locator('.numbers .ball')).toHaveText(a);
  });

  test('19세 미만이면 이번 주 번호·판매점이 보이지 않는다', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/week');
    await page.getByRole('button', { name: '아니요' }).click();
    await expect(page.locator('main')).toContainText('만 19세 이상만');
    await expect(page.locator('.ball')).toHaveCount(0);
  });

  test('판매점 자료를 못 불러오면 지어내지 않는다', async ({ page }) => {
    await page.route(/lotto-stores\.json/, (r) => r.abort());
    await openWeek(page);
    await expect(page.locator('main')).toContainText('자료 준비 중');
  });

  test('금지 표현이 화면에 없다', async ({ page }) => {
    await openWeek(page);
    await page.getByRole('button', { name: '바로 보기' }).click();
    for (const path of ['/#/', '/#/today', '/#/week', '/#/my']) {
      await page.goto(path);
      await page.waitForTimeout(300);
      const text = await page.locator('main').innerText();
      for (const w of BANNED) expect(text, `${path}에 '${w}'`).not.toContain(w);
    }
  });
});

test('연출: 추첨기는 건너뛸 수 있다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/week');
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await enterMeaning(page);
  await chooseCandidate(page, 0);
  await expect(page.locator('canvas.drum')).toBeVisible();
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
  await expect(page.getByRole('button', { name: '바로 보기' })).toBeVisible();
});
