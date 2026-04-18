Humateck Popup Integration Demo

포함 내용
1. index_popup_demo.html
   - 외부 API 자동번역 (운영 준비 중) 카드
   - 공지사항 팝업

2. order_popup_demo.html
   - Google OAuth 를 홈페이지에서 직접 처리하지 않고
   - 크롬 확장판 팝업으로 넘기는 주문페이지 시안

3. chrome_extension/
   - oauth_popup.html / css / js
   - manifest.json
   - Google OAuth 팝업 예제 스타터

중요
- order_popup_demo.html 안의 HUMATECK_EXTENSION_BASE_URL 은 실제 확장 프로그램 ID로 교체해야 합니다.
- chrome_extension/manifest.json 안의 oauth2.client_id 도 실제 Google OAuth Client ID 로 교체해야 합니다.

확장 프로그램 테스트
1. chrome://extensions
2. 개발자 모드 켜기
3. 압축해제된 확장 프로그램 로드
4. chrome_extension 폴더 선택
5. 확장 ID 확인
6. order_popup_demo.html 의 HUMATECK_EXTENSION_BASE_URL 수정
