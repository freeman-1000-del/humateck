
const statusBox = document.getElementById('statusBox');
const oauthStartBtn = document.getElementById('oauthStartBtn');
const closeBtn = document.getElementById('closeBtn');

const params = new URLSearchParams(location.search);
const openerOrigin = params.get('origin') || '*';

function setStatus(text, type = '') {
  statusBox.className = 'status' + (type ? ` ${type}` : '');
  statusBox.textContent = text;
}

oauthStartBtn.addEventListener('click', () => {
  try {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        setStatus(`인증 실패: ${chrome.runtime.lastError.message}`, 'bad');
        return;
      }
      const masked = token ? `${token.slice(0, 8)}...${token.slice(-4)}` : '(토큰 없음)';
      setStatus(`인증 완료. 토큰 수신 성공: ${masked}`, 'ok');

      if (window.opener && openerOrigin) {
        window.opener.postMessage(
          { type: 'HUMATECK_OAUTH_SUCCESS', tokenReceived: true },
          openerOrigin === '*' ? '*' : openerOrigin
        );
      }
    });
  } catch (error) {
    setStatus(`예외 발생: ${error.message}`, 'bad');
  }
});

closeBtn.addEventListener('click', () => {
  window.close();
});
