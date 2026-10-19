import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, openLuck, openHappy } from './helpers.js';

// 행복 추천장소 = 두 사람 만남 별자리(별땅 방식) · 행운지점 현재 위치 · 지도 확대·거리 원. 위치는 누를 때만, 저장·전송 없음.
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

async function pickPartner(page) {
  await page.getByLabel('상대 시·도').selectOption({ label: '인천광역시' });
  await page.getByLabel('상대 시·군·구').selectOption({ label: '부평구' });
  await expect(page.getByLabel('상대 읍·면·동').locator('option')).not.toHaveCount(1);
  await page.getByLabel('상대 읍·면·동').selectOption({ index: 1 });
}

test('만남 별자리: 내 위치 + 상대 동(읍·면·동) → 별 그림, 장소 3곳, 지도에 별 선과 확대 단추', async ({ page, context }) => {
  await countAsks(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 20 });
  await prepare(page);
  await page.goto('/#/happy/place');
  await expect(page.locator('.meet')).toContainText('오늘의 카드');
  await expect(page.getByRole('button', { name: '만남 별자리 그리기' })).toBeDisabled();
  expect(await page.evaluate(() => window.__asked)).toBe(0);
  await page.getByRole('button', { name: '내 위치 찾기' }).click();
  await expect(page.locator('.meet-person').first()).toContainText('현재 위치를 찾았어요');
  await pickPartner(page);
  await page.getByRole('radio', { name: '조금 먼 곳 15km' }).click();
  await page.getByRole('button', { name: '만남 별자리 그리기' }).click();
  await expect(page.locator('svg.meet-star')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.meet-star .ms-spot')).toHaveCount(3);
  await expect(page.locator('.fl-meet-list > li')).toHaveCount(5); // A·B·1·2·3
  await expect(page.locator('.fl-meet-list > li').nth(2)).toContainText('나에게서 약');
  await expect(page.locator('.fl-meet-list > li').nth(2)).toContainText('상대에게서 약');
  await expect(page.locator('.meet .lucky-map .leaflet-control-zoom-in')).toBeVisible();
  await expect(page.locator('.meet .lucky-map path.leaflet-interactive')).toHaveCount(1); // 별 선
  await page.getByRole('button', { name: '이 장소 고르기' }).first().click();
  const links = await page.locator('.start-box .route-link').evaluateAll((as) => as.map((a) => a.href));
  expect(links[0]).toMatch(/^https:\/\/map\.kakao\.com\/link\/to\//); // 나: 목적지만(내 위치 안 넣음)
  expect(links[0]).not.toContain('37.5665');
  expect(links[1]).toMatch(/^https:\/\/map\.kakao\.com\/link\/from\//); // 상대: 상대 동 대표 지점에서
  const stored = await page.evaluate(() => Object.values(localStorage).join('|'));
  expect(stored).not.toContain('37.5665');
  expect(stored).not.toContain('부평');
  expect(await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.leaflet-container').analyze().then((r) => r.violations.map((v) => v.id))).toEqual([]);
});

test('만남 별자리: 둘 다 동네로, 같은 동네면 내 둘레 별', async ({ page }) => {
  await openHappy(page);
  await page.getByRole('radio', { name: '동네 고르기' }).click();
  await page.getByLabel('나 시·도').selectOption({ label: '서울특별시' });
  await page.getByLabel('나 시·군·구').selectOption({ label: '종로구' });
  await page.getByLabel('같은 동네에 있어요', { exact: false }).check();
  await page.getByRole('button', { name: '만남 별자리 그리기' }).click();
  await expect(page.locator('.fl-meet-list > li')).toHaveCount(4, { timeout: 15000 }); // A·1·2·3
  await expect(page.locator('.meet')).toContainText('행복위치와 오늘 날짜로 정해진 오늘의 타로 카드');
});

test('위치를 허용하지 않으면 안내만 나온다', async ({ page }) => {
  await page.addInitScript(() => { navigator.geolocation.getCurrentPosition = (_ok, fail) => setTimeout(() => fail({ code: 1 }), 10); });
  await prepare(page);
  await page.goto('/#/happy/place');
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
  expect(await page.evaluate(() => window.__asked)).toBe(0);
  await page.getByRole('button', { name: '위치찾기' }).click();
  await expect(page.locator('.chosen-bar')).toContainText('다사 5390 5203');
  await page.getByRole('button', { name: /^추첨/ }).click();
  await expect(page.locator('.game-list > li')).toHaveCount(1);
  const stored = await page.evaluate(() => Object.values(localStorage).join('|'));
  expect(stored).not.toContain('5390');
});

test('행운장소 지도: 확대 단추, 거리를 고르면 범위 원이 바뀌고 지도가 맞춰진다', async ({ page }) => {
  await openLuck(page);
  const map = page.locator('#store-h ~ .map-row .lucky-map, .sub-panel:has(#store-h) .lucky-map').first();
  await expect(map.locator('.leaflet-control-zoom-in')).toBeVisible();
  await page.getByRole('radio', { name: '걸어서 1.5km' }).click();
  const zoom = async () => page.evaluate(() => {
    const el = [...document.querySelectorAll('.lucky-map .leaflet-tile-pane, .lucky-map .leaflet-map-pane')].at(-1);
    return el?.closest('.leaflet-container')?.querySelector('.leaflet-proxy')?.style.transform ?? '';
  });
  const near = await zoom();
  await page.getByRole('radio', { name: '당일치기 60km' }).click();
  await expect.poll(zoom).not.toBe(near); // 범위가 넓어지면 지도가 축소된다
  await page.getByRole('button', { name: '행운장소', exact: true }).click();
  await expect(page.locator('.near-list li')).toHaveCount(3);
});
