/* Humateck Supabase membership bridge
   Purpose: email-based membership status lookup for global plan flow.
   OAuth is intentionally not used as a membership condition. */
(function(){
  function getClient(){
    if(!window.supabase || !window.HUMATECK_SUPABASE_URL || !window.HUMATECK_SUPABASE_ANON_KEY) return null;
    if(!window.humateckSupabaseClient){
      window.humateckSupabaseClient = window.supabase.createClient(window.HUMATECK_SUPABASE_URL, window.HUMATECK_SUPABASE_ANON_KEY);
    }
    return window.humateckSupabaseClient;
  }
  function cleanEmail(email){ return String(email || "").trim().toLowerCase(); }
  function getCountryLimit(plan){
    if(plan === "free7") return 15;
    if(plan === "monthly30") return 30;
    if(plan === "monthly50") return 50;
    if(plan === "monthly70") return 70;
    if(plan === "monthly83") return 83;
    if(plan === "yearly83") return 83;
    return 0;
  }
  function normalizeRow(row){
    if(!row) return null;
    var plan = row.plan || row.plan_code || "";
    var endsAt = row.ends_at || row.endsAt || "";
    var limit = Number(row.country_limit || row.countryLimit || getCountryLimit(plan) || 0);
    var kind = row.kind || (plan === "free7" ? "free_trial" : "paid");
    var email = cleanEmail(row.email || "");
    if(!plan || !endsAt) return null;
    return { active:true, kind:kind, plan:plan, countryLimit:limit, endsAt:endsAt, email:email };
  }
  function applyPlanToPage(plan, endsAt, email){
    if(!plan) return;
    try{
      if(email) localStorage.setItem("humateckVerifiedEmail", cleanEmail(email));
      localStorage.setItem("humateckActivePlan", plan);
      localStorage.setItem("humateckSubscriberPlan", plan);
      localStorage.setItem("humateckPaymentSubscriptionPlan", plan);
      if(plan === "free7" && endsAt){
        localStorage.setItem("humateckFreeTrialActive", "true");
        localStorage.setItem("humateckFreeTrialEndMs", String(new Date(endsAt).getTime()));
      }
    }catch(e){}
    window.humateckPaymentSubscriptionPlan = plan;
    var hidden = document.getElementById("humateckActivePlanValue");
    if(hidden) hidden.value = plan;
    if(typeof window.humateckRenderFreeTrialExactTime === "function") window.humateckRenderFreeTrialExactTime();
  }
  async function rpcGetMembership(email){
    var client = getClient();
    if(!client) throw new Error("Supabase is not configured.");
    var res = await client.rpc("humateck_get_membership_by_email", { p_email: cleanEmail(email) });
    if(res.error) throw res.error;
    var data = Array.isArray(res.data) ? res.data[0] : res.data;
    return normalizeRow(data);
  }
  async function rpcClaimFreeTrial(email){
    var client = getClient();
    if(!client) throw new Error("Supabase is not configured.");
    var res = await client.rpc("humateck_claim_free_trial", { p_email: cleanEmail(email) });
    if(res.error) throw res.error;
    var data = Array.isArray(res.data) ? res.data[0] : res.data;
    return normalizeRow(data);
  }
  async function verifyEmailMembership(email){
    email = cleanEmail(email);
    if(!email) return { active:false, reason:"Email is empty." };
    var member = await rpcGetMembership(email);
    if(member && member.active){
      applyPlanToPage(member.plan, member.endsAt, email);
      return member;
    }
    return { active:false, reason:"No active membership found.", email:email };
  }
  async function startFreeTrialByEmail(email){
    email = cleanEmail(email);
    if(!email) throw new Error("Email is empty.");
    var current = await verifyEmailMembership(email).catch(function(){ return null; });
    if(current && current.active) return current;
    var member = await rpcClaimFreeTrial(email);
    if(!member || !member.active) throw new Error("Free trial could not be activated.");
    applyPlanToPage("free7", member.endsAt, email);
    return member;
  }
  async function getCurrentMembership(){
    var email = "";
    try{ email = localStorage.getItem("humateckVerifiedEmail") || ""; }catch(e){}
    if(!email) return { active:false, reason:"No verified email is stored." };
    return verifyEmailMembership(email);
  }
  window.humateckVerifyEmailMembership = verifyEmailMembership;
  window.humateckStartFreeTrialByEmail = startFreeTrialByEmail;
  window.humateckGetSubscriberPlanFromSupabase = getCurrentMembership;
  window.humateckGetCurrentMembership = getCurrentMembership;
  document.addEventListener("DOMContentLoaded", function(){ getCurrentMembership().catch(function(){}); });
})();
