/*
============================================================
⚠️ 절대 금지 지침 / 다음 담당자 필독
------------------------------------------------------------
이 시스템은 배송 시스템이다. 번역기, 검수기, 품질판단기, 거부기가 아니다.
사용자 명시 승인 없이는 아래 항목을 절대 추가, 복구, 변경하지 말 것.

[절대 금지]
1) 검수 로직 추가 금지
2) 자체 판단 로직 추가 금지
3) 자체 거부 / 반려 / 차단 / 보류 / 감점 / 제외 로직 추가 금지
4) 형식검사 실패 문구, 번역문 점검 문구, 자체 오류판정 문구 추가 금지
5) 불필요한 오류 표시 로직 추가 금지
6) defaultLanguage 비교 후 1개 빼기 같은 임의 제외 로직 금지
7) 직등록, 외부 번역문 즉시등록, 별도 검수탭 복구 금지
8) 유튜브/구글 응답 순화, 해석, 대체 문구 출력 금지
9) 협의되지 않은 문구, 구조, 위치, 버튼명, 흐름 변경 금지
10) 속도를 죽이는 순차전송, 과도한 검증, 파싱 강화 금지
11) Country Code 개수 기준 표시 원칙 임의 변경 금지
12) "사용자를 위해 고쳤다"는 이유로 구조를 뜯어고치는 행위 금지

[허용 범위]
- 배송에 꼭 필요한 최소 연결
- 크롬 팝업 승인 연결
- 유튜브/구글이 실제로 돌려준 원문 오류 표시
- 사용자가 명시 승인한 수정만 반영

한 줄 원칙:
우리는 배송만 한다. 검수하지 않는다. 자체 판단하지 않는다. 거부하지 않는다. 불필요한 오류를 만들지 않는다.
============================================================
*/

let oauthToken = null;
let oauthChannelName = '';

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'HUMATECK_OAUTH_TOKEN') {
    oauthToken = message.token || '';
    oauthChannelName = message.channelName || '';
    chrome.storage.session.set({
      humateck_oauth_token: oauthToken,
      humateck_oauth_channel_name: oauthChannelName
    }, () => {
      try {
        chrome.runtime.sendMessage({
          type: 'HUMATECK_OAUTH_TOKEN',
          token: oauthToken,
          channelName: oauthChannelName
        }, () => void chrome.runtime.lastError);
      } catch (e) {}
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'HUMATECK_GET_OAUTH_TOKEN') {
    if (oauthToken) {
      sendResponse({ token: oauthToken, channelName: oauthChannelName });
      return true;
    }
    chrome.storage.session.get(['humateck_oauth_token', 'humateck_oauth_channel_name'], (data) => {
      oauthToken = data.humateck_oauth_token || '';
      oauthChannelName = data.humateck_oauth_channel_name || '';
      sendResponse({ token: oauthToken, channelName: oauthChannelName });
    });
    return true;
  }

  return false;
});
