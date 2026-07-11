/*
 * Material 3 theming — light/dark with persistence, no FOUC, system-aware.
 * Load this in <head> (without defer) so the theme applies before first paint.
 * Toggle any element with [data-md-theme-toggle]; the bar raises on scroll.
 * Vanilla JS, zero dependencies.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "md-theme";

  function systemPrefersDark() {
    return window.matchMedia &&
           window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function currentResolved() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    return systemPrefersDark() ? "dark" : "light";
  }

  // ---- Apply persisted theme ASAP (runs from <head>, before paint) ----
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) { /* storage unavailable; follow system */ }

  // ---- DOM-dependent wiring ----
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else { fn(); }
  }

  ready(function () {
    // Update toggle button state to reflect current theme
    function syncToggles() {
      var resolved = currentResolved();
      document.querySelectorAll("[data-md-theme-toggle]").forEach(function (btn) {
        var toDark = resolved === "light"; // clicking will switch TO this
        btn.setAttribute("aria-pressed", String(resolved === "dark"));
        btn.setAttribute("aria-label", toDark ? "切换到暗色模式" : "切换到亮色模式");
        btn.setAttribute("title", toDark ? "切换到暗色模式" : "切换到亮色模式");
        var sun = btn.querySelector("[data-icon=sun]");
        var moon = btn.querySelector("[data-icon=moon]");
        if (sun && moon) {
          sun.style.display = resolved === "dark" ? "" : "none";
          moon.style.display = resolved === "dark" ? "none" : "";
        }
      });
    }

    // Toggle: set explicit theme opposite to currently resolved
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-md-theme-toggle]");
      if (!btn) return;
      var next = currentResolved() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (err) {}
      syncToggles();
    });

    // Follow system changes only when user hasn't chosen explicitly
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", function () {
          if (!localStorage.getItem(STORAGE_KEY)) syncToggles();
        });
    }

    syncToggles();

    // ---- Top app bar: elevation 0 resting → elevation 2 when content scrolls ----
    var bar = document.querySelector(".md-topbar");
    if (bar) {
      var onScroll = function () {
        bar.classList.toggle("is-raised", (window.scrollY || window.pageYOffset) > 0);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  });
})();
