import { expect } from '@playwright/test';
// 화면 테스트 공통 도구
export const FIXED_TIME = new Date('2026-10-12T05:00:00Z'); // 한국 시간 14시

/** 지도 그림(외부 서버)은 테스트에서 막고, 시간을 고정한다 */
export async function prepare(page) {
  await page.route(/tile\.openstreetmap\.org/, (r) => r.abort());
  await page.clock.setFixedTime(FIXED_TIME);
}

export async function openHome(page) {
  await prepare(page);
  await page.goto('/#/');
  await page.waitForSelector('.menu-grid');
}

/** 년·월·일 고르기 ('1962-03-07') */
export async function pickDate(page, date) {
  const [y, m, d] = date.split('-').map(Number);
  await page.getByLabel('날짜 연대').selectOption(String(Math.floor(y / 10) * 10));
  await page.getByLabel('날짜 년').selectOption(String(y));
  await page.getByLabel('날짜 월').selectOption(String(m));
  await page.getByLabel('날짜 일').selectOption(String(d));
}

/** 1단계에서 날짜를 넣고 후보 화면까지. couple: [MBTI, MBTI]면 MBTI 별땅(날짜 없음), flow: 'mine'(기본)·'us' */
export async function findByDate(page, date, { couple, flow = 'mine' } = {}) {
  await prepare(page);
  const f = couple ? 'mbti' : flow;
  await page.goto(`/#/${f}/1`);
  await page.reload(); // 앞 화면에서 고른 내용이 남지 않게 새로 연다
  if (couple) {
    await page.locator('.mbti-box select').nth(0).selectOption(couple[0]);
    await page.locator('.mbti-box select').nth(1).selectOption(couple[1]);
  }
  if (!couple) await pickDate(page, date);
  await page.getByRole('button', { name: couple ? '추천 별 받기' : '후보 별 보기' }).click();
  await page.waitForSelector('.cand-list');
}

/** 후보 n번째(0부터)를 골라 내 별땅 화면까지 */
export async function chooseCandidate(page, n, reason = '') {
  await page.locator('.cand-list button').nth(n).click();
  if (reason) await page.getByLabel(/고른 이유/).fill(reason);
  await page.locator('.submit-bar .primary').click();
  await page.waitForSelector('.land-hero');
  await expect(page.locator('.land-card').first()).toBeVisible();
}
