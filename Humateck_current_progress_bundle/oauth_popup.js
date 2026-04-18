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

var YT_SCOPE='https://www.googleapis.com/auth/youtube';
var params=new URLSearchParams(location.search);
var openerOrigin=params.get('origin')||'*';
var REDIRECT_URI='https://kpjbakonoghmklnnnomgbendjcjiehml.chromiumapp.org/';
var accessToken=null;

function $(id){return document.getElementById(id);}
function $on(id,ev,fn){var el=$(id);if(el)el.addEventListener(ev,fn);}
function setStatus(html,type){var el=$('statusMsg');if(el)el.innerHTML='<div class="status status-'+type+'">'+html+'</div>';}

document.addEventListener('DOMContentLoaded',function(){

  // guide=open 파라미터이면 길잡이 자동 펼침
  if(new URLSearchParams(location.search).get('guide')==='open'){
    var gb=$('guideToggleBtn'); if(gb)gb.classList.add('open');
    var gc=$('guideContent');   if(gc)gc.classList.add('open');
  }

  $on('guideToggleBtn','click',function(){
    var gb=$('guideToggleBtn'); if(gb)gb.classList.toggle('open');
    var gc=$('guideContent');   if(gc)gc.classList.toggle('open');
  });

  $on('linkStep1', 'click',function(){window.open('https://console.cloud.google.com/auth/branding?project=fourth-cedar-489307-b1','_blank');});
  $on('linkStep2', 'click',function(){window.open('https://console.cloud.google.com/auth/branding?project=fourth-cedar-489307-b1','_blank');});
  $on('linkStep7', 'click',function(){window.open('https://console.cloud.google.com/auth/clients?project=fourth-cedar-489307-b1','_blank');});
  $on('linkStep10','click',function(){window.open('https://console.cloud.google.com/apis/library/youtube.googleapis.com?project=fourth-cedar-489307-b1','_blank');});

  $on('btnCopyRedirect','click',function(){
    navigator.clipboard.writeText(REDIRECT_URI).then(function(){
      var btn=$('btnCopyRedirect');
      if(!btn)return;
      var orig=btn.textContent;
      btn.textContent='Copied!';btn.style.background='#27ae60';
      setTimeout(function(){btn.textContent=orig;btn.style.background='';},2000);
    });
  });

  $on('btnAuth','click',function(){
    var clientId=$('oauthClientId');
    if(!clientId||!clientId.value.trim()){setStatus('OAuth Client ID를 입력해 주세요.','err');return;}
    var id=clientId.value.trim();
    setStatus('Google OAuth 인증 창을 열고 있습니다...','info');
    var authUrl='https://accounts.google.com/o/oauth2/v2/auth'
      +'?client_id='+encodeURIComponent(id)
      +'&redirect_uri='+encodeURIComponent(REDIRECT_URI)
      +'&response_type=token'
      +'&scope='+encodeURIComponent(YT_SCOPE)
      +'&prompt=consent&access_type=online';
    chrome.identity.launchWebAuthFlow({url:authUrl,interactive:true},function(redirectUrl){
      if(chrome.runtime.lastError){setStatus('인증 실패: '+chrome.runtime.lastError.message,'err');return;}
      if(!redirectUrl){setStatus('인증이 취소되었습니다.','err');return;}
      var hash=redirectUrl.split('#')[1]||'';
      var token=new URLSearchParams(hash).get('access_token');
      if(!token){setStatus('토큰을 받지 못했습니다.','err');return;}
      accessToken=token;
      if($('oauthClientId'))$('oauthClientId').value=id.substring(0,8)+'****************';
      setStatus('구글 승인을 완료했습니다.<br>아래 &quot;연결된 채널 확인&quot; 버튼을 눌러 최종 확인해 주세요.','ok');
      var cb=$('btnCheckChannel');if(cb)cb.style.display='block';
      try{chrome.runtime.sendMessage({type:'HUMATECK_OAUTH_TOKEN',token:accessToken,channelName:''});}catch(e){}
      if(window.opener){try{window.opener.postMessage({type:'HUMATECK_OAUTH_SUCCESS',tokenReceived:true,token:accessToken}, openerOrigin||'*');}catch(e){}}
    });
  });

  $on('btnCheckChannel','click',function(){
    if(!accessToken){setStatus('먼저 인증을 진행해 주세요.','err');return;}
    fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {headers:{Authorization:'Bearer '+accessToken}})
    .then(function(res){return res.json();})
    .then(function(data){
      var item=data.items&&data.items[0];
      if(!item)throw new Error('채널 정보를 찾지 못했습니다.');
      var channelName=item.snippet.title;
      var channelId=item.id;
      setStatus('구글 승인을 완료했습니다.<br>채널 연결 확인됨 / 채널명: '+channelName+' / ID: '+channelId+'<br>이제 이 창을 닫고 등록을 진행하시면 됩니다.','ok');
      try{chrome.runtime.sendMessage({type:'HUMATECK_OAUTH_TOKEN',token:accessToken,channelName:channelName});}catch(e){}
      if(window.opener){try{window.opener.postMessage({type:'HUMATECK_OAUTH_SUCCESS',tokenReceived:true,token:accessToken,channelName:channelName}, openerOrigin||'*');}catch(e){}}
    }).catch(function(e){setStatus('채널 확인 실패: '+e.message,'err');});
  });

  $on('btnClose','click',function(){window.close();});
});
