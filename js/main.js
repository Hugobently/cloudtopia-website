/* ============================================================
   Cloudtopia — interactions (v2)
   Vanilla JS, no dependencies. Progressive enhancement:
   everything degrades gracefully without it.
   v2 adds: rainbow scroll trail, pointer parallax, tap-to-
   transform cloudlings, the sundrop hunt, sparkle bursts,
   lightbox with focus trap + swipe + map zoom/pan.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav background + rainbow progress trail ---------- */
  var nav = document.getElementById("nav");
  var progress = document.getElementById("skyProgress");
  function onScroll() {
    if (window.scrollY > 24) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progress.style.width = (p * 100).toFixed(2) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });
  document.addEventListener("click", function (e) {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) closeMenu();
  });

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Scroll-spy: highlight the nav link of the section in view ---------- */
  var navAnchors = Array.prototype.slice.call(
    document.querySelectorAll('.nav__links a[href^="#"]'));
  var linkById = {};
  navAnchors.forEach(function (a) { linkById[a.getAttribute("href").slice(1)] = a; });
  var spyTargets = Object.keys(linkById)
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && spyTargets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navAnchors.forEach(function (a) { a.classList.remove("is-active"); });
          if (linkById[e.target.id]) linkById[e.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    spyTargets.forEach(function (t) { spy.observe(t); });
  }

  /* ---------- Sparkle bursts (shared by sundrops + transforms) ---------- */
  function sparkleBurst(x, y, count) {
    if (reduceMotion) return;
    count = count || 8;
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "spark";
      var ang = (Math.PI * 2 * i) / count + Math.random() * 0.8;
      var dist = 28 + Math.random() * 42;
      s.style.left = x - 5 + "px";
      s.style.top = y - 5 + "px";
      s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      s.style.setProperty("--dy", Math.sin(ang) * dist - 14 + "px");
      s.addEventListener("animationend", function () { this.remove(); });
      document.body.appendChild(s);
    }
  }

  /* ---------- Hero parallax: scroll depth + gentle pointer drift ----------
     Writes --px/--py custom properties that the `float` keyframes read,
     so parallax composes with the idle bobbing instead of overriding it. */
  var heroEl = document.getElementById("hero");
  var parallaxEls = Array.prototype.slice.call(
    document.querySelectorAll(".hero [data-depth]"));
  if (!reduceMotion && heroEl && parallaxEls.length) {
    var mx = 0, my = 0, pending = false;
    function applyParallax() {
      pending = false;
      var y = window.scrollY;
      if (y > window.innerHeight) return;
      parallaxEls.forEach(function (el) {
        var depth = parseFloat(el.getAttribute("data-depth")) || 0.1;
        var px = -mx * depth * 70;
        var py = y * depth * 0.9 - my * depth * 46;
        el.style.setProperty("--px", px.toFixed(1) + "px");
        el.style.setProperty("--py", py.toFixed(1) + "px");
      });
    }
    function queue() {
      if (!pending) { pending = true; window.requestAnimationFrame(applyParallax); }
    }
    window.addEventListener("scroll", queue, { passive: true });
    if (finePointer) {
      heroEl.addEventListener("mousemove", function (e) {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
        queue();
      });
      heroEl.addEventListener("mouseleave", function () { mx = 0; my = 0; queue(); });
    }
  }

  /* ---------- Cloudlings: tap / keyboard transform (hover handles itself) ---------- */
  document.querySelectorAll("[data-transform]").forEach(function (card) {
    function fire() {
      var on = card.classList.toggle("is-played");
      if (on) {
        var art = card.querySelector(".cloudling__art");
        var r = (art || card).getBoundingClientRect();
        sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 10);
      }
    }
    card.addEventListener("click", fire);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); }
    });
  });

  /* ---------- The sundrop hunt: tap to collect, just like in the app ---------- */
  var drops = Array.prototype.slice.call(document.querySelectorAll("[data-sundrop]"));
  var score = document.getElementById("sunScore");
  var scoreNum = document.getElementById("sunScoreNum");
  var scoreTotal = document.getElementById("sunScoreTotal");
  var collected = 0;
  if (scoreTotal) scoreTotal.textContent = "/" + drops.length;
  drops.forEach(function (drop) {
    drop.addEventListener("click", function () {
      if (drop.classList.contains("is-got")) return;
      drop.classList.add("is-got");
      collected++;
      var r = drop.getBoundingClientRect();
      sparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 9);
      if (score) {
        score.hidden = false;
        scoreNum.textContent = collected;
        score.classList.add("bump");
        setTimeout(function () { score.classList.remove("bump"); }, 280);
        if (collected === drops.length) {
          score.classList.add("is-done");
          score.setAttribute("title", "You found every sundrop!");
          scoreTotal.textContent = "";
          scoreNum.textContent = "All " + drops.length + " sundrops! ✨";
          var sr = score.getBoundingClientRect();
          sparkleBurst(sr.left + sr.width / 2, sr.top + sr.height / 2, 14);
        }
      }
    }, { once: false });
  });

  /* ---------- Lightbox (mini-games + zoomable map) ---------- */
  var lb = document.getElementById("lightbox");
  var lbStage = document.getElementById("lbStage");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");

  // Build the navigable set from the mini-games gallery.
  var galleryBtns = Array.prototype.slice.call(
    document.querySelectorAll("#gallery .gallery__item"));
  var galleryItems = galleryBtns.map(function (b, i) {
    return { src: b.getAttribute("data-full"), cap: "Mini-game " + (i + 1) + " of " + galleryBtns.length };
  });
  var current = -1;
  var lastFocused = null;

  function preloadNeighbors(index) {
    [index - 1, index + 1].forEach(function (i) {
      var item = galleryItems[(i + galleryItems.length) % galleryItems.length];
      if (item) { var im = new Image(); im.src = item.src; }
    });
  }
  function setSlide(index) {
    current = index;
    lbImg.src = galleryItems[current].src;
    lbImg.alt = galleryItems[current].cap;
    lbCap.textContent = galleryItems[current].cap;
    preloadNeighbors(current);
  }
  function showLightbox(multi) {
    lbPrev.style.display = multi ? "grid" : "none";
    lbNext.style.display = multi ? "grid" : "none";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    lastFocused = document.activeElement;
    lbClose.focus();
  }
  function openGallery(index) {
    lb.classList.remove("lightbox--map");
    resetMapZoom();
    setSlide(index);
    showLightbox(galleryItems.length > 1);
  }
  function openMap(src, cap) {
    current = -1;
    lb.classList.add("lightbox--map");
    resetMapZoom();
    lbImg.src = src;
    lbImg.alt = cap;
    lbCap.textContent = cap + " — tap to zoom, drag to explore";
    showLightbox(false);
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    resetMapZoom();
    // keep the image during the fade-out; just restore focus
    if (lastFocused) lastFocused.focus();
  }
  function step(dir) {
    if (current < 0) return;
    setSlide((current + dir + galleryItems.length) % galleryItems.length);
  }

  galleryBtns.forEach(function (btn, i) {
    btn.addEventListener("click", function () { openGallery(i); });
  });

  // Map showpiece: opens in map mode with click-to-zoom + drag-to-pan.
  var mapBtn = document.querySelector(".map-show");
  if (mapBtn) {
    mapBtn.addEventListener("click", function () {
      openMap(mapBtn.getAttribute("data-full"), "The world of Cloudtopia");
    });
  }

  /* --- map zoom / pan --- */
  var ZOOM = 2.2;
  var zoomed = false, tx = 0, ty = 0;
  var dragging = false, moved = false, startX = 0, startY = 0, startTx = 0, startTy = 0;
  function applyMapTransform() {
    lbImg.style.transform = zoomed
      ? "translate(" + tx + "px," + ty + "px) scale(" + ZOOM + ")"
      : "";
  }
  function clampPan() {
    var stage = lbStage.getBoundingClientRect();
    var maxX = Math.max(0, (lbImg.offsetWidth * ZOOM - stage.width) / 2);
    var maxY = Math.max(0, (lbImg.offsetHeight * ZOOM - stage.height) / 2);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }
  function resetMapZoom() {
    zoomed = false; tx = 0; ty = 0; dragging = false;
    lbImg.classList.remove("is-zoomed", "is-dragging");
    lbImg.style.transform = "";
  }
  lbImg.addEventListener("click", function (e) {
    if (!lb.classList.contains("lightbox--map") || moved) { moved = false; return; }
    zoomed = !zoomed;
    lbImg.classList.toggle("is-zoomed", zoomed);
    if (!zoomed) { tx = 0; ty = 0; }
    applyMapTransform();
    e.stopPropagation();
  });
  lbImg.addEventListener("pointerdown", function (e) {
    if (!zoomed) return;
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY; startTx = tx; startTy = ty;
    lbImg.classList.add("is-dragging");
    lbImg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  lbImg.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    tx = startTx + dx; ty = startTy + dy;
    clampPan();
    applyMapTransform();
  });
  ["pointerup", "pointercancel"].forEach(function (ev) {
    lbImg.addEventListener(ev, function () {
      dragging = false;
      lbImg.classList.remove("is-dragging");
    });
  });

  /* --- buttons / backdrop / keys --- */
  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", function () { step(-1); });
  lbNext.addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Tab") {
      // simple focus trap across the lightbox controls
      var focusables = [lbClose, lbPrev, lbNext].filter(function (b) {
        return b.style.display !== "none";
      });
      var idx = focusables.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (idx <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
      } else {
        if (idx === focusables.length - 1 || idx === -1) { e.preventDefault(); focusables[0].focus(); }
      }
    }
  });

  /* --- swipe between gallery slides on touch --- */
  var touchX = null;
  lb.addEventListener("touchstart", function (e) {
    if (zoomed || e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null || zoomed) { touchX = null; return; }
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 44) step(dx < 0 ? 1 : -1);
  }, { passive: true });
})();
