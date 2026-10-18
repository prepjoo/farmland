import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openHome, findByDate, chooseCandidate, prepare, pickDate } from './helpers.js';

// 접근성(F-26): WCAG 2.1 A·AA 자동 검사. 지도 바탕 그림(외부)은 검사에서 뺀다.
async function audit(page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('.leaflet-container').analyze();
  return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}곳) → ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
}

async function allScreens(page) {
  await openHome(page);
  expect(await audit(page)).toEqual([]);
  for (const f of ['mine', 'us', 'mbti']) {
    await page.goto(`/#/${f}/1`);
    await page.waitForSelector('.input-screen');
    expect(await audit(page)).toEqual([]);
  }
  await findByDate(page, '1962-03-07');
  expect(await audit(page)).toEqual([]);
  await chooseCandidate(page, 0, '고향');
  expect(await audit(page)).toEqual([]);
  await page.getByRole('button', { name: /기념일로 기억하기/ }).click();
  await page.goto('/#/us/1');
  await page.reload();
  await pickDate(page, '2019-05-04');
  await page.getByLabel('나 시·도').selectOption('11');
  await page.getByLabel('나 시·군·구').selectOption('11440');
  await page.getByRole('checkbox', { name: /같은 동네/ }).check();
  await page.getByRole('button', { name: '만남 장소 3곳 찾기' }).click();
  await page.locator('.meet-list .food-list').first().waitFor({ timeout: 20000 });
  expect(await audit(page)).toEqual([]);
  await page.goto('/#/mine/1');
  await page.reload();
  await findByDate(page, '1962-03-07');
  await chooseCandidate(page, 0);
  await page.getByRole('button', { name: /기념일로 기억하기/ }).click();
  await page.goto('/#/');
  await page.waitForSelector('.dday-list');
  expect(await audit(page)).toEqual([]);
  for (const path of ['/#/learn', '/#/archive', '/#/here', '/#/g?n=%EB%A7%88%EB%A7%8857960488&c=10&y=2026&t=hi']) {
    await page.goto(path);
    await page.waitForTimeout(400);
    expect(await audit(page)).toEqual([]);
  }
}

test('모든 화면 (밝은 모드)', async ({ page }) => {
  await allScreens(page);
});

test.describe('어두운 화면 모드', () => {
  test.use({ colorScheme: 'dark' });
  test('모든 화면 (어두운 모드)', async ({ page }) => {
    await allScreens(page);
  });
});

test('키보드만으로 내 별땅까지 갈 수 있다', async ({ page }) => {
  const tabTo = async (target) => {
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press('Tab');
      if (await target.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(target).toBeFocused();
  };
  await openHome(page);
  await tabTo(page.locator('.menu-grid .menu-tile').first());
  await page.keyboard.press('Enter');
  for (const [label, v] of [['날짜 연대', '1960'], ['날짜 년', '1962'], ['날짜 월', '3'], ['날짜 일', '7']]) {
    const sel = page.getByLabel(label);
    await tabTo(sel);
    await sel.selectOption(v);
  }
  await tabTo(page.getByRole('button', { name: '후보 별 보기' }));
  await page.keyboard.press('Enter');
  const first = page.locator('.cand-list button').first();
  await tabTo(first);
  await page.keyboard.press('Enter');
  await tabTo(page.locator('.submit-bar .primary'));
  await page.keyboard.press('Enter');
  await expect(page.locator('.land-hero h1')).toBeVisible();
});
