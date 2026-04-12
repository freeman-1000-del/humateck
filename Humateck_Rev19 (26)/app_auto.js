const COUNTRY_GUIDE_LIST = [["ko", "South Korea"], ["en-US", "United States"], ["en-GB", "United Kingdom"], ["es", "Spain"], ["fr", "France"], ["de", "Germany"], ["pt", "Portugal"], ["it", "Italy"], ["ja", "Japan"], ["zh-CN", "China (Simplified)"], ["zh-TW", "China (Traditional)"], ["ar", "Saudi Arabia"], ["hi", "India"], ["ru", "Russia"], ["nl", "Netherlands"], ["pl", "Poland"], ["tr", "Turkey"], ["sv", "Sweden"], ["da", "Denmark"], ["fi", "Finland"], ["cs", "Czech Republic"], ["ro", "Romania"], ["hu", "Hungary"], ["el", "Greece"], ["th", "Thailand"], ["id", "Indonesia"], ["ms", "Malaysia"], ["vi", "Vietnam"], ["uk", "Ukraine"], ["fa", "Iran"], ["af", "South Africa"], ["sq", "Albania"], ["am", "Ethiopia"], ["hy", "Armenia"], ["az", "Azerbaijan"], ["be", "Belarus"], ["bn", "Bangladesh"], ["bs", "Bosnia and Herzegovina"], ["bg", "Bulgaria"], ["hr", "Croatia"], ["et", "Estonia"], ["ka", "Georgia"], ["ht", "Haiti"], ["is", "Iceland"], ["ga", "Ireland"], ["kn", "India (Kannada)"], ["kk", "Kazakhstan"], ["km", "Cambodia"], ["rw", "Rwanda"], ["lv", "Latvia"], ["lt", "Lithuania"], ["mk", "North Macedonia"], ["ml", "India (Malayalam)"], ["mt", "Malta"], ["mr", "India (Marathi)"], ["mn", "Mongolia"], ["my", "Myanmar"], ["ne", "Nepal"], ["pa", "India (Punjabi)"], ["sr", "Serbia"], ["sk", "Slovakia"], ["sw", "Kenya"], ["tl", "Philippines"], ["ta", "India (Tamil)"], ["te", "India (Telugu)"], ["yo", "Nigeria"], ["zu", "South Africa (Zulu)"], ["ca", "Catalonia"], ["gl", "Galicia"], ["eu", "Basque Country"]];
const COUNTRY_GUIDE_LIST_30 = COUNTRY_GUIDE_LIST.slice(0, 30);
const COUNTRY_GUIDE_LIST_50 = COUNTRY_GUIDE_LIST.slice(0, 50);
const COUNTRY_GUIDE_LIST_70 = COUNTRY_GUIDE_LIST.slice(0, 70);

const PLAN_CONFIG = {
  monthly30: { label: "30개국 / 16,500원 / 월", count: 30, targets: COUNTRY_GUIDE_LIST_30 },
  monthly50: { label: "50개국 / 25,000원 / 월", count: 50, targets: COUNTRY_GUIDE_LIST_50 },
  monthly70: { label: "70개국 / 32,500원 / 월", count: 70, targets: COUNTRY_GUIDE_LIST_70 },
  annual70:  { label: "70개국 / 292,500원 / 년", count: 70, targets: COUNTRY_GUIDE_LIST_70 },
};

const API_ENDPOINT = window.AUTO_TRANSLATE_API_ENDPOINT || '/api/openai_translate_auto';

function $(id) { return document.getElementById(id); }
function qp() { return new URLSearchParams(location.search); }
function getPlan() {
  const plan = qp().get('plan') || 'monthly70';
  return PLAN_CONFIG[plan] ? plan : 'monthly70';
}
function getConfig() { return PLAN_CONFIG[getPlan()]; }
function formatTargets(targets) {
  return targets.map((item, idx) => `${idx + 1}. ${item[0]} | ${item[1]}`).join('
');
}
function buildOrderSheet(plan, title, description, videoUrl) {
  const cfg = PLAN_CONFIG[plan];
  const targetsText = formatTargets(cfg.targets);
  return [
    'AUTO 주문서',
    '',
    `Plan: ${plan}`,
    `요청 국가 수: ${cfg.count}개국`,
    '',
    '[요청 국가코드 / 국가명]',
    targetsText,
    '',
    '[원문 제목]',
    title,
    '',
    '[원문 설명문]',
    description,
    '',
    '[유튜브 영상 주소]',
    videoUrl || '(미입력)',
    '',
    '안내: 위 주문내용을 확인하신 후 자동번역 요청 버튼을 눌러 주십시오.'
  ].join('
');
}
function applyPlanInfo() {
  const plan = getPlan();
  const cfg = getConfig();
  if ($('currentPlanName')) $('currentPlanName').textContent = cfg.label;
  if ($('contractDateText')) $('contractDateText').textContent = `선택 플랜: ${cfg.count}개국`;
  if ($('orderPlanText')) $('orderPlanText').textContent = plan;
  if ($('orderCountText')) $('orderCountText').textContent = `${cfg.count}개국`;
  if ($('targetCountText')) $('targetCountText').textContent = `요청 대상: ${cfg.count}개국`;
  if ($('orderTargetsOutput')) $('orderTargetsOutput').value = formatTargets(cfg.targets);
}
function resetOrderSheet() {
  if ($('orderTitleOutput')) $('orderTitleOutput').value = '';
  if ($('orderDescOutput')) $('orderDescOutput').value = '';
  if ($('orderSheetOutput')) $('orderSheetOutput').value = '';
  if ($('finalOutput')) $('finalOutput').value = '';
  if ($('autoStatusText')) $('autoStatusText').textContent = '제출하기를 누르면 플랜에 맞는 AUTO 주문서가 먼저 생성됩니다.';
  if ($('copyOrderBtn')) $('copyOrderBtn').classList.add('hidden');
  if ($('copyFinalBtn')) $('copyFinalBtn').classList.add('hidden');
  if ($('requestAutoBtn')) $('requestAutoBtn').disabled = true;
}
function setStatus(text, cls='') {
  const el = $('autoStatusText');
  if (!el) return;
  el.textContent = text;
  el.className = cls ? cls : 'muted';
}
function getRequestPayload() {
  const plan = getPlan();
  const cfg = getConfig();
  return {
    mode: 'auto',
    plan,
    count: cfg.count,
    videoUrl: ($('videoUrl')?.value || '').trim(),
    title: ($('titleInput')?.value || '').trim(),
    description: ($('descInput')?.value || '').trim(),
    targets: cfg.targets.map(([code, country]) => ({ code, country }))
  };
}

document.addEventListener('DOMContentLoaded', () => {
  applyPlanInfo();
  resetOrderSheet();

  $('upgradeBtn')?.addEventListener('click', () => { location.href = 'plans_auto.html'; });

  $('submitBtn')?.addEventListener('click', () => {
    const payload = getRequestPayload();
    if (!payload.title) { alert('원문 제목을 입력해 주세요.'); return; }
    if (!payload.description) { alert('원문 설명문을 입력해 주세요.'); return; }

    if ($('orderTitleOutput')) $('orderTitleOutput').value = payload.title;
    if ($('orderDescOutput')) $('orderDescOutput').value = payload.description;
    if ($('orderTargetsOutput')) $('orderTargetsOutput').value = formatTargets(payload.targets.map(t => [t.code, t.country]));
    if ($('orderSheetOutput')) $('orderSheetOutput').value = buildOrderSheet(payload.plan, payload.title, payload.description, payload.videoUrl);
    if ($('copyOrderBtn')) $('copyOrderBtn').classList.remove('hidden');
    if ($('requestAutoBtn')) $('requestAutoBtn').disabled = false;
    setStatus('AUTO 주문서가 생성되었습니다. 국가코드 목록과 원문 제목/설명문을 먼저 확인해 주세요.', 'status-good');
  });

  $('resetBtn')?.addEventListener('click', () => {
    ['videoUrl','titleInput','descInput'].forEach(id => { if ($(id)) $(id).value = ''; });
    applyPlanInfo();
    resetOrderSheet();
  });

  $('copyOrderBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('orderSheetOutput')?.value || '');
      setStatus('AUTO 주문서가 복사되었습니다. 주문내용을 다시 확인해 주세요.', 'status-good');
    } catch (e) {
      alert('AUTO 주문서 복사에 실패했습니다.');
    }
  });

  $('copyFinalBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('finalOutput')?.value || '');
      setStatus('최종번역본이 복사되었습니다.', 'status-good');
    } catch (e) {
      alert('최종본 복사에 실패했습니다.');
    }
  });

  $('requestAutoBtn')?.addEventListener('click', async () => {
    const payload = getRequestPayload();
    if (!payload.title || !payload.description) {
      alert('먼저 AUTO 주문서를 생성해 주세요.');
      return;
    }

    $('requestAutoBtn').disabled = true;
    if ($('copyFinalBtn')) $('copyFinalBtn').classList.add('hidden');
    if ($('finalOutput')) $('finalOutput').value = '';
    setStatus('자동번역 요청 중입니다. 잠시만 기다려 주세요.', 'status-warn');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || `자동번역 호출 실패 (${response.status})`);
      }

      const finalText = String(data?.finalText || '').trim();
      if (!finalText) {
        throw new Error('자동번역 결과가 비어 있습니다.');
      }

      if ($('finalOutput')) $('finalOutput').value = finalText;
      if ($('copyFinalBtn')) $('copyFinalBtn').classList.remove('hidden');
      setStatus('자동번역이 완료되었습니다. 최종번역본을 확인해 주세요.', 'status-good');
    } catch (error) {
      setStatus(error?.message || '자동번역 요청 중 오류가 발생했습니다.', 'status-bad');
      if ($('finalOutput')) $('finalOutput').value = '';
      alert(error?.message || '자동번역 요청 중 오류가 발생했습니다.');
    } finally {
      $('requestAutoBtn').disabled = false;
    }
  });
});
