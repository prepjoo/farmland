# 귀땅 FarmLand

오늘의 행운번호와 행운 장소를 보여 주고, 그 이유를 투명하게 설명하는 무료 사이트. 추첨기·룰렛·긁는 카드로 결과를 재미있게 보여 주고, 그림 속 가상 마을(1팜)을 함께 키운다. 회원가입 없이, 넣은 값은 내 브라우저 밖으로 나가지 않는다. 오락용이며 당첨과 관계없다.

- 기획: [`docs/plan.md`](docs/plan.md) · 개발 명세: [`docs/spec.md`](docs/spec.md) · 바뀐 결정: [`docs/changes.md`](docs/changes.md) · 작업 규칙: [`CLAUDE.md`](CLAUDE.md)
- 별땅(`prepjoo/starland`) 소스에서 시작했다. 별땅 시절 문서는 `docs/legacy/`.

## 실행

```bash
npm install
npm run dev      # 미리보기
npm test         # 계산 엔진·자료 테스트
npm run test:e2e # 화면·접근성 테스트 (휴대폰·PC)
npm run build    # 배포용 빌드 (dist/)
node scripts/build-lotto-stores.mjs data/raw/lotto-stores-20260606.csv  # 판매점 자료 다시 만들기
```

## 배포
아직 공개 주소 없음. Vercel에 이 저장소를 연결하면 갈래마다 미리보기 주소가 생긴다. 공개(main 연결)는 출시 관문을 통과하고 기획자가 승인한 뒤에.

## 자료 출처
- 1등 판매점: 공공데이터포털 ‘기획예산처_온라인복권 1등 당첨 판매점 현황 정보_20260606’(이용허락범위 제한 없음). 최근 1년 자동 1등만.
- 행정구역 경계: 통계청 SGIS(공공누리 제1유형) 행정동 경계를 가공한 vuski/admdongkor(CC BY 4.0)를 간략화.
- 지도: © OpenStreetMap 기여자.
- 타로 풀이: 라이더-웨이트-스미스 정방향 전통 의미(A. E. Waite, 1910)를 바탕으로 요약.
- 이 사이트는 복권 운영사와 관계없는 개인 운영 사이트입니다.
