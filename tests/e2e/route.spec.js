import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openToday, openWeek } from './helpers.js';

// 행운 장소로 가는 길: 장소별 [길찾기](카카오맵 새 창), [내 위치에서 거리 보기]는 누를 때만 위치를 찾는다.
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

test('오늘: 장소마다 길찾기 링크(목적지만), 누르기 전에는 위치를 묻지 않는다', async ({ page, context }) => {
  await countAsks(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 30 });
  await openToday(page);
  await expect(page.locator('.near-list li')).toHaveCount(3);
  const links = page.locator('.near-list .route-link');
  await expect(links).toHaveCount(3);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.href))) {
    expect(href).toMatch(/^https:\/\/map\.kakao\.com\/link\/to\/[^,]+,\d+\.\d{6},\d+\.\d{6}$/);
    expect(href).not.toContain('37.5665'); // 내 위치는 넣지 않음
  }
  await expect(links.first()).toHaveAttribute('target', '_blank');
  await expect(links.first()).toHaveAttribute('rel', /noopener/);
  expect(await page.evaluate(() => window.__asked)).toBe(0);
  await expect(page.locator('.from-me-km')).toHaveCount(0);

  await page.getByRole('button', { name: '내 위치에서 거리 보기' }).click();
  await expect(page.locator('.from-me-km')).toHaveCount(3);
  await expect(page.locator('.from-me-km').first()).toContainText('내 위치에서 약');
  expect(await page.evaluate(() => window.__asked)).toBe(1);
  const stored = await page.evaluate(() => Object.values(localStorage).join('|'));
  expect(stored).not.toContain('37.5665');
  expect(await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).exclude('.leaflet-container').analyze().then((r) => r.violations.map((v) => v.id))).toEqual([]);

  await page.getByRole('button', { name: '내 위치 지우기' }).click();
  await expect(page.locator('.from-me-km')).toHaveCount(0);
});

test('이번 주: 판매점은 주소가 없어 카카오맵 검색 링크, 내 위치 거리는 시·군·구 대표 지점까지', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 35.1796, longitude: 129.0756, accuracy: 20 });
  await openWeek(page);
  await page.getByRole('button', { name: '바로 보기' }).waitFor();
  const links = page.locator('.near-list .route-link');
  await expect(links).toHaveCount(3);
  await expect(links.first()).toHaveText('카카오맵에서 찾기');
  expect(await links.first().getAttribute('href')).toMatch(/^https:\/\/map\.kakao\.com\/link\/search\//);
  await page.getByRole('button', { name: '내 위치에서 거리 보기' }).click();
  await expect(page.locator('.from-me-km')).toHaveCount(3);
});

test('위치를 허용하지 않으면 안내만 나오고 길찾기는 그대로', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, fail) => setTimeout(() => fail({ code: 1 }), 10);
  });
  await openToday(page);
  await page.getByRole('button', { name: '내 위치에서 거리 보기' }).click();
  await expect(page.getByRole('alert')).toContainText('위치 권한이 꺼져 있어요');
  await expect(page.locator('.near-list .route-link')).toHaveCount(3);
});
