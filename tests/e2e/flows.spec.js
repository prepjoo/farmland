import { test, expect } from '@playwright/test';
import { prepare, enterMeaning, chooseCandidate, openLuck, openHappy, getAdvice, drawOnce } from './helpers.js';

const BANNED = ['명당', '예측', '적중', '확률 상승', '보장', '대박', '1위'];

test('메인: 여기·행복·행운 카드 3개와 바로가기, 오른쪽 위 [긴급 신고]·[메뉴]', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/');
  await expect(page.locator('.home-card')).toHaveCount(3);
  await expect(page.locator('.home-pill')).toHaveText(['여기', '행복', '행운']);
  await expect(page.getByRole('navigation', { name: '여기 바로가기' }).getByRole('link')).toHaveText(['여긴 어디?', '우리 어디?']);
  await expect(page.getByRole('navigation', { name: '행복 바로가기' }).getByRole('link')).toHaveText(['행복위치', '행복메시지', '추천장소']);
  await expect(page.getByRole('navigation', { name: '행운 바로가기' }).getByRole('link')).toHaveText(['행운위치', '행운번호', '행운장소']);
  await expect(page.locator('.home-card.happy')).toContainText('타로·주역·점성술');
  await expect(page.locator('header .top-quick > *').first()).toHaveClass(/sos/); // 긴급 신고가 메뉴 앞
  await page.getByRole('button', { name: '메뉴' }).click();
  const menu = page.getByRole('navigation', { name: '전체 메뉴' });
  await expect(menu.getByRole('link')).toHaveText(['처음 화면', '여긴 어디?', '우리 어디?', '행복', '행운', '내 귀땅 마을', '국가지점번호란?']);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});

test('메인 바로가기는 그 칸으로 간다', async ({ page }) => {
  await prepare(page);
  await page.goto('/#/');
  await page.getByRole('link', { name: '행복메시지' }).click();
  await expect(page).toHaveURL(/#\/happy\/message$/);
  await expect(page.locator('#msg-h')).toBeInViewport();
  await page.goto('/#/');
  await page.getByRole('link', { name: '우리 어디?' }).click();
  await expect(page.locator('h1')).toHaveText('우리 어디?');
});

test.describe('동작 줄이기', () => {
  test.use({ reducedMotion: 'reduce' });

  test('행복위치: 입력 방식 3가지, 개인정보 안내, 후보 중 고르기', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/happy');
    await expect(page.locator('.privacy')).toContainText('이 기기 안에서만');
    await expect(page.getByRole('radiogroup', { name: '입력 방식' }).getByRole('radio')).toHaveText(['생년월일', '전화번호', 'MBTI']);
    await enterMeaning(page, { method: 'phone' });
    const n = await page.locator('.cand-list button').count();
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(13);
    await expect(page.locator('.cand-list')).toContainText('57●● ●●88');
    await chooseCandidate(page, 0);
    await expect(page.locator('.chosen-bar')).toContainText('오늘의 행복위치');
  });

  test('생년월일·MBTI로도 후보가 나온다', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/happy');
    await enterMeaning(page, { method: 'date', value: '1962-03-07' });
    await page.reload();
    await enterMeaning(page, { method: 'mbti', value: 'ESTJ' });
    await expect(page.locator('.cand-list')).toContainText('0519 2010');
  });

  test('행복메시지: 타로·주역·점성술 회전판, [조언받기] 전에는 결과가 없다', async ({ page }) => {
    await openHappy(page, { index: 2 });
    await expect(page.getByRole('radiogroup', { name: '행복메시지 종류' }).getByRole('radio')).toHaveText(['타로', '주역', '점성술']);
    const slices = async () => page.locator('.roulette .slice').count();
    await expect(page.locator('.roulette')).toBeVisible();
    expect(await slices()).toBe(22);
    await expect(page.locator('.fortune')).toHaveCount(0);
    await expect(page.locator('.slice.on')).toHaveCount(0);
    await getAdvice(page, '타로');
    await expect(page.locator('.fortune .card-name')).toContainText('타로');
    await expect(page.locator('.slice.on')).toHaveCount(1);
    await page.getByRole('radio', { name: '주역' }).click();
    await expect(page.locator('.fortune')).toHaveCount(0); // 종류를 바꾸면 다시 눌러야
    expect(await slices()).toBe(64);
    await getAdvice(page, '주역');
    await expect(page.locator('.fortune .card-name')).toContainText('괘');
    await page.getByRole('radio', { name: '점성술' }).click();
    expect(await slices()).toBe(12);
    await getAdvice(page, '점성술');
    await expect(page.locator('.fortune .card-name')).toContainText('자리');
    await expect(page.locator('.fortune')).toContainText('놀이용 추첨');
  });

  test('오늘의 국가지점: 조언을 받으면 그곳과 미션이 제목 있는 칸으로 나온다', async ({ page }) => {
    await openHappy(page);
    const place = await page.locator('.chosen-bar strong').innerText();
    await expect(page.locator('.today-np')).toHaveCount(0);
    await getAdvice(page);
    await expect(page.getByRole('heading', { name: '오늘의 국가지점' })).toBeVisible();
    await expect(page.locator('.today-np')).toContainText(place);
    await expect(page.locator('.today-np .mission-note')).toContainText('1팜');
  });

  test('행복은 19세 확인 없이, 고른 곳은 행운과 함께 쓴다', async ({ page }) => {
    await openHappy(page);
    const place = await page.locator('.chosen-bar strong').innerText();
    await page.goto('/#/luck');
    await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
    await expect(page.locator('.chosen-bar strong')).toHaveText(place);
  });

  test('행운번호: [추첨]을 누를 때마다 1게임씩, 최대 5게임, 같은 주에는 같은 번호', async ({ page }) => {
    await openLuck(page, { index: 1 });
    await expect(page.locator('.ball-box .mini-ball')).toHaveCount(45);
    await expect(page.locator('.game-list')).toHaveCount(0);
    await drawOnce(page);
    await expect(page.locator('.game-list > li')).toHaveCount(1);
    const a = await page.locator('.game-list > li').first().locator('.ball').allInnerTexts();
    expect(a).toHaveLength(6);
    expect(a.map(Number)).toEqual([...a.map(Number)].sort((x, y) => x - y));
    for (let i = 2; i <= 5; i++) {
      await page.getByRole('button', { name: /^추첨/ }).click();
      await expect(page.locator('.game-list > li')).toHaveCount(i);
    }
    await expect(page.getByRole('button', { name: '이번 주 5게임을 모두 뽑았어요' })).toBeDisabled();
    const all = await page.locator('.game-list > li').evaluateAll((lis) => lis.map((li) => li.innerText));
    expect(new Set(all).size).toBe(5);
    await expect(page.getByText('모든 번호 조합의 1등 확률은 같습니다').first()).toBeVisible();
    // 다시 찾아도 같은 번호
    await page.getByRole('button', { name: '다시 찾기' }).click();
    await page.getByRole('radio', { name: '의미 있는 숫자로' }).click();
    await enterMeaning(page, { button: '위치찾기' });
    await chooseCandidate(page, 1);
    await drawOnce(page);
    await expect(page.locator('.game-list > li').first().locator('.ball')).toHaveText(a);
  });

  test('행운장소: [행운장소]를 누르면 판매점 3곳, [출발]은 행운위치에서 거리·길찾기', async ({ page }) => {
    await openLuck(page);
    await expect(page.locator('.near-list')).toHaveCount(0);
    await page.getByRole('button', { name: '행운장소', exact: true }).click();
    await expect(page.locator('.near-list li')).toHaveCount(3);
    await expect(page.locator('.near-list')).toContainText('최근 1년 자동 1등');
    await page.getByRole('button', { name: '출발' }).first().click();
    const box = page.locator('.start-box');
    await expect(box).toContainText('행운위치에서');
    await expect(box).toContainText('행운위치의 좌표');
    expect(await box.locator('a').getAttribute('href')).toMatch(/^https:\/\/map\.kakao\.com\/link\/from\/[^/]+,\d+\.\d{6},\d+\.\d{6}\/to\/[^/]+,\d+\.\d{6},\d+\.\d{6}$/);
    await expect(page.locator('.near-list .route-link').first()).toHaveText('카카오맵에서 찾기');
  });

  test('19세 미만이면 행운번호·장소가 보이지 않는다', async ({ page }) => {
    await prepare(page);
    await page.goto('/#/luck');
    await page.getByRole('button', { name: '아니요' }).click();
    await expect(page.locator('main')).toContainText('만 19세 이상만');
    await expect(page.locator('.ball, .mini-ball')).toHaveCount(0);
  });

  test('판매점 자료를 못 불러오면 지어내지 않는다', async ({ page }) => {
    await page.route(/lotto-stores\.json/, (r) => r.abort());
    await openLuck(page);
    await expect(page.locator('main')).toContainText('자료 준비 중');
  });

  test('금지 표현이 화면에 없다', async ({ page }) => {
    await openLuck(page);
    await drawOnce(page);
    await page.getByRole('button', { name: '바로 보기' }).click();
    await expect(page.locator('.reasons')).toContainText('8,145,060분의 1');
    for (const path of ['/#/', '/#/happy', '/#/luck', '/#/meet', '/#/my']) {
      await page.goto(path);
      await page.waitForTimeout(300);
      const text = await page.locator('main').innerText();
      for (const w of BANNED) expect(text, `${path}에 '${w}'`).not.toContain(w);
    }
  });
});

test('연출: 회전판은 [조언받기]를 눌러야 돌고, 추첨기는 건너뛸 수 있다', async ({ page }) => {
  await openHappy(page);
  await page.getByRole('button', { name: '조언받기' }).click();
  await expect(page.getByRole('button', { name: '도는 중…' })).toBeVisible();
  await expect(page.locator('.fortune')).toBeVisible({ timeout: 8000 });
  await page.goto('/#/luck');
  await page.getByRole('button', { name: '네, 만 19세 이상이에요' }).click();
  await page.getByRole('button', { name: /^추첨/ }).click();
  await expect(page.locator('canvas.drum')).toBeVisible();
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await expect(page.locator('.game-list > li')).toHaveCount(1);
});
