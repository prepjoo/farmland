import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, enterMeaning, chooseCandidate } from './helpers.js';

// 내 귀땅 마을: 그림 2종 · 캐릭터 · 미션 2가지. 1팜은 가상 칸, 번호·판매점에는 보상 없음.
test.use({ reducedMotion: 'reduce' });

async function audit(page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('.leaflet-container').analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
}

async function seeToday(page) {
  await page.goto('/#/today');
  await enterMeaning(page);
  await chooseCandidate(page, 0);
  await expect(page.locator('.fortune')).toBeVisible();
}

test('처음엔 마을 그림 2종 중 고르기 → 첫 1팜, 가상 칸 안내', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/my');
  await expect(page.locator('.theme-card')).toHaveCount(2);
  await expect(page.locator('main')).toContainText('그림 속 가상 칸');
  expect(await audit(page)).toEqual([]);
  await page.getByRole('button', { name: /바닷가 마을/ }).click();
  await expect(page.locator('.farm-count')).toContainText('1팜');
  await expect(page.getByRole('img', { name: '바닷가 마을 그림, 내 땅 1팜' })).toBeVisible();
  await expect(page.locator('.missions li')).toHaveCount(2);
  await expect(page.locator('.missions')).toContainText('0/5일');
  await expect(page.getByRole('link', { name: '보러 가기' })).toHaveAttribute('href', '#/today');
  expect(await audit(page)).toEqual([]);
  // 캐릭터·그림 바꾸기
  await page.getByRole('radio', { name: '병아리' }).click();
  await expect(page.locator('.farm-count')).toContainText('병아리');
  await page.getByRole('radio', { name: '들녘 마을' }).click();
  await expect(page.locator('.farm-count')).toContainText('1팜 · 들녘 마을');
});

test('오늘의 행운을 보면 하루 1팜, 같은 날 다시 보면 그대로', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/my');
  await page.getByRole('button', { name: /들녘 마을/ }).click();
  await seeToday(page);
  await expect(page.locator('.mission-note')).toContainText('1팜이 늘었어요');
  await page.getByRole('link', { name: '내 귀땅 마을 보기' }).click();
  await expect(page.locator('.farm-count')).toContainText('2팜');
  await expect(page.locator('.missions li').first()).toContainText('완료');
  await expect(page.locator('.missions')).toContainText('1/5일');
  await page.reload();
  await seeToday(page);
  await expect(page.locator('.mission-note')).toContainText('이미 완료');
  await page.goto('/#/my');
  await expect(page.locator('.farm-count')).toContainText('2팜');
});

test('이번 주 5일째에는 1팜을 더 받는다(일요일~토요일)', async ({ page }) => {
  await prepare(page);
  await page.clock.setFixedTime(new Date('2026-10-15T03:00:00Z')); // 목요일(한국 12시)
  await page.addInitScript(() => {
    localStorage.setItem('farmland:village', JSON.stringify({ v: 1, theme: 'field', pin: 'sprout', farms: 5, days: ['2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'], weeks: [] }));
  });
  await seeToday(page);
  await expect(page.locator('.mission-note')).toContainText('이번 주 5일 방문도 채워');
  await page.goto('/#/my');
  await expect(page.locator('.farm-count')).toContainText('7팜');
  await expect(page.locator('.missions')).toContainText('5/5일');
  await expect(page.locator('.missions li').nth(1)).toContainText('완료');
});

test('이번 주 번호·판매점을 봐도 팜은 늘지 않는다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/my');
  await page.getByRole('button', { name: /들녘 마을/ }).click();
  await page.goto('/#/week');
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await enterMeaning(page);
  await chooseCandidate(page, 0);
  await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
  await page.goto('/#/my');
  await expect(page.locator('.farm-count')).toContainText('1팜');
  await expect(page.locator('.missions')).toContainText('0/5일');
});

test('이 기기 저장소에는 입력한 숫자·고른 곳이 남지 않는다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/my');
  await page.getByRole('button', { name: /들녘 마을/ }).click();
  await seeToday(page);
  const place = await page.locator('.chosen-bar strong').innerText();
  await page.goto('/#/week');
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await expect(page.locator('.numbers .ball:not(.empty)')).toHaveCount(6);
  const all = await page.evaluate(() => Object.keys(localStorage).map((k) => `${k}=${localStorage.getItem(k)}`).join('\n'));
  expect(all).toContain('farmland:village');
  expect(all).not.toContain('57960488');
  expect(all).not.toContain('5796');
  expect(all).not.toContain('0488');
  expect(all).not.toContain(place);
});

test('마을 기록 지우기는 한 번 더 묻고 지운다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/my');
  await page.getByRole('button', { name: /들녘 마을/ }).click();
  await page.getByRole('button', { name: '마을 기록 지우기' }).click();
  await page.getByRole('button', { name: '그만두기' }).click();
  await expect(page.locator('.farm-count')).toContainText('1팜');
  await page.getByRole('button', { name: '마을 기록 지우기' }).click();
  await page.getByRole('button', { name: '지우기', exact: true }).click();
  await expect(page.locator('.theme-card')).toHaveCount(2);
});

test('어두운 모드에서도 마을 화면 접근성', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await prepare(page);
  await page.goto('/#/my');
  await page.getByRole('button', { name: /들녘 마을/ }).click();
  await seeToday(page);
  expect(await audit(page)).toEqual([]);
  await page.goto('/#/my');
  expect(await audit(page)).toEqual([]);
});
