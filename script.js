(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  root.classList.add("js");

  function onMediaChange(mql, fn) {
    if (mql.addEventListener) mql.addEventListener("change", fn);
    else if (mql.addListener) mql.addListener(fn);
  }

  /* Theme toggle: follows the system until the visitor picks one.
     Where View Transitions exist, the new theme spreads out in a circle from the button. */
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
  function applyTheme(next) {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncToggle();
  }
  toggle.addEventListener("click", function () {
    var next = currentTheme() === "light" ? "dark" : "light";
    if (!document.startViewTransition || reduceMotion.matches) {
      applyTheme(next);
      return;
    }
    var rect = toggle.getBoundingClientRect();
    var x = rect.left + rect.width / 2;
    var y = rect.top + rect.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var transition = document.startViewTransition(function () { applyTheme(next); });
    transition.ready.then(function () {
      document.documentElement.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
        { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
  });
  onMediaChange(systemLight, syncToggle);
  syncToggle();

  /* Shared "click outside or press Escape to close" handling for the two popovers. */
  var popovers = [];
  function registerPopover(button, panel, open, close, isOpen) {
    popovers.push({ button: button, panel: panel, close: close, isOpen: isOpen });
    button.addEventListener("click", function () { isOpen() ? close() : open(); });
  }
  document.addEventListener("click", function (e) {
    popovers.forEach(function (p) {
      if (p.isOpen() && !p.button.contains(e.target) && !p.panel.contains(e.target)) p.close();
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    popovers.forEach(function (p) {
      if (p.isOpen()) { p.close(); p.button.focus(); }
    });
  });

  /* Phone menu */
  var nav = document.querySelector(".nav");
  var menuBtn = document.querySelector("[data-menu-toggle]");
  var navLinks = document.getElementById("nav-links");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuBtn.querySelector(".ph").className = "ph " + (open ? "ph-x" : "ph-list");
  }
  registerPopover(menuBtn, navLinks,
    function () { setMenu(true); var first = navLinks.querySelector("a"); if (first) first.focus(); },
    function () { setMenu(false); },
    function () { return nav.classList.contains("is-open"); });
  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  /* Accent color picker. The choice is saved and applied before paint in index.html. */
  var accentToggle = document.querySelector("[data-accent-toggle]");
  var accentMenu = document.getElementById("accent-menu");
  var swatches = Array.prototype.slice.call(accentMenu.querySelectorAll(".swatch"));
  var recolorTimer = null;

  function syncSwatches() {
    var current = root.dataset.accent || "green";
    swatches.forEach(function (s) {
      var on = s.dataset.accent === current;
      s.setAttribute("aria-checked", on ? "true" : "false");
      s.tabIndex = on ? 0 : -1;
    });
  }
  function setAccent(name) {
    // Fade colors across the page instead of snapping.
    root.classList.add("recoloring");
    clearTimeout(recolorTimer);
    recolorTimer = setTimeout(function () { root.classList.remove("recoloring"); }, 450);
    root.dataset.accent = name;
    try { localStorage.setItem("accent", name); } catch (e) {}
    syncSwatches();
  }
  function setAccentMenu(open) {
    accentMenu.hidden = !open;
    accentToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) (accentMenu.querySelector('[aria-checked="true"]') || swatches[0]).focus();
  }
  registerPopover(accentToggle, accentMenu,
    function () { setAccentMenu(true); },
    function () { setAccentMenu(false); },
    function () { return !accentMenu.hidden; });
  swatches.forEach(function (s, i) {
    s.addEventListener("click", function () { setAccent(s.dataset.accent); });
    s.addEventListener("keydown", function (e) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      var next = swatches[(i + step + swatches.length) % swatches.length];
      setAccent(next.dataset.accent);
      next.focus();
    });
  });
  syncSwatches();

  /* Hero headline types in character by character, like Minecraft chat. */
  var typeEl = document.querySelector("[data-type]");
  var typeDuration = 0;
  if (typeEl) {
    var count = 0;
    typeEl.setAttribute("aria-label", typeEl.textContent.replace(/\s+/g, " ").trim());
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); count++; return; }
            // Keep each word together so lines only break between words.
            var word = document.createElement("span");
            word.style.whiteSpace = "nowrap";
            word.setAttribute("aria-hidden", "true");
            part.split("").forEach(function (ch) {
              var span = document.createElement("span");
              span.className = "type-char";
              span.style.setProperty("--c", count++);
              span.textContent = ch;
              word.appendChild(span);
            });
            frag.appendChild(word);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(typeEl);
    var cursor = document.createElement("span");
    cursor.className = "type-cursor";
    cursor.setAttribute("aria-hidden", "true");
    typeEl.appendChild(cursor);
    typeDuration = reduceMotion.matches ? 0 : count * 45 + 180;
    cursor.style.setProperty("--td", typeDuration);
  }

  /* The rest of the hero arrives once the headline has typed. */
  document.querySelectorAll(".hero__grid .reveal").forEach(function (el, i) {
    el.style.setProperty("--d", Math.round(typeDuration * 0.6) + i * 90);
  });
  document.querySelectorAll(".code__body").forEach(function (panel) {
    panel.querySelectorAll(".ln").forEach(function (line, i) { line.style.setProperty("--l", i); });
  });
  var code = document.querySelector(".code");
  if (code) code.style.setProperty("--d0", Math.round(typeDuration * 0.6) + 400);
  document.querySelectorAll(".bento .tile").forEach(function (tile, i) { tile.style.setProperty("--t", i); });

  function reveal(el) { el.classList.add("is-in"); }
  var revealEls = document.querySelectorAll(".reveal, .bento");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(reveal);
  }

  /* Code tabs: Skript and Java versions of the same feature. Lines replay on switch. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".code__tab"));
  function selectTab(tab) {
    if (code) code.style.setProperty("--d0", 0);
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

  /* Macro keys: an automatic demo while visible, and live input from
     keyboard, touch, mouse, pen and game controllers. */
  var keysEl = document.querySelector(".keys");
  var keys = Array.prototype.slice.call(document.querySelectorAll(".keys kbd"));
  var keyByName = {};
  keys.forEach(function (k) { keyByName[k.dataset.key] = k; });
  var demoTimer = null, demoIndex = 0, keysVisible = false, idleTimer = null;

  function press(name, down) {
    var k = keyByName[name];
    if (k) k.classList.toggle("is-pressed", down);
  }
  function releaseAll() {
    keys.forEach(function (k) { k.classList.remove("is-pressed"); });
  }
  function stopDemo() {
    clearInterval(demoTimer);
    demoTimer = null;
    releaseAll();
  }
  function startDemo() {
    if (demoTimer || reduceMotion.matches || !keysVisible || !keys.length) return;
    demoTimer = setInterval(function () {
      releaseAll();
      keys[demoIndex++ % keys.length].classList.add("is-pressed");
    }, 420);
  }
  function userInput() {
    // Real input pauses the demo; it resumes after a few quiet seconds.
    if (demoTimer) stopDemo();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(startDemo, 4000);
  }

  if (keysEl) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          keysVisible = entry.isIntersecting;
          keysVisible ? startDemo() : stopDemo();
        });
      }, { threshold: 0.4 }).observe(keysEl);
    }
    onMediaChange(reduceMotion, function () { reduceMotion.matches ? stopDemo() : startDemo(); });

    // Keyboard: F, G, Q, E and Shift. Never steals keys from form fields or shortcuts.
    function keyName(e) {
      if (e.key === "Shift") return "shift";
      var k = (e.key || "").toLowerCase();
      return k.length === 1 && keyByName[k] ? k : null;
    }
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
      var name = keyName(e);
      if (!name) return;
      userInput();
      press(name, true);
    });
    document.addEventListener("keyup", function (e) {
      var name = keyName(e);
      if (name) press(name, false);
    });
    window.addEventListener("blur", releaseAll);

    // Touch, mouse and pen on the caps themselves; mouse side buttons anywhere over the keys.
    keysEl.addEventListener("pointerdown", function (e) {
      var name = null;
      if (e.pointerType === "mouse" && e.button === 3) name = "mouse4";
      else if (e.pointerType === "mouse" && e.button === 4) name = "mouse5";
      else if (e.button === 0) {
        var cap = e.target.closest("kbd");
        if (cap) name = cap.dataset.key;
      }
      if (!name) return;
      userInput();
      press(name, true);
      var release = function () {
        press(name, false);
        keysEl.removeEventListener("pointerup", release);
        keysEl.removeEventListener("pointerleave", release);
        keysEl.removeEventListener("pointercancel", release);
      };
      keysEl.addEventListener("pointerup", release);
      keysEl.addEventListener("pointerleave", release);
      keysEl.addEventListener("pointercancel", release);
    });
    // Stop the mouse back/forward buttons from navigating away while they are used here.
    keysEl.addEventListener("mouseup", function (e) { if (e.button === 3 || e.button === 4) e.preventDefault(); });

    // Game controllers (standard mapping): A, B, X, Y, bumpers and left trigger.
    var padMap = { 0: "q", 1: "e", 2: "f", 3: "g", 4: "mouse4", 5: "mouse5", 6: "shift" };
    var padPrev = {}, padLoop = null;
    function pollPads() {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var any = false;
      for (var p = 0; p < pads.length; p++) {
        var pad = pads[p];
        if (!pad) continue;
        any = true;
        Object.keys(padMap).forEach(function (idx) {
          var b = pad.buttons[idx];
          var down = !!b && (b.pressed || b.value > 0.5);
          var id = p + ":" + idx;
          if (down !== !!padPrev[id]) {
            padPrev[id] = down;
            if (down) userInput();
            press(padMap[idx], down);
          }
        });
      }
      padLoop = any ? requestAnimationFrame(pollPads) : null;
    }
    window.addEventListener("gamepadconnected", function () { if (!padLoop) padLoop = requestAnimationFrame(pollPads); });
  }

  /* Copy Discord username, with a visible fallback if the clipboard is blocked. */
  var copyBtn = document.querySelector("[data-copy]");
  var copyLabel = document.querySelector("[data-copy-label]");
  var copyStatus = document.querySelector("[data-copy-status]");
  var handleEl = document.querySelector("[data-handle]");
  var handle = document.body.dataset.discord || handleEl.textContent.trim();
  handleEl.textContent = handle;
  var resetTimer = null;

  function showCopied() {
    copyBtn.classList.add("is-done");
    copyBtn.querySelector(".ph").className = "ph ph-check";
    copyLabel.textContent = "Copied";
    copyStatus.textContent = "Username copied. Add " + handle + " on Discord and send a message.";
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      copyBtn.classList.remove("is-done");
      copyBtn.querySelector(".ph").className = "ph ph-copy";
      copyLabel.textContent = "Copy Username";
    }, 2200);
  }
  function showFallback() {
    var range = document.createRange();
    range.selectNodeContents(handleEl);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    copyStatus.textContent = "Could not copy automatically. The username is selected: long-press or press Ctrl+C to copy it.";
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
