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
  async function selectActiveByEmail(table, email){
    var client = getClient();
    if(!client) throw new Error("Supabase is not configured.");
    var nowIso = new Date().toISOString();
    var res = await client
      .from(table)
      .select("email, plan_code, country_limit, starts_at, ends_at, status")
      .eq("email", cleanEmail(email))
      .eq("status", "active")
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending:false })
      .limit(1);
    if(res.error) throw res.error;
    return res.data && res.data.length ? res.data[0] : null;
  }
  async function verifyEmailMembership(email){
    email = cleanEmail(email);
    if(!email) return { active:false, reason:"Email is empty." };
    var paid = await selectActiveByEmail("paid_members", email);
    if(paid){
      var plan = paid.plan_code || "monthly30";
      applyPlanToPage(plan, paid.ends_at, email);
      return { active:true, kind:"paid", plan:plan, countryLimit:getCountryLimit(plan) || paid.country_limit || 0, endsAt:paid.ends_at, email:email };
    }
    var trial = await selectActiveByEmail("free_trial_members", email);
    if(trial){
      applyPlanToPage("free7", trial.ends_at, email);
      return { active:true, kind:"free_trial", plan:"free7", countryLimit:15, endsAt:trial.ends_at, email:email };
    }
    return { active:false, reason:"No active membership found.", email:email };
  }
  async function startFreeTrialByEmail(email){
    email = cleanEmail(email);
    if(!email) throw new Error("Email is empty.");
    var client = getClient();
    if(!client) throw new Error("Supabase is not configured.");
    var current = await verifyEmailMembership(email).catch(function(){ return null; });
    if(current && current.active) return current;

    var existing = await client
      .from("free_trial_members")
      .select("email, starts_at, ends_at, status")
      .eq("email", email)
      .limit(1);
    if(existing.error) throw existing.error;
    if(existing.data && existing.data.length){
      throw new Error("This email has already used the 7-Day Free Trial.");
    }
    var now = new Date();
    var end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var payload = {
      email: email,
      plan_code: "free7",
      country_limit: 15,
      status: "active",
      starts_at: now.toISOString(),
      ends_at: end.toISOString()
    };
    var inserted = await client.from("free_trial_members").insert(payload).select().single();
    if(inserted.error) throw inserted.error;
    applyPlanToPage("free7", payload.ends_at, email);
    return { active:true, kind:"free_trial", plan:"free7", countryLimit:15, endsAt:payload.ends_at, email:email };
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
