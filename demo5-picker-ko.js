/* Copied from deployer/index.html Custom 50-country picker — demo attach only (max 5, 30-day) */
(function () {
  var MAX = 5;
  var HUMATECK_DEMO5_VALID_UNTIL = new Date("2026-08-12T23:59:59+09:00").getTime();

  function $(id) {
    return document.getElementById(id);
  }

  function demo5IsValid() {
    return Date.now() <= HUMATECK_DEMO5_VALID_UNTIL;
  }

  function demo5ExpiredMsg() {
    return "데모 국가 선택기 유효기간(30일)이 만료되었습니다. support@humateck.com 으로 문의해 주세요.";
  }

  function catalogLines() {
    var out = [];
    document.querySelectorAll("#nativeCodeModal .nativeCodeItem").forEach(function (item) {
      var code = item.querySelector("[data-native-code]");
      var textEl = item.querySelector(".nativeCodeText");
      if (!code || !textEl) return;
      out.push({
        code: code.getAttribute("data-native-code"),
        line: textEl.textContent.replace(/\s+/g, " ").trim(),
      });
    });
    return out;
  }

  function getSavedCodes() {
    try {
      var raw = localStorage.getItem("humateckCustom50Selection");
      if (!raw) return {};
      var arr = JSON.parse(raw);
      var map = {};
      if (Array.isArray(arr)) {
        arr.forEach(function (line) {
          var m = String(line).match(/([a-z]{2,3}(?:-[A-Za-z0-9]+)?)\s*\|/i);
          if (m) map[m[1]] = true;
        });
      }
      return map;
    } catch (e) {
      return {};
    }
  }

  function updateModalCount() {
    var grid = $("demo5Grid");
    var n = grid ? grid.querySelectorAll(".nativeCodeItem.selected").length : 0;
    var note = $("demo5ModalCount");
    if (note) note.textContent = n + " / 5개 선택";
    var rowNote = $("custom50CountNote");
    if (rowNote) rowNote.textContent = n + " / 5개 선택";
  }

  function setItemSelected(item, btn, on) {
    item.classList.toggle("selected", on);
    if (btn) {
      btn.textContent = on ? "선택됨" : "선택";
      btn.classList.toggle("is-selected", on);
    }
  }

  function buildGrid() {
    var grid = $("demo5Grid");
    if (!grid) return;
    var saved = getSavedCodes();
    grid.innerHTML = "";
    catalogLines().forEach(function (entry) {
      var item = document.createElement("div");
      item.className = "nativeCodeItem" + (saved[entry.code] ? " selected" : "");
      item.dataset.code = entry.code;
      var textDiv = document.createElement("div");
      textDiv.className = "nativeCodeText";
      var parts = entry.line.split("|");
      var codePart = parts[0].trim();
      var namePart = parts.slice(1).join("|").trim();
      textDiv.innerHTML = namePart
        ? "<strong>" + codePart + "</strong> | " + namePart
        : "<strong>" + codePart + "</strong>";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = saved[entry.code] ? "선택됨" : "선택";
      if (saved[entry.code]) btn.classList.add("is-selected");
      btn.addEventListener("click", function () {
        if (entry.code === "ko") {
          alert("데모에서는 한국(ko)을 선택할 수 없습니다.");
          return;
        }
        var isOn = item.classList.contains("selected");
        if (!isOn && grid.querySelectorAll(".nativeCodeItem.selected").length >= MAX) {
          alert("데모에서는 국가를 5개까지 선택할 수 있습니다.");
          return;
        }
        setItemSelected(item, btn, !isOn);
        updateModalCount();
      });
      item.appendChild(textDiv);
      item.appendChild(btn);
      grid.appendChild(item);
    });
    updateModalCount();
  }

  function openModal() {
    if (!demo5IsValid()) {
      alert(demo5ExpiredMsg());
      return;
    }
    buildGrid();
    var modal = $("demo5Modal");
    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function closeModal() {
    var modal = $("demo5Modal");
    if (modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  }

  function saveSelection() {
    if (!demo5IsValid()) {
      alert(demo5ExpiredMsg());
      return;
    }
    var grid = $("demo5Grid");
    if (!grid) return;
    var lines = [];
    grid.querySelectorAll(".nativeCodeItem.selected").forEach(function (item, idx) {
      var textEl = item.querySelector(".nativeCodeText");
      var body = textEl
        ? textEl.textContent.replace(/\s+/g, " ").trim()
        : item.dataset.code;
      lines.push(idx + 1 + ". " + body);
    });
    if (!lines.length) {
      alert("최소 1개국 이상 선택해 주세요.");
      return;
    }
    if (typeof window.saveCustom50Selection === "function") {
      window.saveCustom50Selection(lines);
    } else {
      try {
        localStorage.setItem("humateckCustom50Selection", JSON.stringify(lines));
      } catch (e) {}
    }
    if (typeof window.applyHumateckPlanFromUI === "function") {
      window.applyHumateckPlanFromUI("custom50");
    }
    if (typeof window.updateCustom50CountNote === "function") {
      window.updateCustom50CountNote();
    }
    updateModalCount();
    closeModal();
  }

  window.openCustom50Picker = openModal;

  document.addEventListener(
    "click",
    function (e) {
      if (e.target.closest("#openCustom50PickerBtn")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openModal();
        return;
      }
      if (e.target.closest("#closeDemo5ModalBtn")) {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.target.closest("#saveDemo5Btn")) {
        e.preventDefault();
        saveSelection();
        return;
      }
      if (e.target.closest("#clearDemo5Btn")) {
        e.preventDefault();
        document.querySelectorAll("#demo5Grid .nativeCodeItem.selected").forEach(function (item) {
          setItemSelected(item, item.querySelector("button"), false);
        });
        updateModalCount();
        return;
      }
      if (e.target.closest("#demo5Modal") && e.target.id === "demo5Modal") closeModal();
    },
    true
  );

  function patchDemoPlan() {
    var old50 = document.getElementById("custom50Modal");
    if (old50) old50.style.display = "none";

    var options = document.querySelectorAll(".planOption");
    if (!options.length) return;

    options.forEach(function (el) {
      if (el.getAttribute("data-subscription-plan") !== "custom50") {
        el.style.opacity = "0.38";
        el.style.pointerEvents = "none";
      }
    });

    var custom = document.querySelector('.planOption[data-subscription-plan="custom50"]');
    var pickRow = document.getElementById("custom50PickRow");
    var pickBtn = document.getElementById("openCustom50PickerBtn");

    if (pickRow) pickRow.hidden = false;

    if (!demo5IsValid()) {
      if (pickBtn) {
        pickBtn.disabled = true;
        pickBtn.textContent = "데모 만료 (30일 유효기간 종료)";
      }
      return;
    }

    if (pickBtn) {
      pickBtn.disabled = false;
      pickBtn.textContent = "국가 직접 선택 (데모 · 최대 5개, 한국 제외)";
    }

    if (custom && !custom.classList.contains("selectedOption")) {
      custom.click();
    }

    updateModalCount();
  }

  patchDemoPlan();
  setTimeout(patchDemoPlan, 400);
  setTimeout(patchDemoPlan, 1200);
})();
