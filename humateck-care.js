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

  function withPin(pin, payload) {
    return Object.assign({ admin_pin: String(pin || "").trim() }, payload || {});
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
    adminAuth: function (pin) {
      return post(withPin(pin, { action: "admin_auth" }));
    },
    adminCreate: function (pin, fields) {
      return post(withPin(pin, Object.assign({ action: "admin_create" }, fields || {})));
    },
    adminList: function (pin, status) {
      return post(withPin(pin, { action: "admin_list", status: status || "all" }));
    },
    adminGet: function (pin, id) {
      return post(withPin(pin, { action: "admin_get", id: id }));
    },
    adminUpdate: function (pin, id, patch) {
      return post(withPin(pin, Object.assign({ action: "admin_update", id: id }, patch || {})));
    },
    adminEvents: function (pin) {
      return post(withPin(pin, { action: "admin_events" }));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
