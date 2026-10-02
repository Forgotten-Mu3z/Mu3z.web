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

  /* Accent color picker. The choice is saved and applied before paint in index.html. */
  var accentToggle = document.querySelector("[data-accent-toggle]");
  var accentMenu = document.getElementById("accent-menu");
  var swatches = Array.prototype.slice.call(accentMenu.querySelectorAll(".swatch"));

  function syncSwatches() {
    var current = root.dataset.accent || "green";
    swatches.forEach(function (s) {
      s.setAttribute("aria-checked", s.dataset.accent === current ? "true" : "false");
    });
  }
  function setMenu(open) {
    accentMenu.hidden = !open;
    accentToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var checked = accentMenu.querySelector('[aria-checked="true"]') || swatches[0];
      checked.focus();
    }
  }
  accentToggle.addEventListener("click", function () { setMenu(accentMenu.hidden); });
  swatches.forEach(function (s, i) {
    s.addEventListener("click", function () {
      root.dataset.accent = s.dataset.accent;
      try { localStorage.setItem("accent", s.dataset.accent); } catch (e) {}
      syncSwatches();
    });
    s.addEventListener("keydown", function (e) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      swatches[(i + step + swatches.length) % swatches.length].focus();
    });
  });
  document.addEventListener("click", function (e) {
    if (!accentMenu.hidden && !e.target.closest(".accent-picker")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !accentMenu.hidden) {
      setMenu(false);
      accentToggle.focus();
    }
  });
  syncSwatches();

  /* Code tabs: Skript and Java versions of the same feature. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".code__tab"));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (!next) return;
      e.preventDefault();
      selectTab(next);
      next.focus();
    });
  });

  /* Scroll reveal, staggered within each group. */
  document.querySelectorAll(".code__body").forEach(function (panel) {
    panel.querySelectorAll(".ln").forEach(function (line, i) {
      line.style.setProperty("--l", i);
    });
  });
  document.querySelectorAll(".hero__grid").forEach(function (group) {
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
