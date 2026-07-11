/*
 * Material 3 bounded ripple + spring press feedback.
 * Vanilla JS, zero dependencies. Applies to elements with [data-md-ripple].
 * The ripple uses the element's content color (currentColor) at the M3 pressed
 * state-layer opacity (~12%), bounded by the element's border-radius.
 */
(function () {
  "use strict";

  var SELECTOR = "[data-md-ripple]";
  var PRESSED_OPACITY = 0.12;      // M3 pressed state layer
  var DURATION = 600;              // ms, emphasized easing

  function prefersReducedMotion() {
    return window.matchMedia &&
           window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function ensureHost(el) {
    // ripple container must clip to the element shape
    var cs = getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    if (cs.overflow !== "hidden" &&
        cs.overflowX !== "hidden" &&
        cs.overflowY !== "hidden") {
      el.style.overflow = "hidden";
    }
  }

  function spawn(el, x, y) {
    if (prefersReducedMotion()) return;
    ensureHost(el);

    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height) * 2;
    var left = (x - rect.left) - size / 2;
    var top  = (y - rect.top)  - size / 2;

    var span = document.createElement("span");
    span.setAttribute("aria-hidden", "true");
    span.className = "md-ripple";
    span.style.cssText =
      "position:absolute;border-radius:9999px;pointer-events:none;" +
      "left:" + left + "px;top:" + top + "px;width:" + size + "px;height:" + size + "px;" +
      "background:currentColor;opacity:0;transform:scale(0.3);" +
      "transition:transform " + DURATION + "ms cubic-bezier(0.2,0,0,1)," +
      "opacity " + DURATION + "ms cubic-bezier(0.2,0,0,1);z-index:0;";

    // sit behind content but above the fill; content should be above ripple
    el.appendChild(span);

    // force reflow then animate in (pressed state)
    span.getBoundingClientRect();
    span.style.opacity = String(PRESSED_OPACITY);
    span.style.transform = "scale(1)";

    var release = function () {
      span.style.opacity = "0";
      window.setTimeout(function () {
        if (span.parentNode) span.parentNode.removeChild(span);
      }, DURATION);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("pointercancel", release);
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointerleave", release);
    el.addEventListener("pointercancel", release);
  }

  function isInteractive(el) {
    return el.closest("a,button,[role=button]");
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.button !== undefined && e.button !== 0) return; // primary button only
    var host = e.target.closest(SELECTOR);
    if (!host) return;
    spawn(host, e.clientX, e.clientY);
  }, { passive: true });

  // keep content above ripple for elements that opt-in via data-md-ripple
  // (handled by raising z-index of direct children)
  function raiseContent(host) {
    Array.prototype.forEach.call(host.children, function (child) {
      if (child.classList && child.classList.contains("md-ripple")) return;
      if (child.style.position === "absolute") return;
      var cs = getComputedStyle(child);
      if (cs.zIndex === "auto" || cs.zIndex === "0") child.style.zIndex = "1";
    });
  }

  // promote content z-index once per host
  document.querySelectorAll(SELECTOR).forEach(raiseContent);
})();
