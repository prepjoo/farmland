import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, enterMeaning, chooseCandidate } from './helpers.js';

// 접근성: WCAG 2.1 A·AA 자동 검사. 지도 바탕 그림(외부)은 검사에서 뺀다.
async function audit(page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('.leaflet-container').analyze();
  return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}곳) → ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
}

async function allScreens(page) {
  await prepare(page);
  await page.goto('/#/');
  await page.locator('.feature').first().waitFor();
  expect(await audit(page)).toEqual([]);
  await page.getByRole('button', { name: '메뉴' }).click();
  expect(await audit(page)).toEqual([]);
  await page.goto('/#/today');
  expect(await audit(page)).toEqual([]);
  await enterMeaning(page);
  expect(await audit(page)).toEqual([]);
  await chooseCandidate(page, 0);
  await page.locator('.near-list').waitFor();
  expect(await audit(page)).toEqual([]);
  await page.getByRole('radio', { name: '주역' }).click();
  expect(await audit(page)).toEqual([]);
  await page.goto('/#/week');
  expect(await audit(page)).toEqual([]); // 19세 확인
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
  await page.getByRole('button', { name: '바로 보기' }).click();
  expect(await audit(page)).toEqual([]);
  for (const path of ['/#/my', '/#/learn', '/#/here']) {
    await page.goto(path);
    await page.waitForTimeout(400);
    expect(await audit(page)).toEqual([]);
  }
}

test.describe('밝은 모드', () => {
  test.use({ reducedMotion: 'reduce' });
  test('모든 화면', async ({ page }) => { await allScreens(page); });
});

test.describe('어두운 모드', () => {
  test.use({ colorScheme: 'dark', reducedMotion: 'reduce' });
  test('모든 화면', async ({ page }) => { await allScreens(page); });
});

test.describe('키보드', () => {
  test.use({ reducedMotion: 'reduce' });
  test('키보드만으로 오늘의 행운까지 갈 수 있다', async ({ page }) => {
    const tabTo = async (target) => {
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab');
        if (await target.evaluate((el) => el === document.activeElement)) break;
      }
      await expect(target).toBeFocused();
    };
    await prepare(page);
    await page.goto('/#/');
    await tabTo(page.locator('.feature.today-card'));
    await page.keyboard.press('Enter');
    await tabTo(page.getByRole('radio', { name: 'MBTI' }));
    await page.keyboard.press('Enter');
    const sel = page.getByLabel('MBTI');
    await tabTo(sel);
    await sel.selectOption('INFP');
    await tabTo(page.getByRole('button', { name: '맞는 지역 보기' }));
    await page.keyboard.press('Enter');
    const first = page.locator('.cand-list button').first();
    await tabTo(first);
    await page.keyboard.press('Enter');
    await expect(page.locator('.fortune')).toBeVisible();
  });
});

test.describe('위치', () => {
  test.use({ reducedMotion: 'reduce' });
  test('행운 화면들에서는 위치를 묻지 않는다', async ({ page, context }) => {
    let asked = false;
    await context.exposeFunction('__asked', () => { asked = true; });
    await page.addInitScript(() => {
      const orig = navigator.geolocation;
      const wrap = (fn) => (...a) => { window.__asked(); return fn.apply(orig, a); };
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: wrap(orig.getCurrentPosition), watchPosition: wrap(orig.watchPosition), clearWatch: orig.clearWatch.bind(orig) } });
    });
    await prepare(page);
    await page.goto('/#/today');
    await enterMeaning(page);
    await chooseCandidate(page, 0);
    await page.goto('/#/week');
    expect(asked).toBe(false);
  });
});
