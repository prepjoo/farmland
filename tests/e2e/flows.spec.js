import { test, expect } from '@playwright/test';
import { prepare, openToday, findPlace } from './helpers.js';

const BANNED = ['명당', '예측', '적중', '확률 상승', '보장', '대박', '1위'];

test.describe('오늘의 행운 (동작 줄이기)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('번호 6개 → 장소 → 이유, 확률 문구가 함께 보인다', async ({ page }) => {
    await openToday(page);
    await expect(page.locator('.games button')).toHaveCount(5);
    await expect(page.locator('.place-info')).toContainText('최근 1년 자동 1등');
    await expect(page.getByText('모든 번호 조합의 1등 확률은 같습니다').first()).toBeVisible();
    await page.getByRole('button', { name: '바로 보기' }).click();
    await expect(page.locator('.reasons')).toContainText('번호 이유');
    await expect(page.locator('.reasons')).toContainText('8,145,060분의 1');
    await expect(page.locator('.reasons')).toContainText('오늘의 전국 행운 장소');
  });

  test('공은 작은 수부터 줄 서고, 다시 들어와도 같은 번호(결과부터)', async ({ page }) => {
    await openToday(page);
    const first = await page.locator('.numbers .ball').allInnerTexts();
    const nums = first.map(Number);
    expect([...nums].sort((a, b) => a - b)).toEqual(nums);
    await page.reload();
    await expect(page.getByRole('button', { name: '오늘의 행운번호 받기' })).toHaveCount(0);
    await expect(page.locator('.numbers .ball')).toHaveText(first);
  });

  test('게임 B를 누르면 다른 조합', async ({ page }) => {
    await openToday(page);
    const a = await page.locator('.numbers .ball').allInnerTexts();
    await page.getByRole('tab', { name: 'B' }).click();
    await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
    const b = await page.locator('.numbers .ball').allInnerTexts();
    expect(b).not.toEqual(a);
  });

  test('19세 미만이면 번호·장소 없이 오늘의 카드만', async ({ page }) => {
    await openToday(page, { adult: false });
    await expect(page.locator('.minor')).toContainText('만 19세 이상만');
    await expect(page.locator('.ball')).toHaveCount(0);
    await page.goto('/#/place');
    await expect(page.locator('main')).toContainText('만 19세 이상만');
  });

  test('판매점 자료를 못 불러오면 장소를 지어내지 않는다', async ({ page }) => {
    await page.route(/lotto-stores\.json/, (r) => r.abort());
    await openToday(page);
    await expect(page.locator('.place-card')).toContainText('자료 준비 중');
  });

  test('행운 장소: 동네를 고르면 카드 방향으로 찾고, 기억하면 첫 화면도 그 동네 기준', async ({ page }) => {
    await openToday(page);
    await findPlace(page, '서울특별시', '마포구');
    await expect(page.locator('.place-facts')).toContainText(/쪽 약 [\d.]+km/);
    await page.getByRole('checkbox', { name: '이 동네 기억하기' }).check();
    await page.goto('/#/');
    await page.getByRole('button', { name: '바로 보기' }).click();
    await expect(page.locator('.reasons')).toContainText('행운 방향');
  });

  test('나만의 행운: 생일 번호와 둘의 번호(순서를 바꿔도 같다)', async ({ page }) => {
    await openToday(page);
    await page.goto('/#/me');
    await page.getByLabel('월·일 4자리').fill('0412');
    await page.getByRole('button', { name: '번호 받기', exact: true }).click();
    await expect(page.locator('.my-luck section').first().locator('.ball:not(.empty)')).toHaveCount(6);
    const pick = async (a, b) => {
      await page.getByLabel('나 띠').selectOption({ label: a });
      await page.getByLabel('상대 띠').selectOption({ label: b });
      await page.getByRole('button', { name: '둘의 번호 받기' }).click();
      const balls = page.locator('.my-luck section').nth(1).locator('.ball');
      await expect(page.locator('.my-luck section').nth(1).locator('.ball:not(.empty)')).toHaveCount(6);
      return balls.allInnerTexts();
    };
    const x = await pick('용띠', '토끼띠');
    const y = await pick('토끼띠', '용띠');
    expect(y).toEqual(x);
  });

  test('금지 표현이 화면에 없다', async ({ page }) => {
    await openToday(page);
    await page.getByRole('button', { name: '바로 보기' }).click();
    for (const path of ['/#/', '/#/place', '/#/me', '/#/my']) {
      await page.goto(path);
      await page.waitForTimeout(300);
      const text = await page.locator('main').innerText();
      for (const w of BANNED) expect(text, `${path}에 '${w}'`).not.toContain(w);
    }
  });
});

test('연출: 추첨기·룰렛을 건너뛸 수 있다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/');
  await page.getByRole('button', { name: '오늘의 행운번호 받기' }).click();
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await expect(page.locator('canvas.drum')).toBeVisible();
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await expect(page.locator('.roulette')).toBeVisible();
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await expect(page.getByRole('button', { name: '바로 보기' })).toBeVisible();
});

test('아래 탭 4개와 오른쪽 위 작은 버튼', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/');
  const tabs = page.getByRole('navigation', { name: '주메뉴' }).getByRole('link');
  await expect(tabs).toHaveText(['오늘의 행운', '행운 장소', '나만의 행운', '내 귀땅 마을']);
  await expect(page.locator('header .mini.here')).toBeVisible();
  await expect(page.locator('header .mini.sos')).toBeVisible();
});
