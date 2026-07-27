/* Final translation download helpers: txt / word / pdf / hwp(rtf-compatible). */
(function (global) {
  function $(id) {
    return document.getElementById(id);
  }

  function stampName(ext) {
    var stamp = new Date();
    function pad(n) {
      return String(n).padStart(2, "0");
    }
    return (
      "gemini-translation-" +
      stamp.getFullYear() +
      pad(stamp.getMonth() + 1) +
      pad(stamp.getDate()) +
      "-" +
      pad(stamp.getHours()) +
      pad(stamp.getMinutes()) +
      pad(stamp.getSeconds()) +
      "." +
      ext
    );
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toRtf(text) {
    var out =
      "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset129 Malgun Gothic;}}\\f0\\fs24 ";
    var s = String(text || "");
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var code = s.charCodeAt(i);
      if (ch === "\r") continue;
      if (ch === "\n") {
        out += "\\par ";
        continue;
      }
      if (ch === "\\") {
        out += "\\\\";
        continue;
      }
      if (ch === "{") {
        out += "\\{";
        continue;
      }
      if (ch === "}") {
        out += "\\}";
        continue;
      }
      if (code < 128) {
        out += ch;
      } else {
        out += "\\u" + code + "?";
      }
    }
    return out + "}";
  }

  function saveTxt(text) {
    downloadBlob(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
      stampName("txt")
    );
  }

  function saveWord(text) {
    var html =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Gemini Translation</title></head>" +
      "<body><pre style=\"font-family:'Malgun Gothic',Arial,sans-serif;white-space:pre-wrap;line-height:1.6\">" +
      escapeHtml(text) +
      "</pre></body></html>";
    downloadBlob(
      new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" }),
      stampName("doc")
    );
  }

  function saveHwp(text) {
    /* Hangul opens RTF well; .hwp extension requested for Korean UI. */
    downloadBlob(
      new Blob([toRtf(text)], { type: "application/x-hwp" }),
      stampName("hwp")
    );
  }

  function savePdf(text, msgs) {
    var w = window.open("", "_blank");
    if (!w) {
      alert((msgs && msgs.popupBlocked) || "Please allow pop-ups to save PDF.");
      return;
    }
    w.document.open();
    w.document.write(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Gemini Translation PDF</title>" +
        "<style>body{margin:0;padding:28px;background:#fff;color:#111;" +
        "font-family:'Malgun Gothic','Noto Sans KR',Arial,sans-serif;" +
        "white-space:pre-wrap;line-height:1.7;font-size:14px}</style></head><body>" +
        escapeHtml(text) +
        "</body></html>"
    );
    w.document.close();
    w.focus();
    setTimeout(function () {
      try {
        w.print();
      } catch (err) {}
    }, 350);
  }

  global.saveFinalTranslationFormat = function (format, options) {
    options = options || {};
    var text = String(($("finalOutput") && $("finalOutput").value) || "");
    if (!text.trim()) {
      alert(options.emptyMsg || "There is no final translation result to save.");
      return;
    }
    if (format === "txt") saveTxt(text);
    else if (format === "word") saveWord(text);
    else if (format === "hwp") saveHwp(text);
    else if (format === "pdf") savePdf(text, options);
    else alert(options.unknownMsg || "Unknown format.");
  };
})(window);
