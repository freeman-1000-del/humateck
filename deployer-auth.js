(function () {
  "use strict";

  var GOOGLE_CLIENT_ID = "__GOOGLE_SIGNIN_CLIENT_ID__";
  var APPLE_CLIENT_ID = "__APPLE_SIGNIN_CLIENT_ID__";
  var MICROSOFT_CLIENT_ID = "__MICROSOFT_SIGNIN_CLIENT_ID__";
  var REGISTER_URL = "__REGISTER_MEMBER_URL__";

  function $(id) {
    return document.getElementById(id);
  }

  function isPlaceholder(value) {
    return !value || value.indexOf("__") === 0;
  }

  function resolveRegisterUrl() {
    if (!isPlaceholder(REGISTER_URL)) return REGISTER_URL;
    return "https://ajvtyotblrtexcxuazqm.supabase.co/functions/v1/register-member";
  }

  function authFetchHeaders() {
    return { "Content-Type": "application/json" };
  }

  function isFreeMemberRegistered() {
    if (window.humateckFreeMemberRegistered === true) return true;
    try {
      return localStorage.getItem("humateckFreeMemberRegistered") === "1";
    } catch (e) {
      return false;
    }
  }

  function setFreeMemberRegistered(value) {
    window.humateckFreeMemberRegistered = value === true;
    try {
      if (value) localStorage.setItem("humateckFreeMemberRegistered", "1");
      else localStorage.removeItem("humateckFreeMemberRegistered");
    } catch (e) {}
  }

  function isInternalEmail(email) {
    return String(email || "").indexOf("@member.humateck") > 0;
  }

  function saveOAuthSub(sub) {
    if (!sub) return;
    try {
      localStorage.setItem("humateckOAuthSub", sub);
    } catch (e) {}
  }

  function getOAuthSub() {
    try {
      return localStorage.getItem("humateckOAuthSub") || "";
    } catch (e) {
      return "";
    }
  }

  function saveMemberLabel(label) {
    try {
      if (label) localStorage.setItem("humateckMemberLabel", label);
    } catch (e) {}
  }

  function getMemberLabel() {
    try {
      return localStorage.getItem("humateckMemberLabel") || "";
    } catch (e) {}
    return "";
  }

  function saveEmail(email) {
    var v = String(email || "")
      .trim()
      .toLowerCase();
    if (!v || isInternalEmail(v)) return;
    try {
      localStorage.setItem("humateckUserEmail", v);
      localStorage.setItem("humateckEmail", v);
    } catch (e) {}
  }

  function getSavedEmail() {
    try {
      return (
        localStorage.getItem("humateckUserEmail") ||
        localStorage.getItem("humateckEmail") ||
        ""
      );
    } catch (e) {
      return "";
    }
  }

  function saveProvider(provider) {
    try {
      if (provider) localStorage.setItem("humateckAuthProvider", provider);
    } catch (e) {}
  }

  function getSavedProvider() {
    try {
      return localStorage.getItem("humateckAuthProvider") || "";
    } catch (e) {}
    return "";
  }

  function parseJwtEmail(credential) {
    try {
      var parts = String(credential || "").split(".");
      if (parts.length < 2) return "";
      var json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      var payload = JSON.parse(json);
      return String(payload.email || payload.preferred_username || "")
        .trim()
        .toLowerCase();
    } catch (e) {
      return "";
    }
  }

  function openSignInModal(mode) {
    var modal = $("humateckSignInModal");
    var title = $("humateckSignInTitle");
    var morePanel = $("humateckMoreOptionsPanel");
    var moreBtn = $("humateckMoreOptionsBtn");
    if (title) title.textContent = "Log in or sign up";
    if (morePanel) morePanel.hidden = true;
    if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");
    if (modal) modal.hidden = false;
    setRegisterStatus("");
    updateAuthModalExtras();
    refreshGoogleSignInButton();
  }

  function refreshGoogleSignInButton() {
    if (isPlaceholder(GOOGLE_CLIENT_ID)) return;
    waitForGoogle(function () {
      var wrap = $("humateckGoogleSignIn");
      if (wrap) wrap.innerHTML = "";
      initGoogleSignIn();
    });
  }

  function closeSignInModal() {
    var modal = $("humateckSignInModal");
    var morePanel = $("humateckMoreOptionsPanel");
    var moreBtn = $("humateckMoreOptionsBtn");
    if (morePanel) morePanel.hidden = true;
    if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");
    if (modal) modal.hidden = true;
    setRegisterStatus("");
  }

  window.humateckOpenSignIn = openSignInModal;

  function hasOAuthProvider() {
    return (
      !isPlaceholder(GOOGLE_CLIENT_ID) ||
      !isPlaceholder(APPLE_CLIENT_ID) ||
      !isPlaceholder(MICROSOFT_CLIENT_ID)
    );
  }

  function refreshOAuthAvailabilityNote() {}

  function updateAuthModalExtras() {
    var msBtn = $("humateckMicrosoftSignInBtn");
    var orSep = $("humateckAuthOrSep");
    var moreBtn = $("humateckMoreOptionsBtn");
    var msOn = msBtn && !isPlaceholder(MICROSOFT_CLIENT_ID);
    if (orSep) orSep.hidden = !msOn;
    if (moreBtn) moreBtn.hidden = !msOn;
  }

  function setRegisterStatus(message, isError) {
    var el = $("humateckRegisterStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "#ff9a9a" : "#7dffb0";
  }

  function providerLabel(provider) {
    if (provider === "google") return "Google";
    if (provider === "apple") return "Apple";
    if (provider === "microsoft") return "Microsoft";
    return "Account";
  }

  function getDisplayIdentity() {
    var contact = getSavedEmail();
    if (contact && !isInternalEmail(contact)) return contact;
    var label = getMemberLabel();
    if (label) return label;
    var p = getSavedProvider();
    if (p) return providerLabel(p) + " account";
    return "Free member";
  }

  function updateAccountUI() {
    window.humateckFreeMemberRegistered = isFreeMemberRegistered();
    var signedIn =
      isFreeMemberRegistered() || !!getOAuthSub();
    var out = $("humateckAccountSignedOut");
    var inn = $("humateckAccountSignedIn");
    var label = $("humateckAccountEmail");
    var badge = $("humateckSubscriptionBadge");

    if (signedIn && inn && out) {
      out.hidden = true;
      inn.hidden = false;
      if (label) label.textContent = getDisplayIdentity();
      closeSignInModal();
    } else if (inn && out) {
      out.hidden = false;
      inn.hidden = true;
    }

    if (badge) {
      if (window.humateckIsAdminMember) {
        badge.textContent = " · Admin";
        badge.style.color = "#ffd95a";
      } else if (window.humateckSubscriptionActive) {
        badge.textContent = " · Paid";
        badge.style.color = "#7dffb0";
      } else if (isFreeMemberRegistered()) {
        badge.textContent = " · Free";
        badge.style.color = "#9fd4ff";
      } else {
        badge.textContent = "";
      }
    }

    document.body.classList.toggle(
      "humateck-is-signed-in",
      signedIn && (isFreeMemberRegistered() || !!getOAuthSub())
    );
  }

  window.humateckUpdateAccountUI = updateAccountUI;

  async function postRegisterMember(body) {
    var url = resolveRegisterUrl();
    var options = {
      method: "POST",
      headers: authFetchHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
      mode: "cors",
    };
    try {
      return await fetch(url, options);
    } catch (err) {
      await new Promise(function (resolve) {
        setTimeout(resolve, 400);
      });
      return await fetch(url, options);
    }
  }

  async function registerFreeMember(options) {
    var body = options || {};
    var res;
    try {
      res = await postRegisterMember(body);
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message
          ? err.message
          : "Connection problem. Please try again."
      );
    }
    var data = await res.json().catch(function () {
      return {};
    });
    if (res.status === 404 || data.code === "NOT_FOUND") {
      throw new Error("Sign-up server not found. Contact support@humateck.com.");
    }
    if (!res.ok || !data.ok) {
      throw new Error((data && (data.error || data.message)) || "Sign-up failed");
    }
    setFreeMemberRegistered(true);
    if (data.oauth_sub) saveOAuthSub(data.oauth_sub);
    if (data.contact_email) saveEmail(data.contact_email);
    else if (data.email && !isInternalEmail(data.email)) saveEmail(data.email);
    if (data.display_name) saveMemberLabel(data.display_name);
    else if (data.provider) saveMemberLabel(providerLabel(data.provider) + " account");
    if (data.provider) saveProvider(data.provider);
    try {
      localStorage.removeItem("humateckSelectedPlan");
    } catch (e) {}
    setRegisterStatus("");
    closeSignInModal();
    updateAccountUI();
    return data;
  }

  window.humateckRegisterFreeMember = registerFreeMember;

  async function afterRegister(refresh) {
    if (refresh && typeof window.refreshHumateckSubscriptionStatus === "function") {
      await window.refreshHumateckSubscriptionStatus();
    }
  }

  async function handleGoogleCredential(response) {
    var credential = response && response.credential;
    var email = parseJwtEmail(credential);
    if (!email) {
      setRegisterStatus("Could not read your Google email.", true);
      return;
    }
    try {
      await registerFreeMember({ provider: "google", credential: credential });
      await afterRegister(true);
    } catch (err) {
      setRegisterStatus(err instanceof Error ? err.message : "Sign-up failed", true);
    }
  }

  function initGoogleSignIn() {
    var btn = $("humateckGoogleSignInBtn");
    var wrap = $("humateckGoogleSignIn");
    if (isPlaceholder(GOOGLE_CLIENT_ID)) {
      if (btn) btn.hidden = true;
      return;
    }
    if (!window.google || !google.accounts || !google.accounts.id) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
    });

    if (wrap && btn) {
      btn.hidden = false;
      google.accounts.id.renderButton(wrap, {
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 400,
      });
    }
    updateAuthModalExtras();
  }

  function initAppleSignIn() {
    var btn = $("humateckAppleSignInBtn");
    if (!btn) return;
    if (isPlaceholder(APPLE_CLIENT_ID)) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;

    function setupApple() {
      if (!window.AppleID || !AppleID.auth) return false;
      AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: window.location.origin + window.location.pathname,
        usePopup: true,
      });
      return true;
    }

    btn.addEventListener("click", function () {
      if (!setupApple()) {
        setRegisterStatus("Apple sign-in is loading. Try again.", true);
        return;
      }
      AppleID.auth
        .signIn()
        .then(function (res) {
          var token =
            res && res.authorization && res.authorization.id_token;
          if (!token) throw new Error("Apple sign-in canceled");
          var email = parseJwtEmail(token);
          if (email) saveEmail(email);
          return registerFreeMember({ provider: "apple", credential: token });
        })
        .then(function () {
          return afterRegister(true);
        })
        .catch(function (err) {
          setRegisterStatus(
            err instanceof Error ? err.message : "Apple sign-up failed",
            true
          );
        });
    });
  }

  function buildMicrosoftAuthUrl() {
    var redirect = window.location.href.split("#")[0];
    var nonce = String(Math.random()).slice(2) + Date.now();
    try {
      sessionStorage.setItem("humateckMsNonce", nonce);
    } catch (e) {}
    var params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      response_type: "id_token",
      redirect_uri: redirect,
      scope: "openid email profile",
      response_mode: "fragment",
      nonce: nonce,
      prompt: "select_account",
    });
    return (
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" +
      params.toString()
    );
  }

  function handleMicrosoftReturn() {
    var hash = window.location.hash || "";
    if (!hash || hash.indexOf("id_token=") < 0) return false;
    var params = new URLSearchParams(hash.replace(/^#/, ""));
    var token = params.get("id_token");
    if (!token) return false;

    history.replaceState({}, "", window.location.pathname + window.location.search);
    var email = parseJwtEmail(token);
    if (email) saveEmail(email);
    void registerFreeMember({ provider: "microsoft", credential: token })
      .then(function () {
        return afterRegister(true);
      })
      .catch(function (err) {
        setRegisterStatus(
          err instanceof Error ? err.message : "Microsoft sign-up failed",
          true
        );
      });
    return true;
  }

  function initMicrosoftSignIn() {
    var btn = $("humateckMicrosoftSignInBtn");
    if (!btn) return;
    if (isPlaceholder(MICROSOFT_CLIENT_ID)) {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    updateAuthModalExtras();
    btn.addEventListener("click", function () {
      window.location.href = buildMicrosoftAuthUrl();
    });
  }

  function waitForGoogle(cb) {
    if (isPlaceholder(GOOGLE_CLIENT_ID)) {
      cb();
      return;
    }
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (window.google && google.accounts && google.accounts.id) {
        clearInterval(timer);
        cb();
      } else if (tries > 80) {
        clearInterval(timer);
        cb();
      }
    }, 100);
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.humateckFreeMemberRegistered = isFreeMemberRegistered();
    if (handleMicrosoftReturn()) {
      updateAccountUI();
    }

    waitForGoogle(initGoogleSignIn);
    initAppleSignIn();
    initMicrosoftSignIn();
    updateAuthModalExtras();

    document.querySelectorAll(".humateckOpenSignInTrigger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.id === "humateckLogInBtn" ? "login" : "signup";
        openSignInModal(mode);
      });
    });

    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("signin") === "1" && !isFreeMemberRegistered()) {
        openSignInModal("signup");
      }
    } catch (e) {}

    var closeBtn = $("humateckCloseSignInBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeSignInModal();
      });
    }

    var modal = $("humateckSignInModal");
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeSignInModal();
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSignInModal();
    });

    var moreBtn = $("humateckMoreOptionsBtn");
    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        var panel = $("humateckMoreOptionsPanel");
        if (!panel) return;
        var open = panel.hidden;
        panel.hidden = !open;
        moreBtn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    var signOut = $("humateckSignOutBtn");
    if (signOut) {
      signOut.addEventListener("click", function () {
        try {
          if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
            google.accounts.id.cancel();
          }
          localStorage.removeItem("humateckUserEmail");
          localStorage.removeItem("humateckEmail");
          localStorage.removeItem("humateckAuthProvider");
          localStorage.removeItem("humateckOAuthSub");
          localStorage.removeItem("humateckMemberLabel");
          localStorage.removeItem("humateckFreeMemberRegistered");
        } catch (e) {}
        window.humateckSubscriptionActive = false;
        setFreeMemberRegistered(false);
        window.humateckIsAdminMember = false;
        closeSignInModal();
        setRegisterStatus("");
        updateAccountUI();
      });
    }

    var saved = getSavedEmail();
    if (saved || getOAuthSub()) {
      updateAccountUI();
      if (typeof window.refreshHumateckSubscriptionStatus === "function") {
        void window.refreshHumateckSubscriptionStatus();
      }
    } else {
      updateAccountUI();
    }
  });
})();
