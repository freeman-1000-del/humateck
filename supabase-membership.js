/* Humateck Supabase membership bridge
   Purpose only: email auth + free/paid membership status lookup.
   OAuth is intentionally not used as a membership condition. */
(function(){
  function getClient(){
    if(!window.supabase || !window.HUMATECK_SUPABASE_URL || !window.HUMATECK_SUPABASE_ANON_KEY) return null;
    if(!window.humateckSupabaseClient){
      window.humateckSupabaseClient = window.supabase.createClient(window.HUMATECK_SUPABASE_URL, window.HUMATECK_SUPABASE_ANON_KEY);
    }
    return window.humateckSupabaseClient;
  }

  function toPlanCode(row){
    return row && row.plan_code ? String(row.plan_code) : "";
  }

  function getCountryLimit(plan){
    if(plan === "free7") return 15;
    if(plan === "monthly30") return 30;
    if(plan === "monthly50") return 50;
    if(plan === "monthly70") return 70;
    if(plan === "monthly83") return 83;
    if(plan === "yearly83") return 83;
    return 0;
  }

  function applyPlanToPage(plan, endsAt){
    if(!plan) return;
    try{
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

  async function getSessionUser(){
    var client = getClient();
    if(!client) return null;
    var result = await client.auth.getUser();
    return result && result.data ? result.data.user : null;
  }

  async function getMembership(){
    var client = getClient();
    if(!client) return { active:false, reason:"Supabase is not configured." };
    var user = await getSessionUser();
    if(!user) return { active:false, reason:"Email sign-in is required." };

    var nowIso = new Date().toISOString();

    var paid = await client
      .from("paid_members")
      .select("plan_code, starts_at, ends_at, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending:false })
      .limit(1);

    if(paid && paid.data && paid.data.length){
      var p = toPlanCode(paid.data[0]);
      applyPlanToPage(p, paid.data[0].ends_at);
      return { active:true, kind:"paid", plan:p, countryLimit:getCountryLimit(p), endsAt:paid.data[0].ends_at, email:user.email };
    }

    var trial = await client
      .from("free_trial_members")
      .select("plan_code, starts_at, ends_at, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending:false })
      .limit(1);

    if(trial && trial.data && trial.data.length){
      applyPlanToPage("free7", trial.data[0].ends_at);
      return { active:true, kind:"free_trial", plan:"free7", countryLimit:15, endsAt:trial.data[0].ends_at, email:user.email };
    }

    return { active:false, reason:"No active membership found.", email:user.email };
  }

  async function sendEmailOtp(email){
    var client = getClient();
    if(!client) throw new Error("Supabase is not configured.");
    return client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
  }

  async function startFreeTrial(){
    var client = getClient();
    if(!client) throw new Error("Supabase is not configured.");
    var user = await getSessionUser();
    if(!user) throw new Error("Email sign-in is required first.");

    var now = new Date();
    var end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var payload = {
      user_id: user.id,
      email: user.email,
      plan_code: "free7",
      country_limit: 15,
      status: "active",
      starts_at: now.toISOString(),
      ends_at: end.toISOString()
    };

    var inserted = await client.from("free_trial_members").insert(payload).select().single();
    if(inserted.error) throw inserted.error;
    applyPlanToPage("free7", payload.ends_at);
    return { active:true, kind:"free_trial", plan:"free7", countryLimit:15, endsAt:payload.ends_at, email:user.email };
  }

  window.humateckSendEmailOtp = sendEmailOtp;
  window.humateckStartFreeTrial = startFreeTrial;
  window.humateckGetCurrentMembership = getMembership;
  window.humateckGetSubscriberPlanFromSupabase = getMembership;

  document.addEventListener("DOMContentLoaded", function(){
    getMembership().catch(function(){});
  });
})();
