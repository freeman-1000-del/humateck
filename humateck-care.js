(function (global) {
  "use strict";

  var API =
    "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/humateck-care";
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

  global.HUMATECK_CARE = {
    api: API,
    sessionOpen: function (token) {
      return post({ action: "session_open", token: token });
    },
    sessionPing: function (token) {
      return post({ action: "session_ping", token: token });
    },
    stepComplete: function (token, step, note) {
      return post({
        action: "step_complete",
        token: token,
        step: step,
        note: note || "",
      });
    },
    helpRequest: function (token, message) {
      return post({
        action: "help_request",
        token: token,
        message: message || "",
      });
    },
    adminAuth: function (email, adminKey) {
      return post({ action: "admin_auth", email: email, admin_key: adminKey });
    },
    adminCreate: function (email, adminKey, fields) {
      return post(
        Object.assign(
          { action: "admin_create", email: email, admin_key: adminKey },
          fields || {}
        )
      );
    },
    adminList: function (email, adminKey, status) {
      return post({
        action: "admin_list",
        email: email,
        admin_key: adminKey,
        status: status || "all",
      });
    },
    adminGet: function (email, adminKey, id) {
      return post({
        action: "admin_get",
        email: email,
        admin_key: adminKey,
        id: id,
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
    adminEvents: function (email, adminKey) {
      return post({
        action: "admin_events",
        email: email,
        admin_key: adminKey,
      });
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
