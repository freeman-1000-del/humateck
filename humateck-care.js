(function (global) {
  "use strict";

  var API =
    "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/humateck-care";
  var ANON =
    "sb_publishable_cmn9eVnnvaAjXVJWa6bRQA_qrb1xglQ";
  var GOOGLE_CLIENT_ID =
    "26300662380-gnpatoc7ightbshusgebts20femcbgvi.apps.googleusercontent.com";
  var GEMINI_URL = "https://gemini.google.com/app";

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
      var err = new Error(data.message || data.error || "request failed");
      err.code = data.error || "";
      if (data.session) err.session = data.session;
      if (data.install) err.install = data.install;
      throw err;
    }
    return data;
  }

  function withAdmin(credential, payload) {
    return Object.assign(
      { google_credential: String(credential || "") },
      payload || {}
    );
  }

  global.HUMATECK_CARE = {
    api: API,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
    GEMINI_URL: GEMINI_URL,
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
    installOpen: function (token) {
      return post({ action: "install_open", token: token });
    },
    installDownload: function (token) {
      return post({ action: "install_download", token: token });
    },
    adminAuth: function (credential) {
      return post(withAdmin(credential, { action: "admin_auth" }));
    },
    adminCreate: function (credential, fields) {
      return post(
        withAdmin(credential, Object.assign({ action: "admin_create" }, fields || {}))
      );
    },
    adminList: function (credential, status, channel) {
      return post(
        withAdmin(credential, {
          action: "admin_list",
          status: status || "all",
          channel: channel || "all",
        })
      );
    },
    adminGet: function (credential, id) {
      return post(withAdmin(credential, { action: "admin_get", id: id }));
    },
    adminUpdate: function (credential, id, patch) {
      return post(
        withAdmin(credential, Object.assign({ action: "admin_update", id: id }, patch || {}))
      );
    },
    adminEvents: function (credential) {
      return post(withAdmin(credential, { action: "admin_events" }));
    },
    adminListMembers: function (credential) {
      return post(withAdmin(credential, { action: "admin_list_members" }));
    },
    adminAddMember: function (credential, newEmail, label) {
      return post(
        withAdmin(credential, {
          action: "admin_add_member",
          new_email: String(newEmail || "").trim().toLowerCase(),
          label: label || "",
        })
      );
    },
    adminRemoveMember: function (credential, memberId) {
      return post(
        withAdmin(credential, {
          action: "admin_remove_member",
          member_id: memberId,
        })
      );
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
