(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  root.classList.add("js");

  /* Theme toggle: follows the system until the visitor picks one. */
  var toggle = document.querySelector("[data-theme-toggle]");
  var systemLight = window.matchMedia("(prefers-color-scheme: light)");

  function currentTheme() {
    return root.dataset.theme || (systemLight.matches ? "light" : "dark");
  }
  function syncToggle() {
    var icon = toggle.querySelector(".ph");
    var isLight = currentTheme() === "light";
    icon.className = "ph " + (isLight ? "ph-moon" : "ph-sun");
    toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  }
  toggle.addEventListener("click", function () {
    var next = currentTheme() === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncToggle();
  });
  systemLight.addEventListener("change", syncToggle);
  syncToggle();

  /* Scroll reveal, staggered within each group. */
  document.querySelectorAll(".code .ln").forEach(function (line, i) {
    line.style.setProperty("--l", i);
  });
  document.querySelectorAll(".hero__copy, .bento, .skills__groups, .macros__grid, .contact__inner").forEach(function (group) {
    group.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.setProperty("--i", i);
    });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Key caps press in order while visible, like a macro firing. */
  var keys = Array.prototype.slice.call(document.querySelectorAll(".keys kbd"));
  var keyTimer = null;
  var keyIndex = 0;

  function stepKeys() {
    keys.forEach(function (k) { k.classList.remove("is-pressed"); });
    keys[keyIndex % keys.length].classList.add("is-pressed");
    keyIndex++;
  }
  function startKeys() {
    if (keyTimer || reduceMotion.matches || !keys.length) return;
    keyTimer = setInterval(stepKeys, 420);
  }
  function stopKeys() {
    clearInterval(keyTimer);
    keyTimer = null;
    keys.forEach(function (k) { k.classList.remove("is-pressed"); });
  }
  if ("IntersectionObserver" in window && keys.length) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) startKeys(); else stopKeys();
      });
    }, { threshold: 0.4 }).observe(document.querySelector(".keys"));
  }
  reduceMotion.addEventListener("change", function () {
    if (reduceMotion.matches) stopKeys();
  });

  /* Copy Discord username, with a visible fallback if the clipboard is blocked. */
  var copyBtn = document.querySelector("[data-copy]");
  var copyLabel = document.querySelector("[data-copy-label]");
  var copyStatus = document.querySelector("[data-copy-status]");
  var handleEl = document.querySelector("[data-handle]");
  var handle = document.body.dataset.discord || handleEl.textContent.trim();
  handleEl.textContent = handle;
  var resetTimer = null;

  function showCopied() {
    copyBtn.querySelector(".ph").className = "ph ph-check";
    copyLabel.textContent = "Copied";
    copyStatus.textContent = "Username copied. Add me on Discord and send a message.";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      copyBtn.querySelector(".ph").className = "ph ph-copy";
      copyLabel.textContent = "Copy username";
    }, 2200);
  }
  function showFallback() {
    var range = document.createRange();
    range.selectNodeContents(handleEl);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    copyStatus.textContent = "Could not copy automatically. The username is selected, press Ctrl+C to copy it.";
  }

  copyBtn.addEventListener("click", function () {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(handle).then(showCopied, showFallback);
    } else {
      showFallback();
    }
  });

  var year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
