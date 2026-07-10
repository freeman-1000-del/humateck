(function (global) {
  "use strict";

  var API =
    "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/humateck-inquiry";
  var ANON =
    "sb_publishable_cmn9eVnnvaAjXVJWa6bRQA_qrb1xglQ";

  function headers() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + ANON,
      apikey: ANON,
    };
  }

  async function post(payload) {
    var res = await fetch(API, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    var data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (!res.ok) {
      throw new Error(data.error || "request failed");
    }
    return data;
  }

  global.HUMATECK_INQUIRY = {
    api: API,
    submit: function (fields) {
      return post(Object.assign({ action: "submit" }, fields));
    },
    adminAuth: function (email, adminKey) {
      return post({ action: "admin_auth", email: email, admin_key: adminKey });
    },
    adminList: function (email, adminKey, status) {
      return post({
        action: "admin_list",
        email: email,
        admin_key: adminKey,
        status: status || "all",
      });
    },
    adminUpdate: function (email, adminKey, id, patch) {
      return post(
        Object.assign(
          { action: "admin_update", email: email, admin_key: adminKey, id: id },
          patch || {}
        )
      );
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
