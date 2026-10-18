import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, openLuck } from './helpers.js';

// 우리 어디?(두 사람 만남 장소) · 행운지점 현재 위치. 위치는 누를 때만, 저장·전송 없음.
test.use({ reducedMotion: 'reduce' });

async function countAsks(page) {
  await page.addInitScript(() => {
    window.__asked = 0;
    const g = navigator.geolocation;
    const cur = g.getCurrentPosition.bind(g);
    const watch = g.watchPosition.bind(g);
    g.getCurrentPosition = (...a) => { window.__asked++; return cur(...a); };
    g.watchPosition = (...a) => { window.__asked++; return watch(...a); };
  });
}

test('우리 어디?: 내 위치 + 상대 동네 → 만남 장소 3곳, 두 사람 거리와 길찾기', async ({ page, context }) => {
  await countAsks(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 20 });
  await prepare(page);
  await page.goto('/#/meet');
  await expect(page.getByRole('button', { name: '만남 장소 찾기' })).toBeDisabled();
  expect(await page.evaluate(() => window.__asked)).toBe(0);
  await page.getByRole('button', { name: '내 위치 찾기' }).click();
  await expect(page.locator('.meet-person').first()).toContainText('현재 위치를 찾았어요');
  expect(await page.evaluate(() => window.__asked)).toBe(1);
  await page.getByLabel('상대 시·도').selectOption({ label: '인천광역시' });
  await page.getByLabel('상대 시·군·구').selectOption({ label: '부평구' });
  for (const kind of ['관광지', '맛집', '카페']) {
    await page.getByRole('radio', { name: kind }).click();
    await page.getByRole('button', { name: '만남 장소 찾기' }).click();
    await expect(page.locator('.meet-result li')).toHaveCount(3);
  }
  await expect(page.locator('.meet-result li').first()).toContainText('나에게서 약');
  await expect(page.locator('.meet-result li').first()).toContainText('상대에게서 약');
  const hrefs = await page.locator('.meet-result .route-link').evaluateAll((as) => as.map((a) => a.href));
  expect(hrefs).toHaveLength(3);
  for (const h of hrefs) {
    expect(h).toMatch(/^https:\/\/map\.kakao\.com\/link\/to\//);
    expect(h).not.toContain('37.5665');
  }
  const stored = await page.evaluate(() => Object.values(localStorage).join('|'));
  expect(stored).not.toContain('37.5665');
  expect(stored).not.toContain('28237');
  expect(await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.leaflet-container').analyze().then((r) => r.violations.map((v) => v.id))).toEqual([]);
});

test('행복 추천장소도 같은 만남 장소 기능이다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/happy/place');
  await expect(page.locator('#meet-h')).toHaveText('추천장소');
  await expect(page.getByRole('button', { name: '내 위치 찾기' })).toBeVisible();
  await expect(page.getByLabel('상대 시·군·구')).toBeVisible();
});

test('위치를 허용하지 않으면 안내만 나온다', async ({ page }) => {
  await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = (_ok, fail) => setTimeout(() => fail({ code: 1 }), 10); });
  await prepare(page);
  await page.goto('/#/meet');
  await page.getByRole('button', { name: '내 위치 찾기' }).click();
  await expect(page.getByRole('alert')).toContainText('위치 권한이 꺼져 있어요');
});

test('행운지점: 국가지점으로 현재 위치 → 그 칸의 번호가 행운위치, 누르기 전에는 묻지 않음', async ({ page, context }) => {
  await countAsks(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 9 });
  await prepare(page);
  await page.goto('/#/luck');
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await expect(page.getByRole('radio', { name: '국가지점으로 현재 위치' })).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => window.__asked)).toBe(0);
  await page.getByRole('button', { name: '위치찾기' }).click();
  await expect(page.locator('.chosen-bar')).toContainText('현재 위치');
  await expect(page.locator('.chosen-bar')).toContainText('다사 5390 5203');
  await page.getByRole('button', { name: /^추첨/ }).click();
  await expect(page.locator('.game-list > li')).toHaveCount(1);
  const stored = await page.evaluate(() => Object.values(localStorage).join('|'));
  expect(stored).not.toContain('5390');
});

test('행운지점: 의미 있는 숫자로도 찾을 수 있다', async ({ page }) => {
  await openLuck(page);
  await expect(page.locator('.chosen-bar')).toContainText('오늘의 행운위치');
});
