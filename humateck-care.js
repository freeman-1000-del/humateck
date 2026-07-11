(function (global) {
  "use strict";

  var API =
    "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/humateck-care";
  var ANON =
    "sb_publishable_cmn9eVnnvaAjXVJWa6bRQA_qrb1xglQ";
  var GOOGLE_CLIENT_ID =
    "26300662380-gnpatoc7ightbshusgebts20femcbgvi.apps.googleusercontent.com";

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

  function withAdmin(credential, pin, payload) {
    return Object.assign(
      {
        google_credential: String(credential || ""),
        admin_pin: String(pin || "").trim(),
      },
      payload || {}
    );
  }

  global.HUMATECK_CARE = {
    api: API,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
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
    adminAuth: function (credential, pin) {
      return post(withAdmin(credential, pin, { action: "admin_auth" }));
    },
    adminChangePin: function (credential, currentPin, newPin) {
      return post(
        withAdmin(credential, currentPin, {
          action: "admin_change_pin",
          current_pin: String(currentPin || "").trim(),
          new_pin: String(newPin || "").trim(),
        })
      );
    },
    adminCreate: function (credential, pin, fields) {
      return post(
        withAdmin(credential, pin, Object.assign({ action: "admin_create" }, fields || {}))
      );
    },
    adminList: function (credential, pin, status) {
      return post(
        withAdmin(credential, pin, {
          action: "admin_list",
          status: status || "all",
        })
      );
    },
    adminGet: function (credential, pin, id) {
      return post(withAdmin(credential, pin, { action: "admin_get", id: id }));
    },
    adminUpdate: function (credential, pin, id, patch) {
      return post(
        withAdmin(credential, pin, Object.assign({ action: "admin_update", id: id }, patch || {}))
      );
    },
    adminEvents: function (credential, pin) {
      return post(withAdmin(credential, pin, { action: "admin_events" }));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
