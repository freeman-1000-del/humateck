Humateck AUTO 루트형 패치

1) 이 파일들은 기존 파일과 섞지 말고 루트에 추가하십시오.
   - order_auto.html
   - app_auto.js
   - api/openai_translate_auto.js

2) 기존 파일은 건드리지 않아도 됩니다.
   - order.html
   - app.js

3) order_auto.html 은 app_auto.js 를 불러옵니다.
   app_auto.js 는 /api/openai_translate_auto 를 호출합니다.

4) Vercel 예외
   OpenAI 호출 파일만 api 폴더 안에 두어야 합니다.
   나머지는 모두 루트에 두면 됩니다.

5) 필요한 환경변수
   - OPENAI_API_KEY
   - 선택: OPENAI_TRANSLATE_MODEL

6) 시험 주소 예시
   - /order_auto.html?subscriber=1&count=70&plan=monthly70&mode=auto
   - /order_auto.html?trial=1&count=30&mock=0&mode=auto
