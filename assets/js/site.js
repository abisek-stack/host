/* Abhishek Dhimal — portfolio behaviour. No dependencies; everything degrades
   gracefully: without this script the page is fully readable and navigable. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme ---------- */
  var THEME_COLORS = { light: "#F3EFE6", dark: "#12110E" };
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set === "light" || set === "dark") return set;
    return systemDark.matches ? "dark" : "light";
  }

  function syncThemeUI() {
    var theme = currentTheme();
    var toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    // Once the visitor picks a theme, the browser chrome should follow it.
    if (root.hasAttribute("data-theme")) {
      document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
        m.setAttribute("content", THEME_COLORS[theme]);
      });
    }
  }

  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncThemeUI();
    });
  }
  syncThemeUI();
  if (systemDark.addEventListener) systemDark.addEventListener("change", syncThemeUI);

  /* ---------- Header state ---------- */
  var header = document.getElementById("siteHeader");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuButton = document.getElementById("menuButton");
  var menu = document.getElementById("mobileMenu");
  var menuLabel = menuButton && menuButton.querySelector(".menu-button-label");
  var outside = [document.getElementById("main"), document.querySelector(".site-footer")];
  var lastFocus = null;

  function setOutsideInert(on) {
    outside.forEach(function (el) {
      if (!el) return;
      if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert");
    });
  }

  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    root.classList.add("menu-open");
    document.body.style.overflow = "hidden";
    menuButton.setAttribute("aria-expanded", "true");
    if (menuLabel) menuLabel.textContent = "Close";
    setOutsideInert(true);
    requestAnimationFrame(function () {
      menu.classList.add("is-open");
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    });
  }

  function closeMenu(restoreFocus) {
    if (menu.hidden) return;
    menu.classList.remove("is-open");
    root.classList.remove("menu-open");
    document.body.style.overflow = "";
    menuButton.setAttribute("aria-expanded", "false");
    if (menuLabel) menuLabel.textContent = "Menu";
    setOutsideInert(false);
    var finish = function () { menu.hidden = true; };
    if (reduceMotion.matches) finish(); else setTimeout(finish, 320);
    if (restoreFocus && lastFocus) lastFocus.focus({ preventScroll: true });
  }

  if (menuButton && menu) {
    menuButton.addEventListener("click", function () {
      if (menuButton.getAttribute("aria-expanded") === "true") closeMenu(false); else openMenu();
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") { closeMenu(true); return; }
      if (e.key !== "Tab") return;
      // Keep focus within the header controls and the menu while it is open.
      var focusables = Array.prototype.slice.call(
        document.querySelectorAll("#siteHeader a, #siteHeader button, #mobileMenu a")
      ).filter(function (el) { return el.offsetParent !== null; });
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (mq) {
      if (mq.matches) closeMenu(false);
    });
  }

  /* ---------- Active section in navigation ---------- */
  var navLinks = document.querySelectorAll('.primary-nav a, .mobile-links a');
  var sections = ["work", "approach", "toolkit", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      var active = null;
      sections.forEach(function (s) { if (visible[s.id] && !active) active = s.id; });
      navLinks.forEach(function (a) {
        if (a.getAttribute("href") === "#" + active) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (!reduceMotion.matches && "IntersectionObserver" in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealables.forEach(function (el) { revealer.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  }
  root.classList.add("js-ready");

  /* ---------- Local time in Nepal ---------- */
  var timeEls = [document.getElementById("nepalTime"), document.getElementById("contactTime")];
  var dateEl = document.getElementById("ticketDate");
  var timeFmt, dateFmt;
  try {
    timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", hour12: false });
    dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "2-digit", month: "short", year: "numeric" });
  } catch (e) { timeFmt = null; }

  function tick() {
    if (!timeFmt) return;
    var now = new Date();
    var t = timeFmt.format(now) + " NPT";
    timeEls.forEach(function (el) { if (el) el.textContent = t; });
    if (dateEl) dateEl.textContent = dateFmt.format(now);
  }
  tick();
  setInterval(tick, 30000);

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById("copyEmail");
  var copyStatus = document.getElementById("copyStatus");
  if (copyBtn) {
    var resetTimer;
    copyBtn.addEventListener("click", function () {
      var value = copyBtn.getAttribute("data-copy");
      var done = function (ok) {
        copyBtn.classList.toggle("is-copied", ok);
        if (copyStatus) copyStatus.textContent = ok ? "Email address copied" : "Couldn’t copy — select the address instead";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          copyBtn.classList.remove("is-copied");
          if (copyStatus) copyStatus.textContent = "";
        }, 2600);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  }
})();
