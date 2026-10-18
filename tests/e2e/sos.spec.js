import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare } from './helpers.js';

test.describe('긴급 신고', () => {
  test('오른쪽 위 작은 [내 위치] → 지금 칸의 국가지점번호(계산값)와 오차, 누르기 전에는 위치를 묻지 않는다', async ({ page, context }) => {
    await prepare(page);
    await page.addInitScript(() => { window.__asked = 0; const w = navigator.geolocation.watchPosition.bind(navigator.geolocation); navigator.geolocation.watchPosition = (...a) => { window.__asked++; return w(...a); }; });
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 9 });
    await page.goto('/#/');
    await page.goto('/#/mine/1');
    expect(await page.evaluate(() => window.__asked)).toBe(0);
    await expect(page.locator('header .top-quick a')).toHaveCount(2);
    await page.locator('header .mini.here').click();
    await expect(page.locator('section.here .land-stamp .np')).toHaveText('다사 5390 5203');
    await expect(page.locator('section.here')).toContainText('오차 약 9m');
    expect(await page.evaluate(() => window.__asked)).toBeGreaterThan(0);
  });

  test('오른쪽 위 긴급 신고 → 전화 버튼이 바로 보인다', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/');
    await page.locator('header .mini.sos').click();
    await expect(page.locator('.sos h1')).toHaveText('긴급 신고');
    await expect(page.locator('a[href="tel:119"]')).toBeVisible();
    await expect(page.locator('a[href="tel:112"]')).toBeVisible();
    await expect(page.locator('a[href="tel:122"]')).toHaveCount(0); // 공식 확인 전이라 1차 버튼에서 뺌
  });

  test('위치를 허용하면 국가지점번호·전화로 읽을 문장, 문자는 번호(계산값) 먼저·위경도는 아래 참고', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 12 });
    await prepare(page);
    await page.goto('/#/sos'); // 들어오면 바로 위치를 찾는다
    await expect(page.locator('.sos-fix .sheet-np')).toHaveText('다사 5390 5203');
    await expect(page.locator('.sos-fix')).toContainText('오차 약 10m');
    const sms = await page.getByRole('link', { name: /119에 문자 보내기/ }).getAttribute('href');
    expect(sms.startsWith('sms:119?&body=')).toBe(true);
    const body = decodeURIComponent(sms.split('body=')[1]).split(' / ');
    expect(body[1]).toBe('국가지점번호 다사 5390 5203 (휴대폰 계산값)');
    expect(body.at(-1)).toBe('(참고) 위도 37.5665, 경도 126.978');
    await expect(page.locator('.say-text')).toContainText('국가지점번호 다사 오삼구공 오이공삼');
    await expect(page.locator('.sos-calls .call')).toHaveCount(2);
    // 문자(1) → 가족·지인(2) → 전화(3) 순서
    await expect(page.locator('.sos-block h2')).toHaveText([/119에 문자로/, /가족·지인/, /전화로 신고/]);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.evaluate(() => { delete Navigator.prototype.share; });
    await page.getByRole('button', { name: /가족·지인에게 보내기/ }).click();
    await expect(page.locator('.sos-block').nth(1)).toContainText('복사했어요');
    await expect(page.locator('.sos-time')).toContainText('측정');
    expect(await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze().then((r) => r.violations.map((v) => v.id))).toEqual([]);
  });

  test('위치를 허용하지 않아도 전화 버튼은 그대로, 안내가 나온다', async ({ page }) => {
    await prepare(page);
    await page.addInitScript(() => {
      navigator.geolocation.watchPosition = (_ok, fail) => { setTimeout(() => fail({ code: 1 }), 10); return 1; };
      navigator.geolocation.clearWatch = () => {};
    });
    await page.goto('/#/sos');
    await expect(page.getByRole('alert')).toContainText('위치 권한이 꺼져 있어요');
    await expect(page.getByRole('button', { name: '내 위치 찾기' })).toBeVisible(); // 다시 시도
    await expect(page.locator('a[href="tel:119"]')).toBeVisible();
  });


  test('모든 화면 오른쪽 위에 작은 [긴급 신고] → 누르면 바로 내 위치를 찾아 전화·문자', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 37.5665, longitude: 126.978, accuracy: 20 });
    await prepare(page);
    for (const path of ['/#/', '/#/place', '/#/me', '/#/my', '/#/learn', '/#/here']) {
      await page.goto(path);
      await expect(page.locator('header .mini.sos')).toBeVisible();
    }
    await page.locator('header .mini.sos').click();
    await expect(page.locator('.sos h1')).toHaveText('긴급 신고');
    await expect(page.locator('a[href="tel:119"]').first()).toBeVisible();
    await expect(page.locator('.sos-fix')).toContainText('오차 약 20m');
    await expect(page.getByRole('link', { name: /119에 문자 보내기/ })).toHaveAttribute('href', /^sms:119\?&body=/);
  });
});
