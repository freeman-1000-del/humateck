AUTO 통합 실험본

넣을 파일
- plans_auto.html
- order_auto.html
- app_auto.js
- api/openai_translate_auto.js

배치 위치
1) 홈페이지 파일들과 같은 위치에
   - plans_auto.html
   - order_auto.html
   - app_auto.js
2) API 함수 프로젝트 또는 같은 프로젝트의 배포 루트에
   - api/openai_translate_auto.js

주의
- app_auto.js는 기본적으로 /api/openai_translate_auto 를 호출합니다.
- API가 별도 프로젝트라면 app_auto.js 상단의 AUTO_TRANSLATE_API_ENDPOINT 값을 별도 도메인으로 바꾸면 됩니다.
- Vercel 환경변수 OPENAI_API_KEY 필요

이번 실험의 흐름
플랜 선택 -> 제목/설명문 입력 -> 제출하기 -> AUTO 주문서 확인 -> 자동번역 요청하기 -> 최종번역본 표시
