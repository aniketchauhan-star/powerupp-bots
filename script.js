/* ============================================================================
   THE STORY NIGHT — flipbook behaviour.
   Diagnostic first: surface any REAL JavaScript error on screen (a silent error
   would stop the click handlers from ever attaching). Image / video / network
   load failures are ignored — they have no .message and are handled per-element.
   ============================================================================ */
window.addEventListener("error", function (ev) {
  if (!ev || !ev.message) return;                 // ignore resource-load errors
  var b = document.getElementById("__jsErr");
  if (!b) {
    b = document.createElement("div");
    b.id = "__jsErr";
    b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:100000;" +
      "background:#b00020;color:#fff;font:13px/1.5 monospace;padding:10px;white-space:pre-wrap";
    (document.body || document.documentElement).appendChild(b);
  }
  b.textContent = "⚠ JavaScript error (this is likely why the book won't open):\n" +
    ev.message + "\n" + (ev.filename || "") + " : line " + ev.lineno;
});

// If you can read this line in the console, the script parsed with NO syntax
// error and you are running the CURRENT file (not a cached copy).
console.log("%c✅ [The Story Night] loaded — 3D flipbook · full-bleed pages · speech bubbles.",
            "font-weight:bold;color:#7d5fd0;font-size:13px");

/* ---- Preloader bridge -----------------------------------------------------
   preloader.js (loaded just before this file) fetches every asset behind the
   cover's loading bar and keeps flipbook media as blob: URLs. Set a media
   element's src through plSetSrc so DYNAMIC assignments (hotspot / sequence
   clips) use the local blob — and so their "is this src already set?" checks
   compare against the RESOLVED URL, never undoing a blob swap. Falls back to
   the plain path when the preloader is absent (e.g. opened via file://). */
function plSetSrc(el, path) {
  if (window.PRELOAD && window.PRELOAD.setSrc) { window.PRELOAD.setSrc(el, path); return; }
  if (el.getAttribute("src") !== path) el.src = path;
}

/* ============================================================================
   ██  EDIT YOUR CONTENT HERE  ██
   ----------------------------------------------------------------------------
   Every entry below is ONE page of the book, shown in order after the cover.

     • type   : "video"  → a full-page video (e.g. assets/1.webm)
                "image"  → a full-page picture (e.g. assets/3.webp)
     • src    : the media file for that page.
     • delay  : (video only, optional) milliseconds to wait after landing on the
                page before the video starts (e.g. delay: 3000 → starts after 3s).
                Omit / 0 → the video starts instantly.
     • bubble : (optional) a speech bubble that POPS IN once the reader has
                FULLY landed on the page. Set:
                   kind     : "neel" (pink) or "everywhere" (glowing) — picks
                              which bubble artwork + crop to use.
                   text     : the words shown inside the bubble.
                   box      : where + how big — { top/left/right/bottom, w }.
                              positions are CSS lengths (e.g. "3%"); w is the
                              bubble WIDTH in book-space px (book is 1280x720).
                   flip     : true → mirror the bubble so its tail points the
                              other way.
                   textLeft / textTop / fontSize : fine-tune the words inside.

   Add / remove / reorder pages freely — the flip engine and the "Page X / N"
   counter update automatically.
   ============================================================================ */
// TWO-PAGE sample template (the game has been removed). Each video page has a
// matching first-frame poster in assets/posters/ so the scene shows instantly.
// Add / remove / reorder pages freely — the flip engine and the "Page X / N"
// counter update automatically.
// MEDIA FORMATS: videos are WebM (VP9 + Opus), audio is Ogg (Opus), images are
// WebP — supported by Chrome/Edge/Firefox and recent Safari (16.4+/17+).
const pages = [
  { type: "video", src: "assets/1.webm" },           // 1 — opening video
  { type: "video", src: "assets/2.webm" },           // 2
  { type: "video", src: "assets/3.webm" },           // 3
  { type: "video", src: "assets/4.webm" },           // 4
  {                                                  // 5 — INTERACTIVE shapes page
    // The shelf picture (5.webp) is the always-on HOME of this page. The reader is
    // guided by the hand nudge to tap each shape group in turn; each tap plays that
    // shape's full-screen video, then returns to the shelf and points at the next.
    type: "hotspots",
    src: "assets/5.webp",                            // static shelf — always behind
    steps: [
      { key: "rectangle", src: "assets/5(rectangle).webm",                // pink rectangles (top shelf)
        box:  { left: "33%", top: "27%", width: "34%", height: "17%" },
        hand: { left: "50%", top: "27%" } },                              // hand on the pink shape
      { key: "green", src: "assets/5(green).webm",                         // green squares (middle shelf)
        box:  { left: "34%", top: "45%", width: "30%", height: "19%" },
        hand: { left: "49%", top: "51%" } },                              // hand on the green shape
      { key: "circle", src: "assets/5(circle).webm",                       // yellow circles (bottom shelf)
        box:  { left: "34%", top: "69%", width: "31%", height: "18%" },
        hand: { left: "49%", top: "75%" } },                              // hand on the yellow shape
    ],
  },
  { type: "video", src: "assets/6.webm" },           // 6
  {                                                  // 7 — INTRO video → still (tap) → REVEAL video
    // On arrival, the intro clip (7.webm) plays. When it ends, the still (7(1).webp)
    // appears with a hand pointing at the FIRST (leftmost) pink rectangle. Tapping
    // it plays the reveal clip (7(2).webm); after that, the turn-the-page nudge shows.
    type: "sequence",
    intro:  "assets/7.webm",                          // plays on arrival
    still:  "assets/7(1).webp",                       // shown after the intro (holds the hotspot)
    reveal: "assets/7(2).webm",                        // plays when the pink rectangle is tapped
    hotspot: {
      box:  { left: "3.5%", top: "11%", width: "14%", height: "16%" },   // first pink rectangle
      hand: { left: "10.5%", top: "15%" },                               // hand on that rectangle (fingertip in the middle of the pink box)
    },
  },
  {                                                  // 8 — INTRO video (pauses) → tap pink → REVEAL video
    // 8.webm plays, then PAUSES on its last frame (no separate still image). A hand
    // points at the pink rectangle on the shelf; tapping it plays 9.webm, then the
    // turn-the-page nudge shows.
    type: "sequence",
    intro:  "assets/8.webm",
    reveal: "assets/9.webm",
    hotspot: {
      box:  { left: "4.5%", top: "24%", width: "18%", height: "14%" },   // pink rectangle (top-left shelf)
      hand: { left: "13.5%", top: "26%" },
    },
  },
  { type: "video", src: "assets/10.webm" },          // 10
  {                                                  // GAME — Power Up, Bots! (halves game)
    // Interactive "halves" game. Landing on this page shows the game's own title
    // screen PARKED inside the page (it looks printed in the book); tapping the
    // game's Play button expands the overlay to true fullscreen (the game posts
    // lbd-start). When the game finishes it shrinks away and the book AUTO-turns
    // to the next page (11.webm). The poster is the game's own start screen — seen
    // on the leaf during the page-turn, just before the live overlay takes over.
    type: "lbd",
    src:    "PowerUp-Bots-main/story/index.html",
    poster: "PowerUp-Bots-main/story/assets/GameStartScreen.webp",
  },
  { type: "video", src: "assets/11.webm" },          // 11
  { type: "end" },                                   // 12 — THE END page (cream) + Replay
];

/* ============================================================================
   ██  HAND NUDGES  —  EDIT THE GUIDING HAND FOR EVERY PAGE HERE  ██
   ----------------------------------------------------------------------------
   Each page shows a guiding hand (it appears 5s after that page's video). Every
   page has its OWN entry, so they can all be different. Keyed by LEAF INDEX
   (0 = page 1). Every field is optional — anything you leave out falls back to
   DEFAULT_NUDGE:
     • left / top : where the FINGERTIP points, as a % of the page (page = 1280×720).
                    e.g. left:"90%", top:"50%"  → right edge, vertically centred.
     • w          : hand WIDTH in book pixels (size). bigger = bigger hand.
     • rot        : tilt in degrees (+ = clockwise). 0 = straight up.
     • show       : set to false to HIDE the hand on that page.
   Tip: to point at something, put left/top over it (the fingertip is the top of
   the hand). Interactive pages (5,7,8) also have their OWN in-page hands during
   the activity — those live in the page config above; THIS hand is the later
   "turn the page" one.
   ============================================================================ */
const DEFAULT_NUDGE = { left: "90%", top: "50%", w: 82, rot: 8, show: true };
const PAGE_NUDGES = {
  0: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 1
  1: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 2
  2: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 3
  3: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 4
  4: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 5  (after the shapes activity)
  5: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 6
  6: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 7  (after the reveal)
  7: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 8  (after the reveal)
  8: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 10
  9: { left: "90%", top: "50%", w: 82, rot:  8 },   // page 11
};

/* ============================================================================
   ██  END OF EDITABLE CONTENT — engine below (no need to change) ██
   ============================================================================ */

/* ---- Build one page face's media (image OR video OR lbd poster) ---------- */
function makeMedia(page, index) {
  // Interactive "hotspots" page (page 5): a static base image with tap-zones over
  // each shape group + overlay shape videos + a guiding hand. Built by its own
  // controller so it can manage its step-by-step flow independently of the engine.
  if (page.type === "hotspots") {
    const c = buildHotspotPage(page); specialCtrls[index] = c; return c.el;
  }
  // "sequence" page (pages 7 & 8): intro video → still (or the paused intro's last
  // frame) with a hotspot → reveal video. Registered by index (there can be several).
  if (page.type === "sequence") {
    const c = buildSequencePage(page); specialCtrls[index] = c; return c.el;
  }
  // "lbd" pages show a STILL poster on the leaf itself (seen while the page turns);
  // the live, interactive game is a separate full-screen-capable overlay iframe
  // (see the LBD OVERLAY section below) — it can't live inside the 3D-transformed
  // leaf because CSS transforms trap position:fixed, so true fullscreen would fail.
  if (page.type === "lbd") {
    const img = document.createElement("img");
    img.className = "page-media";
    img.draggable = false;
    img.addEventListener("dragstart", function (e) { e.preventDefault(); });
    img.decoding = "async";
    img.src = page.poster || "";
    img.alt = "Power Up, Bots! — tap Play to start";
    return img;
  }
  const media = page.type === "video"
    ? document.createElement("video")
    : document.createElement("img");
  media.className = "page-media";
  media.draggable = false;                           // never let the image "ghost-drag" out
  media.addEventListener("dragstart", function (e) { e.preventDefault(); });
  media.src = page.src;
  if (page.type === "video") {
    media.loop = false;
    media.playsInline = true;
    media.setAttribute("playsinline", "");            // iOS Safari inline playback
    media.setAttribute("webkit-playsinline", "");
    // FIRST-FRAME POSTER: the page surface (--paper) is deep night-blue, so a video
    // that hasn't painted a frame yet (still buffering, or autoplay was blocked) would
    // show as a BLANK dark-blue page. The poster is that clip's own frame 0, so the
    // scene shows INSTANTLY and — because it equals where playback starts — there's no
    // jump when the video then plays. Posters are tiny (~40KB) and live in assets/posters/.
    media.setAttribute("poster",
      page.src.replace(/^assets\//, "assets/posters/").replace(/\.webm$/i, ".webp"));
    // LAZY: do NOT eager-buffer. With 25 videos, preload="auto" made the browser
    // open + decode every clip on load (huge memory/CPU spike + open lag). We only
    // buffer the page you're on + the next one, on demand (see warmVideo()).
    media.preload = "none";
    // Tap the video to (re)start it WITH sound — a guaranteed user gesture, so
    // browsers that blocked the auto-start's audio will now allow it.
    media.addEventListener("click", function () {
      media.muted = false;
      try { if (media.ended) media.currentTime = 0; } catch (_) {}
      const p = media.play(); if (p && p.catch) p.catch(function () {});
    });
    // When THIS page's video FULLY finishes, ARM the "turn the page" tutorial — the
    // hand nudge + ghost page-flip + blinking forward arrow — which then appears 5s
    // later (and re-appears 5s after any interaction). Fires ONCE per page arrival
    // (armBlink). Skipped on the last page (nothing to turn to).
    // THREE paths arm it — `ended`, `error`, and a per-arrival watchdog in
    // refreshMedia — so a broken/stalled video can never suppress the guidance.
    function armTurnHint() {
      if (!opened || !ready || lbdFullscreen || flipped >= totalPages - 1) return;
      if (!leaves[flipped] || !leaves[flipped].contains(media)) return;   // only the current page
      if (!armBlink) return;                     // once per page arrival
      armBlink = false;
      if (typeof armFlipHint === "function") armFlipHint();   // show the flip tutorial 5s later
    }
    media.addEventListener("ended", armTurnHint);
    media.addEventListener("error", armTurnHint);
    // Unlock paths (a)+(b) for the video-gated Next arrow — only when this
    // video belongs to the page the reader is on (see armNextGate).
    function unlockGate() {
      if (leaves[flipped] && leaves[flipped].contains(media)) unlockNext(flipped);
    }
    media.addEventListener("ended", unlockGate);
    media.addEventListener("error", unlockGate);
  } else {
    media.decoding = "async";
    media.alt = page.alt || "story page";
  }
  return media;
}

/* ---- Build the INTERACTIVE "hotspots" page (page 5) ----------------------
   Layout (all inside one .hotspot-page that fills the leaf):
     • .hs-base   — the static shelf image, always visible underneath.
     • .hs-video  — ONE reused <video> that plays the tapped shape's clip on top;
                    hidden (faded out) whenever we're on the shelf.
     • .hs-zone   — one invisible tap button per shape group (pink / green / yellow).
     • .hs-hand   — the guiding hand nudge, pointing UP at the ACTIVE shape.
   Flow: land → hand points at shape 0 (pink). Tap it → its video plays. On end →
   back to the shelf, hand points at shape 1 (green). …then shape 2 (yellow). After
   the last clip ends → hand off + the normal "turn the page" tutorial fires.
   Only the ACTIVE shape is tappable at each step, so the sequence stays in order. */
function buildHotspotPage(page) {
  const steps = page.steps || [];

  const wrap = document.createElement("div");
  wrap.className = "hotspot-page";

  const base = document.createElement("img");             // the shelf (always behind)
  base.className = "hs-base";
  base.src = page.src; base.alt = ""; base.decoding = "async"; base.draggable = false;
  base.addEventListener("dragstart", function (e) { e.preventDefault(); });
  wrap.appendChild(base);

  const vid = document.createElement("video");            // reused overlay video
  vid.className = "hs-video";
  vid.playsInline = true;
  vid.setAttribute("playsinline", ""); vid.setAttribute("webkit-playsinline", "");
  vid.loop = false; vid.preload = "none"; vid.draggable = false;
  vid.addEventListener("dragstart", function (e) { e.preventDefault(); });
  wrap.appendChild(vid);

  const hand = document.createElement("img");             // guiding hand nudge
  hand.className = "hs-hand"; hand.src = "assets/handNudge.webp?v=3";   // ?v bump = ignore stale cache
  hand.alt = ""; hand.setAttribute("aria-hidden", "true"); hand.decoding = "async";
  hand.draggable = false;
  hand.addEventListener("dragstart", function (e) { e.preventDefault(); });
  hand.addEventListener("error", function () { hand.style.display = "none"; }, { once: true });
  wrap.appendChild(hand);

  const zones = steps.map(function (s, i) {                // one tap-zone per shape
    const b = document.createElement("button");
    b.type = "button"; b.className = "hs-zone";
    b.setAttribute("aria-label", "Tap the " + (s.key || ("shape " + (i + 1))));
    b.style.left = s.box.left; b.style.top = s.box.top;
    b.style.width = s.box.width; b.style.height = s.box.height;
    b.style.pointerEvents = "none";
    b.addEventListener("click", function (e) { e.stopPropagation(); playStep(i); });
    wrap.appendChild(b);
    return b;
  });

  let step = 0;          // which shape is next to tap (0..steps.length)
  let playing = false;   // is a shape video playing right now?
  let active = false;    // are we currently ON this page?
  let handTimer = null;

  function positionHand() {
    const s = steps[step]; if (!s) return;
    const h = s.hand || {};
    hand.style.left = (h.left != null) ? h.left
      : (parseFloat(s.box.left) + parseFloat(s.box.width) / 2) + "%";
    hand.style.top  = (h.top  != null) ? h.top
      : (parseFloat(s.box.top) + parseFloat(s.box.height) + 1) + "%";
  }
  function showHand() {
    if (!active || playing || step >= steps.length) { hand.classList.remove("show"); return; }
    positionHand();
    // Only the shape we're pointing at is tappable (keeps the pink→green→yellow order).
    zones.forEach(function (z, i) {
      const on = (i === step);
      z.style.pointerEvents = on ? "auto" : "none";
      z.classList.toggle("is-active", on);
    });
    // Buffer this step's (tiny) clip so the tap feels instant.
    plSetSrc(vid, steps[step].src);
    vid.preload = "auto"; try { vid.load(); } catch (_) {}
    hand.classList.remove("show"); void hand.offsetWidth; hand.classList.add("show");
  }
  function toShelf() {                 // hide the video → reveal the shelf
    playing = false;
    vid.classList.remove("show");
    try { vid.pause(); } catch (_) {}
  }
  function playStep(i) {
    if (playing || !active || i !== step) return;    // only the active shape, one at a time
    playing = true;
    clearTimeout(handTimer);
    hand.classList.remove("show");
    zones.forEach(function (z) { z.style.pointerEvents = "none"; z.classList.remove("is-active"); });
    plSetSrc(vid, steps[i].src);
    clearTimeout(stepWatchdog);                       // watchdog: never strand the reader on a dead clip
    stepWatchdog = setTimeout(stepDone,
      (isFinite(vid.duration) && vid.duration > 0) ? vid.duration * 1000 + 4000 : 30000);
    vid.classList.add("show");
    try { vid.currentTime = 0; } catch (_) {}
    vid.muted = false;
    const p = vid.play();
    if (p && p.catch) p.catch(function () { vid.muted = true; vid.play().catch(function () {}); });
  }
  /* Step finished → back to the shelf, point at the next shape. THREE paths so
     a broken/stalled clip can never strand the reader mid-activity:
     the clip's `ended`, its `error`, and a watchdog (duration + 4s grace;
     30s when the duration is unknown), armed per tap and cleared on leave. */
  let stepWatchdog = null;
  function stepDone() {
    clearTimeout(stepWatchdog);
    if (!active || !playing) return;                  // only while a step clip is up
    toShelf();
    step++;
    if (step < steps.length) {
      showHand();                                     // point at the next shape
      if (typeof bumpNextGate === "function") bumpNextGate();  // progress → push the safety unlock back
    } else {
      hand.classList.remove("show");
      // EVERY shape has now played → the interaction is complete, so open the
      // Next gate (the arrow appears) and nudge to turn the page 5s later.
      if (typeof unlockNext === "function") unlockNext(flipped);
      if (typeof armFlipHint === "function") armFlipHint();
    }
  }
  vid.addEventListener("ended", stepDone);
  vid.addEventListener("error", stepDone);
  // Tap the playing video to (re)start it with sound (parity with normal pages).
  vid.addEventListener("click", function () {
    if (!playing) return;
    vid.muted = false;
    try { if (vid.ended) vid.currentTime = 0; } catch (_) {}
    const p = vid.play(); if (p && p.catch) p.catch(function () {});
  });

  return {
    el: wrap,
    enter: function () {                 // landed on the page → start the guided sequence
      if (active) return;                // already here (ignore repeat refreshMedia calls)
      active = true; step = 0; playing = false;
      toShelf();
      clearTimeout(handTimer);
      hand.classList.remove("show");
      handTimer = setTimeout(showHand, 1150);        // pop the hand once the flip settles
    },
    leave: function () {                 // flipped away / book closed → reset for next visit
      if (!active) return;
      active = false; step = 0; playing = false;
      clearTimeout(handTimer);
      clearTimeout(stepWatchdog);
      hand.classList.remove("show");
      zones.forEach(function (z) { z.style.pointerEvents = "none"; z.classList.remove("is-active"); });
      vid.classList.remove("show");
      try { vid.pause(); vid.currentTime = 0; } catch (_) {}
    }
  };
}

/* ---- Build the "sequence" page (pages 7 & 8) ----------------------------
   Three phases in one page (all inside a .hotspot-page that fills the leaf):
     intro  → the intro video plays on arrival.
     still  → when the intro ends, the reader taps a hotspot. The "still" it points
              at is EITHER a separate image (page.still, e.g. 7(1).webp) OR — if no
              still is given — the intro video simply PAUSED on its last frame (page 8).
     reveal → tapping the hotspot plays the reveal video.
   After the reveal video ends, the "turn the page" nudge is armed (shows 5s later). */
function buildSequencePage(page) {
  const wrap = document.createElement("div");
  wrap.className = "hotspot-page seq-page";           // reuse fill + clip styling

  const hasStill = !!page.still;
  let still = null;
  if (hasStill) {
    still = document.createElement("img");            // shown after the intro
    still.className = "seq-layer seq-still";
    still.src = page.still; still.alt = ""; still.decoding = "async"; still.draggable = false;
    still.addEventListener("dragstart", function (e) { e.preventDefault(); });
    wrap.appendChild(still);
  }

  function mkVideo() {
    const v = document.createElement("video");
    v.className = "seq-layer";
    v.playsInline = true;
    v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    v.loop = false; v.preload = "none"; v.draggable = false;
    v.addEventListener("dragstart", function (e) { e.preventDefault(); });
    v.addEventListener("click", function () {          // tap the playing clip → restart w/ sound
      if (!v.classList.contains("show")) return;
      v.muted = false;
      try { if (v.ended) v.currentTime = 0; } catch (_) {}
      const p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    wrap.appendChild(v);
    return v;
  }
  const intro  = mkVideo();
  const reveal = mkVideo();

  const hs = page.hotspot || {};
  const zone = document.createElement("button");     // tap-zone over the first pink rectangle
  zone.type = "button"; zone.className = "hs-zone";
  zone.setAttribute("aria-label", "Tap the pink rectangle");
  if (hs.box) { zone.style.left = hs.box.left; zone.style.top = hs.box.top;
                zone.style.width = hs.box.width; zone.style.height = hs.box.height; }
  zone.style.pointerEvents = "none";
  zone.addEventListener("click", function (e) { e.stopPropagation(); tapHotspot(); });
  wrap.appendChild(zone);

  const hand = document.createElement("img");        // guiding hand
  hand.className = "hs-hand"; hand.src = "assets/handNudge.webp?v=3";
  hand.alt = ""; hand.setAttribute("aria-hidden", "true"); hand.decoding = "async"; hand.draggable = false;
  hand.addEventListener("dragstart", function (e) { e.preventDefault(); });
  hand.addEventListener("error", function () { hand.style.display = "none"; }, { once: true });
  if (hs.hand) { hand.style.left = hs.hand.left; hand.style.top = hs.hand.top; }
  wrap.appendChild(hand);

  let active = false;
  let phase = "intro";       // intro | still | reveal | done

  // The layer the hotspot sits on while waiting for the tap: a separate still image
  // if given, otherwise the intro video itself (paused on its last frame).
  function stillLayer() { return hasStill ? still : intro; }

  function playVid(v, src) {
    if (src) plSetSrc(v, src);
    v.classList.add("show");
    try { v.currentTime = 0; } catch (_) {}
    v.muted = false;
    const p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
  }
  function showHotspotHand() {
    // buffer the reveal clip so the tap feels instant
    plSetSrc(reveal, page.reveal);
    reveal.preload = "auto"; try { reveal.load(); } catch (_) {}
    zone.style.pointerEvents = "auto"; zone.classList.add("is-active");
    hand.classList.remove("show"); void hand.offsetWidth; hand.classList.add("show");
  }
  function tapHotspot() {
    if (!active || phase !== "still") return;
    phase = "reveal";
    hand.classList.remove("show");
    zone.style.pointerEvents = "none"; zone.classList.remove("is-active");
    stillLayer().classList.remove("show");             // hide the still (or the paused intro)
    playVid(reveal, page.reveal);
    clearTimeout(revealWatchdog);
    revealWatchdog = setTimeout(revealDone, watchdogMs(reveal));
    if (typeof bumpNextGate === "function") bumpNextGate();   // tapped → don't unlock behind the reveal
  }
  /* Phase advances are media-gated, so each has THREE paths — the clip's
     `ended`, its `error`, and a watchdog (duration + 4s grace; 30s when the
     duration is unknown, re-armed per page arrival) — a broken or stalled clip
     can never hide the hotspot / strand the reader on this page. */
  let introWatchdog = null, revealWatchdog = null;
  function introDone() {
    clearTimeout(introWatchdog);
    if (!active || phase !== "intro") return;
    phase = "still";
    if (hasStill) {
      intro.classList.remove("show"); try { intro.pause(); } catch (_) {}
      still.classList.add("show");                     // swap to the still (same scene → seamless)
    } else {
      try { intro.pause(); } catch (_) {}              // PAUSE + hold the intro's last frame
      intro.style.pointerEvents = "none";              // stray taps mustn't replay it (only the pink zone acts)
    }
    showHotspotHand();
    // The intro finishing is NOT the end of this page — the reader still has the
    // hotspot to tap. So the Next gate stays closed here (it opens in revealDone);
    // we only push the safety watchdog out to give them time to tap.
    if (typeof bumpNextGate === "function") bumpNextGate();
  }
  function revealDone() {
    clearTimeout(revealWatchdog);
    if (!active || phase !== "reveal") return;
    phase = "done";                                    // hold on the last frame; nudge to turn the page
    // Intro watched + hotspot tapped + reveal finished → the interaction is
    // complete, so the Next arrow appears now (all three paths funnel here).
    if (typeof unlockNext === "function") unlockNext(flipped);
    if (typeof armFlipHint === "function") armFlipHint();
  }
  function watchdogMs(v) {
    return (isFinite(v.duration) && v.duration > 0) ? v.duration * 1000 + 4000 : 30000;
  }
  intro.addEventListener("ended", introDone);
  intro.addEventListener("error", introDone);
  reveal.addEventListener("ended", revealDone);
  reveal.addEventListener("error", revealDone);

  return {
    el: wrap,
    warm: function () {                  // called while on the PREVIOUS page → buffer the intro
      plSetSrc(intro, page.intro);
      if (intro.preload !== "auto") { intro.preload = "auto"; try { intro.load(); } catch (_) {} }
    },
    enter: function () {                 // landed on the page → play the intro from the top
      if (active) return;
      active = true; phase = "intro";
      hand.classList.remove("show");
      zone.style.pointerEvents = "none"; zone.classList.remove("is-active");
      if (hasStill) still.classList.remove("show");
      intro.style.pointerEvents = "";                  // reset (no-still case held the last frame)
      reveal.classList.remove("show"); try { reveal.pause(); reveal.currentTime = 0; } catch (_) {}
      playVid(intro, page.intro);
      clearTimeout(introWatchdog);                     // re-armed on EVERY page arrival
      introWatchdog = setTimeout(introDone, watchdogMs(intro));
    },
    leave: function () {                 // flipped away / book closed → reset for next visit
      if (!active) return;
      active = false; phase = "intro";
      clearTimeout(introWatchdog); clearTimeout(revealWatchdog);
      hand.classList.remove("show");
      zone.style.pointerEvents = "none"; zone.classList.remove("is-active");
      if (hasStill) still.classList.remove("show");
      [intro, reveal].forEach(function (v) {
        v.classList.remove("show"); try { v.pause(); v.currentTime = 0; } catch (_) {}
      });
    }
  };
}

/* ---- Build one speech bubble (hidden until the page fully lands) ---------
   The bubble artwork + crop live in styles.css (.bubble.neel / .bubble.everywhere).
   Here we only apply the per-page geometry (position, width, flip) + the text. */
function makeBubble(bubble) {
  const wrap = document.createElement("div");
  wrap.className = "bubble" + (bubble.kind ? " " + bubble.kind : "");

  const box = bubble.box || {};
  ["top", "left", "right", "bottom"].forEach(function (k) {
    if (box[k] != null) wrap.style[k] = box[k];
  });
  if (box.w != null) wrap.style.setProperty("--w", box.w + "px");

  const bg = document.createElement("div");
  bg.className = "bubble-bg" + (bubble.flip ? " flip" : "");
  wrap.appendChild(bg);

  if (bubble.text) {
    const t = document.createElement("div");
    t.className = "bubble-text";
    t.textContent = bubble.text;
    if (bubble.textLeft) t.style.left = bubble.textLeft;
    if (bubble.textTop)  t.style.top  = bubble.textTop;
    if (bubble.fontSize) t.style.fontSize = bubble.fontSize;
    wrap.appendChild(t);
  }
  return wrap;
}

/* ---- Build one SVG speech bubble (white + black outline + purple glow) -----
   cfg = { text, box:{top,left,right,bottom,w}, tail, rot, fontSize }
     box   : position of the bubble box + its WIDTH in book-space px
     tail  : "down" | "down-left" | "down-right"  (which way the tail points)
     rot   : tilt in degrees (optional)
   Hidden until the page lands (revealed by refreshMedia). */
const SBUB_TAILS = {
  "down":       "M42 57 L58 57 L50 73 Z",
  "down-left":  "M30 55 L47 59 L16 73 Z",
  "down-right": "M53 59 L70 55 L84 73 Z"
};
function makeSpeechBubble(cfg) {
  const wrap = document.createElement("div");
  wrap.className = "sbub";
  const box = cfg.box || {};
  ["top", "left", "right", "bottom"].forEach(function (k) {
    if (box[k] != null) wrap.style[k] = box[k];
  });
  if (box.w != null) wrap.style.setProperty("--sbw", box.w + "px");
  if (cfg.rot)       wrap.style.setProperty("--sbrot", cfg.rot + "deg");

  const tailPath = SBUB_TAILS[cfg.tail] || SBUB_TAILS.down;
  wrap.innerHTML =
    '<svg class="sbub-svg" viewBox="0 0 100 74" aria-hidden="true">' +
      '<g class="sbub-shape">' +
        '<path d="' + tailPath + '"/>' +
        '<ellipse cx="50" cy="32" rx="47" ry="29"/>' +
      '</g>' +
    '</svg>';

  const t = document.createElement("div");
  t.className = "sbub-text";
  t.textContent = cfg.text || "";
  if (cfg.fontSize) t.style.fontSize = cfg.fontSize + "px";
  wrap.appendChild(t);
  return wrap;
}

/* ---- Build the pages (one CSS 3D "leaf" per entry) ---------------------- */
const flipbookEl  = document.getElementById("flipbook");
const pageStackEl = flipbookEl ? flipbookEl.querySelector(".page-stack") : null;   // right-side page stack
const flipScaleEl = document.getElementById("flipScale");
const coverScene  = document.getElementById("coverScene");
// ONE full 16:9 page per view (single display). page 1 = entry 1. The themed
// book frame forms the left spine/cover edge (always visible when open); pages
// flip normally. No two-page spread.
const totalPages = pages.length;
// Which leaf is the embedded LBD game (-1 if none). Used to show/hide the overlay.
const LBD_INDEX = pages.findIndex(function (p) { return p.type === "lbd"; });
// Which leaf is the interactive "hotspots" page (-1 if none), and its controller
// (assigned by makeMedia when that page is built — see buildHotspotPage).
// Interactive "special" pages (hotspots / sequence) register their controllers here,
// keyed by page index. Each controller exposes { el, enter(), leave(), warm?() }.
const specialCtrls = {};

// Each leaf is a full 16:9 page hinged on the LEFT spine:
//   • FRONT = the page's full-bleed image / video (+ its speech bubble, if any).
//   • BACK  = a BLANK parchment sheet (seen edge-on while the page turns).
const leaves = [];
pages.forEach(function (page, i) {
  const leaf = document.createElement("div");
  leaf.className = "leaf";

  const front = document.createElement("div");
  front.className = "face front";
  if (page.type === "end") {
    // THE END — a real final page (cream "paper") with a gold-plum title + Replay.
    front.classList.add("end-page");
    front.innerHTML =
      '<div class="end-page-inner">' +
        '<div class="end-title">THE&nbsp;END</div>' +
        '<button class="replay-btn" id="replayBtn" type="button" aria-label="Replay from the beginning">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>' +
          '</svg>' +
          '<span>Replay</span>' +
        '</button>' +
      '</div>';
  } else {
    front.appendChild(makeMedia(page, i));                    // full-bleed image / video
    if (page.bubble) front.appendChild(makeBubble(page.bubble));  // PNG speech bubble (revealed on land)
  }
  const curl = document.createElement("div");               // moving page-curl shading
  curl.className = "curl";
  front.appendChild(curl);

  const back = document.createElement("div");
  back.className = "face back";                             // blank reverse side (no content)

  leaf.appendChild(front);
  leaf.appendChild(back);
  flipbookEl.appendChild(leaf);
  leaves.push(leaf);
});

/* ---- State + element references ----------------------------------------- */
const bookStage  = document.getElementById("bookStage");
const book       = document.getElementById("book");
const bookPop    = document.getElementById("bookPop");
const bookFloat  = document.getElementById("bookFloat");
const cover      = document.getElementById("cover");
const hint       = document.getElementById("hint");
const cornerPrev  = document.getElementById("cornerPrev");
const cornerNext  = document.getElementById("cornerNext");
const replayBtn   = document.getElementById("replayBtn");   // lives on the THE END page (built above)
// (No Home button: it was removed. Replay — on THE END page — is the only way
//  back to the cover, and it still goes through closeBookToCover().)

/* ==========================================================================
   LBD OVERLAY  —  the "Power Up, Bots!" halves game embedded as one page.
   The game lives in a body-level iframe (#lbdStage) so it can grow to true
   fullscreen (a transform on .flip-scale would otherwise trap position:fixed).
   • warm-up  : the game is booted SILENTLY in the hidden iframe after the
                flipbook's own `load` (its title screen plays no audio until its
                Play button is tapped — verified), so landing on the game page
                never waits on the network.
   • pre-LBD  : the overlay is sized/positioned OVER the current page rectangle,
                so the game's title screen looks like it's printed inside the book.
   • start    : the game posts {source:"lbd", type:"lbd-start"} (via its
                embed-bridge.js) → we expand the overlay to fill the whole screen.
   • end      : the game posts {type:"activity_complete"} from its own
                completeGame() → we let the celebration show, then shrink the
                overlay back into the page and auto-flip to the next page.
   ========================================================================== */
const lbdStage = document.getElementById("lbdStage");
const lbdFrame = document.getElementById("lbdFrame");
let lbdFullscreen = false;   // is the overlay expanded to full screen right now?
let lbdStarted    = false;   // has the child tapped Start at least once this visit?
let lbdWasOn      = false;   // was the overlay showing on the previous refresh?
let lbdExiting    = false;   // guard so "complete" only advances once
let lbdAutoExitTimer = null; // pending "celebration shown → auto-advance" timer
const LBD_CELEBRATE_MS = 3600;  // let the "Bots Powered Up!" screen show before auto-advancing

// Show the blurred pre-LBD backdrop inside the frame while the game is loading
// (and while it's unloaded) so there is no dark flash — it matches the game's
// own splash background, so the live home screen fades in seamlessly.
if (lbdFrame && LBD_INDEX >= 0 && pages[LBD_INDEX].poster) {
  lbdFrame.style.background = "#0a0f2d url('" + pages[LBD_INDEX].poster + "') center/cover no-repeat";
}
// Point the hidden iframe at the game (idempotent). Normally called from the
// idle warm-up below; also called on page-land as a safety net.
function ensureLbdLoaded() {
  if (LBD_INDEX < 0 || !lbdFrame || lbdFrame.dataset.loaded) return;
  lbdFrame.src = pages[LBD_INDEX].src;
  lbdFrame.dataset.loaded = "1";
}
// BACKGROUND WARM-UP — boot the game while the reader is still on the cover /
// early pages. Waits for the flipbook's own `load` event (so the game is NEVER
// on the flipbook's critical path), then takes an idle slot (setTimeout fallback
// for Safari). Safe because the game's title screen is silent: every sound it
// owns starts inside its Play-tap gesture, never on load (verified in its boot).
function warmLbd() {
  if (LBD_INDEX < 0 || !lbdFrame) return;
  var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 800); };
  idle(function () { ensureLbdLoaded(); });
}
if (document.readyState === "complete") warmLbd();
else window.addEventListener("load", warmLbd);
// Unload the game (about:blank kills ALL its audio instantly), then immediately
// re-point it at the game so it re-boots silently in the background from HTTP
// cache — revisits are instant AND always start fresh at the title screen.
function resetLbd() {
  if (!lbdFrame) return;
  lbdStarted = false;
  lbdFrame.src = "about:blank";
  lbdFrame.dataset.loaded = "";
  setTimeout(warmLbd, 80);      // re-warm right after the unload commits
}
// Park the overlay exactly over the on-screen page rectangle (pre-LBD look).
function positionLbdStage() {
  if (!lbdStage) return;
  const r = flipScaleEl.getBoundingClientRect();   // the scaled 1280×720 page area
  lbdStage.style.left   = r.left   + "px";
  lbdStage.style.top    = r.top    + "px";
  lbdStage.style.width  = r.width  + "px";
  lbdStage.style.height = r.height + "px";
}
let lbdAnimTimer = null;
function setLbdFullscreen(on) {
  if (!lbdStage) return;
  lbdFullscreen = on;
  positionLbdStage();                        // make the inline page-rect geometry current
  lbdStage.classList.add("lbd-anim");        // turn the box-morph transition ON for this toggle
  void lbdStage.offsetWidth;                 // commit, so the class change below animates from here
  lbdStage.classList.toggle("fullscreen", on);   // expand to / shrink from full screen
  document.body.classList.toggle("lbd-fullscreen", on);
  clearTimeout(lbdAnimTimer);
  lbdAnimTimer = setTimeout(function () { lbdStage.classList.remove("lbd-anim"); }, 460);
}
// Show the overlay once we've fully landed on the LBD page, and tear it down the
// moment we leave. The game is already booted (background warm-up), so landing
// just REVEALS it — parked exactly over the page rectangle, its silent title
// screen looking like part of the book. It expands to fullscreen only when the
// game's own Play button is tapped (lbd-start, posted by its embed-bridge.js).
function updateLbdOverlay() {
  if (LBD_INDEX < 0 || !lbdStage) return;
  const onLbd = opened && ready && !animating && flipped === LBD_INDEX;
  if (onLbd) {
    ensureLbdLoaded();                    // safety net — normally warmed long before
    positionLbdStage();                   // park exactly over the on-screen page rect
    lbdStage.classList.add("visible");
    lbdStage.setAttribute("aria-hidden", "false");
    lbdWasOn = true;
    lbdExiting = false;                   // fresh arrival → a future "complete" may advance again
    clearTimeout(lbdAutoExitTimer);       // clear any stale auto-advance from a previous visit
    // The book's theme keeps playing under the parked (silent) title screen; it
    // pauses when the game starts its own copy of the theme (see lbd-start).
  } else if (!lbdFullscreen) {           // never hide mid-game (we can't leave while fullscreen)
    lbdStage.classList.remove("visible");
    lbdStage.setAttribute("aria-hidden", "true");
    if (lbdWasOn) {
      lbdWasOn = false;
      clearTimeout(lbdAutoExitTimer);     // drop any pending auto-advance
      resetLbd();                         // kill game audio instantly + silent re-warm for revisits
      if (opened && ready && !muted) playBgMusic();  // resume the book's music (not while closing to the cover)
    }
  }
}
// Game finished (or the temporary Skip was tapped): come back into the page, then
// automatically turn to the next page.
function exitLbd() {
  if (lbdExiting) return;
  lbdExiting = true;
  clearTimeout(lbdAutoExitTimer);         // this exit supersedes any pending auto-advance
  setLbdFullscreen(false);                // shrink the game back into the page
  setTimeout(function () {
    lbdExiting = false;
    if (flipped !== LBD_INDEX) return;
    unlockNext(LBD_INDEX);                // the game is FINISHED — open its Next gate…
    goNext();                             // …and auto-advance to the next story page
  }, 470);                                // just after the shrink transition (.4s)
}
// Listen for the game's messages.
//   • lbd-start        → the game's Play button was tapped (posted by the game's
//                        embed-bridge.js, capture-phase) → smoothly expand the
//                        parked overlay to true fullscreen.
//   • activity_complete→ the game finished all rounds (its own completeGame()).
//                        Let the happy-bots celebration show for a beat, then
//                        shrink the game away + auto-turn to the next page.
//   • lbd-complete     → immediate-exit path (kept for compatibility/skip flows).
window.addEventListener("message", function (e) {
  const d = e && e.data;
  if (!d) return;
  const t = d.type;
  if (d.source === "lbd" && t === "lbd-start") {
    if (!lbdStage || !lbdStage.classList.contains("visible")) return;  // only from the on-screen game
    lbdStarted = true;
    // The game starts ITS copy of the theme inside this same tap — pause the
    // book's copy so the track isn't doubled/echoed.
    try { bgMusic.pause(); } catch (_) {}
    setLbdFullscreen(true);
  }
  else if (t === "lbd-complete") { clearTimeout(lbdAutoExitTimer); exitLbd(); }
  else if (t === "activity_complete" && lbdFullscreen) {
    clearTimeout(lbdAutoExitTimer);
    lbdAutoExitTimer = setTimeout(exitLbd, LBD_CELEBRATE_MS);
  }
});

let opened = false;      // has the cover been opened?
let ready  = false;      // has the cover FINISHED opening? (flips allowed only then)
let flipped = 0;         // how many leaves are currently turned to the left
let animating = false;   // guard so a new turn can't start mid-flip
const FLIP_MS = 1150;    // keep in sync with --flip-ms in styles.css
const COVER_OPEN_MS = 6000;  // keep in sync with the coverOpen animation in styles.css
const CLOSE_SETTLE_MS = 560;  // keep in sync with the bookSettle animation in styles.css
const COVER_CLOSE_MS  = 2000; // Home/Replay: cover swings shut (reverse open); sync with coverClose in styles.css
let _openTimer = null;   // pending "cover finished opening" timer
let _homeTimer = null;   // pending "cover finished closing → back to the cover" timer

/* ---- Responsive: scale the FIXED 1280x720 book to fit the viewport --------
   The book stays internally 1280x720 and is ONLY transform-scaled, so the paper
   curl is never distorted. fitScale() has TWO jobs, in this order:

     1. RESERVE A REAL GUTTER. The controls' size is no longer guessed — the old
        hard-coded `CTRL = 64` was about half the real button height, which is
        how the book ended up sitting on top of the arrows. It is now MEASURED
        off #navMetrics, whose box is driven by the very --nav-btn / --nav-gap /
        --nav-edge the buttons themselves use. The BOOK shrinks so the controls
        always have room — never the other way round.

     2. PUBLISH the book's real rendered geometry on :root, so the controls can
        be placed against the BOOK instead of against the viewport. Two
        independent coordinate systems were the whole bug: on any viewport that
        wasn't 16:9 the viewport-anchored buttons drifted into the book.

   Called on load / resize / orientationchange via the existing onViewportChange
   listeners — no new listeners were added. */
const navProbe = document.createElement("div");      // see #navMetrics in styles.css
navProbe.id = "navMetrics";
navProbe.setAttribute("aria-hidden", "true");
document.body.appendChild(navProbe);

/* The live nav sizing, read straight out of CSS — ONE source of truth shared by
   the JS reservation below and the CSS placement of .corner-arrow, so the two
   can never disagree. The per-side edges already include env(safe-area-inset-*). */
function navMetrics() {
  const cs = getComputedStyle(navProbe);
  function px(v, dflt) { const f = parseFloat(v); return isFinite(f) ? f : dflt; }
  return {
    btn:    px(cs.width,         56),   // --nav-btn : the button box
    gap:    px(cs.height,        20),   // --nav-gap : guaranteed clear space
    top:    px(cs.paddingTop,    10),   // --nav-edge + safe-area, per side
    right:  px(cs.paddingRight,  10),
    bottom: px(cs.paddingBottom, 10),
    left:   px(cs.paddingLeft,   10)
  };
}

function fitScale() {
  // innerWidth/innerHeight ARE the dynamic viewport (they follow a collapsing
  // mobile URL bar), which is why the reservation below needs no vh/dvh maths.
  const W = window.innerWidth, H = window.innerHeight;
  const m = navMetrics();
  // Side gutter = safe edge + the button + the minimum clear gap. Both sides are
  // subtracted so the (centred) book stays symmetrical, and the widest side wins.
  const gutter = Math.max(m.left + m.btn + m.gap, m.right + m.btn + m.gap);
  const availW = Math.min(W * 0.88, W - 2 * gutter);   // soft cap, then the hard reservation
  // Vertical: the arrows live in the SIDE gutters, so the gutter above is what
  // keeps them off the book — no vertical reservation is needed for them. Only
  // the safe edge is kept clear top and bottom.
  const availH = Math.min(H * 0.80, H - 2 * Math.max(m.top, m.bottom));
  const s = Math.max(0.05, Math.min(availW / 1280, availH / 720));   // never collapse to 0
  flipScaleEl.style.setProperty("--book-scale", s.toFixed(4));
  publishBookBox(s);
  // keep the page-turn hint glued to the book's edge when the viewport changes
  if (flipHint && flipHint.classList.contains("show")) positionFlipHint();
}

/* Publish the book's on-screen rectangle as CSS custom properties on :root —
   .corner-arrow is positioned entirely from these. All four edges are viewport
   coordinates measured from the TOP-LEFT (so --book-bottom is a `top:` value).
   DERIVED from the scale rather than measured with getBoundingClientRect: the
   .scene entrance animation transiently transforms the real rect, and the arrows
   must not inherit that wobble. .flip-scale is centred on the viewport (its
   .stage/.scene ancestors are symmetrically padded), so this matches reality. */
function publishBookBox(s) {
  const W = window.innerWidth, H = window.innerHeight;
  const bw = 1280 * s, bh = 720 * s;                 // the book's REAL rendered size
  const l  = (W - bw) / 2, t = (H - bh) / 2;
  const root = document.documentElement.style;
  root.setProperty("--book-w",      bw.toFixed(1)       + "px");
  root.setProperty("--book-h",      bh.toFixed(1)       + "px");
  root.setProperty("--book-left",   l.toFixed(1)        + "px");
  root.setProperty("--book-right",  (l + bw).toFixed(1) + "px");
  root.setProperty("--book-top",    t.toFixed(1)        + "px");
  root.setProperty("--book-bottom", (t + bh).toFixed(1) + "px");
}

/* ---- Render / stacking for the CSS leaf flip ---------------------------- */
// A TURNED leaf sits to the left (rotateY -180deg, showing its blank back over
// the cover); an UN-turned leaf lies flat on top of the cover. z-index keeps the
// current (top un-turned) page in front, and stacks more-recently turned leaves
// above earlier ones on the left pile.
function updateZ() {
  leaves.forEach(function (leaf, i) {
    leaf.style.zIndex = (i < flipped) ? (200 + i) : (100 - i);
  });
}
function renderLeaves() {
  leaves.forEach(function (leaf, i) {
    if (i < flipped) leaf.classList.add("flipped");
    else             leaf.classList.remove("flipped");
    // GPU WINDOWING (re-run on every navigation): keep the current leaf, the
    // next one beneath it, and the top TWO of the turned pile rendered — the
    // second stays visible while the pile-top is mid-turn. Everything else is
    // guaranteed-occluded → .occluded releases its compositor layer
    // (visibility:hidden + will-change:auto in styles.css).
    leaf.classList.toggle("occluded", i < flipped - 2 || i > flipped + 1);
  });
  updateZ();
}

/* ---- Per-page media -----------------------------------------------------
   Play the CURRENT page's video (pause every other), and pop the current page's
   speech bubble in ONCE, only after the page has fully settled. Called after
   each flip completes and once the cover has finished opening. */
let mediaDelayTimer = null;   // pending "start this video after N ms" timer
let mediaDelayIdx = -1;       // which page that pending timer belongs to
let lastMediaIdx = -1;        // last page refreshMedia handled (to arm the blink once)
let armBlink = false;         // allow the video-end arrow blink ONCE per page arrival
let pageHintWatchdog = null;  // 3rd reveal path: arms the turn hint if ended/error never fire

function playVideoNow(v) {
  try {
    v.preload = "auto";                       // make sure it's buffering before we play
    if (v.ended) v.currentTime = 0;
    v.muted = false;                          // try WITH sound (primed in the Play gesture)
    const p = v.play();
    if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
  } catch (_) {}
}

/* Buffer ONE page's video on demand (only the current + next page are ever
   warmed, so we never spin up all 25 decoders at once). */
function warmVideo(i) {
  const leaf = leaves[i];
  if (!leaf) return;
  const v = leaf.querySelector("video.page-media");
  if (v && v.preload !== "auto") { v.preload = "auto"; try { v.load(); } catch (_) {} }
}

/* Unlock ONE page's video for instant, sound-enabled playback: a muted
   play()→pause() done INSIDE a user gesture. We prime only the page being shown
   and the next one — priming all 25 at once was the opening lag. */
function primeVideo(i) {
  const leaf = leaves[i];
  if (!leaf) return;
  const v = leaf.querySelector("video.page-media");
  if (!v || v.dataset.primed) return;
  v.dataset.primed = "1";
  try {
    v.muted = true; v.preload = "auto";
    const p = v.play();                       // start within the gesture → element is "activated"
    if (p && p.catch) p.catch(function () {});
    v.pause();                                // pause synchronously
    v.currentTime = 0;
  } catch (_) {}
}

function refreshMedia() {
  const idx = flipped;                         // the front-most page right now
  const isNewArrival = (idx !== lastMediaIdx); // first refreshMedia for this page?
  if (isNewArrival) { lastMediaIdx = idx; armBlink = true; }   // arm the video-end blink once per page
  // Left the page a delayed video was counting down on? Cancel that countdown.
  if (mediaDelayTimer && mediaDelayIdx !== idx) {
    clearTimeout(mediaDelayTimer); mediaDelayTimer = null; mediaDelayIdx = -1;
  }
  // Buffer + gesture-unlock ONLY this page and the next (so the upcoming flip is
  // instant and keeps sound) — never all 25 videos at once.
  warmVideo(idx); warmVideo(idx + 1); primeVideo(idx + 1);
  // Pause every video that is NOT the current page.
  leaves.forEach(function (leaf, i) {
    if (i === idx) return;
    const v = leaf.querySelector("video.page-media");
    if (v) { try { v.pause(); } catch (_) {} }
  });
  // Start (or schedule) the current page's video.
  const cur = leaves[idx];
  const v = cur && cur.querySelector("video.page-media");
  if (v) {
    const delayMs = (pages[idx] && pages[idx].delay) ? pages[idx].delay : 0;
    if (delayMs > 0) {
      // Already playing this page, or already counting down for it → leave it alone
      // (so the flip-start + flip-end calls don't restart the 3s countdown).
      if (mediaDelayIdx === idx && (mediaDelayTimer || !v.paused)) { /* keep going */ }
      else {
        try { v.pause(); v.currentTime = 0; } catch (_) {}   // hold on the first frame
        mediaDelayIdx = idx;
        mediaDelayTimer = setTimeout(function () {
          mediaDelayTimer = null;
          if (flipped === idx) playVideoNow(v);               // only if still on this page
        }, delayMs);
      }
    } else {
      playVideoNow(v);                          // no delay → instant
    }
  }
  const bub = cur && cur.querySelector(".bubble");
  if (bub && !bub.dataset.revealed) {           // reveal once — "for one time"
    bub.dataset.revealed = "1";
    bub.classList.add("revealed");
  }
  // Re-arm the video-gated Next arrow for the page we just arrived on
  // (forward or backward — every arrival re-locks a video/sequence page).
  if (isNewArrival) armNextGate(idx);
  // WATCHDOG (3rd reveal path, re-armed per page arrival): if this page's video
  // never fires `ended`/`error` (stalled decode, dead source), arm the turn hint
  // after its duration + 4s grace (30s when the duration is unknown).
  if (isNewArrival) {
    clearTimeout(pageHintWatchdog);
    if (v && flipped < totalPages - 1) {
      const wdMs = ((isFinite(v.duration) && v.duration > 0) ? v.duration * 1000 + 4000 : 30000) +
                   ((pages[idx] && pages[idx].delay) ? pages[idx].delay : 0);
      pageHintWatchdog = setTimeout(function () {
        if (flipped !== idx || !armBlink) return;
        if (!opened || !ready || lbdFullscreen) return;
        armBlink = false;
        if (typeof armFlipHint === "function") armFlipHint();
      }, wdMs);
    }
  }
  updateLbdOverlay();                           // show/hide the embedded LBD game
  // Special pages (hotspots / sequence): enter on ARRIVAL, reset when we're elsewhere,
  // and pre-buffer (warm) the one sitting on the very next page.
  Object.keys(specialCtrls).forEach(function (k) {
    const i = +k, c = specialCtrls[k];
    if (i === idx) { if (isNewArrival) c.enter(); }
    else { c.leave(); if (c.warm && i === idx + 1) c.warm(); }
  });
  // Right-side page stack shrinks toward the end: 3 sheets → … → 0 on the last page.
  if (pageStackEl) pageStackEl.dataset.count = String(Math.max(0, Math.min(3, totalPages - 1 - flipped)));
  // Restart the idle → page-turn-hint countdown for the page we've just landed on
  // (uses the NEW `flipped`, so the delay is right: 5s on page 1, 10s afterwards).
  if (typeof resetIdleHint === "function") resetIdleHint();
}

/* ---- Navigation (drives the CSS leaf flip) ------------------------------ */
function turnLeaf(leaf) {                 // shared flip visuals + timing
  leaf.style.zIndex = 300;               // lift the turning sheet above everything
  leaf.classList.add("flipping");        // enables the moving curl shading
  renderLeaves();
  refreshMedia();                        // START now → the target video plays INSTANTLY
                                          // (as the page is revealed, not after the flip)
  playFlip();
  updateProgress();
  setTimeout(function () {
    leaf.classList.remove("flipping");
    animating = false; updateZ(); updateProgress();
    refreshMedia();                      // re-assert once settled (idempotent safety net)
  }, FLIP_MS + 40);
}
function goNext() {
  if (!opened || !ready || animating) return;   // wait until the cover has fully opened
  if (lbdFullscreen) return;                     // never flip the book under the fullscreen game
  if (nextLocked) return;                        // video gate — keyboard/programmatic calls respect it too
  if (flipped >= totalPages - 1) return;         // already on the LAST page (THE END)
  animating = true;
  const leaf = leaves[flipped];                  // the page to turn
  flipped++;
  turnLeaf(leaf);
}
function goPrev() {
  if (!opened || !ready || animating) return;   // wait until the cover has fully opened
  if (lbdFullscreen) return;              // never flip the book under the fullscreen game
  if (flipped <= 0) return;               // already on the first page
  animating = true;
  flipped--;
  turnLeaf(leaves[flipped]);
}

/* ==========================================================================
   GATED NEXT  —  the Next arrow is HIDDEN (not just greyed) until the page has
   given up everything it has to give:
     • "video"    pages → until the page video finishes.
     • "sequence" pages → until the INTERACTION finishes (intro plays, reader
                          taps the hotspot, the reveal clip ends) — see revealDone.
     • "hotspots" page  → until EVERY shape has been tapped and played.
     • "lbd" (game)     → until the game reports it is COMPLETE (see exitLbd);
                          there is no "watch it out" here, the reader must play.
   Armed on every FIRST arrival at a page — but a page that has already been
   finished once is never re-gated (see `pageDone`), so going BACK to re-read
   an earlier page shows Back AND Next immediately: nobody is made to sit
   through a video, an interaction or a game they already completed.
   ⚠ Never gated on `ended` alone — a broken/stalled video or a dead hotspot
   would trap the reader on the page forever. THREE unlock paths, whichever
   fires first:
     (a) the video's `ended`   (makeMedia / revealDone / the last stepDone)
     (b) the video's `error`   (same wiring)
     (c) a watchdog — duration + ~4s grace on plain video pages; on interaction
         pages a generous idle grace that is RE-ARMED by bumpNextGate() after
         every completed step, so an engaged reader never trips it early while
         an idle/stuck one still escapes. On the GAME page the watchdog is a
         load-failure escape hatch only — it stands down while the game is
         actually being played (see lbdGateFallback).
   Keyboard / swipe / programmatic goNext() respect the same lock (guards in
   goNext and the drag decider). Pages with nothing to wait on (THE END) are
   never locked; Back + Home stay usable throughout.
   ========================================================================== */
const GATED_PAGE_TYPES = { video: 1, sequence: 1, hotspots: 1, lbd: 1 };
const GATE_IDLE_GRACE_MS = 75000;   // interaction pages: safety unlock after this much inactivity
const LBD_GATE_FALLBACK_MS = 90000; // game page: escape hatch ONLY while the game never started
let nextLocked = false;        // is the CURRENT page's Next gate closed?
let nextLockPage = -1;         // which page the gate belongs to (stale-unlock guard)
let nextGateWatchdog = null;   // unlock path (c)
// Pages whose gate has already been satisfied. Finished stays finished for the
// whole read — cleared only by resetToStart() (Home / Replay = a fresh read).
const pageDone = Object.create(null);

function unlockNext(idx) {
  if (idx !== undefined && idx !== nextLockPage) return;   // unlock from a page we already left
  clearTimeout(nextGateWatchdog);
  if (nextLockPage >= 0) pageDone[nextLockPage] = 1;       // done once → never gated again
  if (!nextLocked) return;
  nextLocked = false;
  updateProgress();
  pulseNext();                   // the arrow just APPEARED — glow-pulse it into view
}
// (c) — arm/re-arm the safety watchdog for the page that owns the gate.
function gateWatchdog(idx, ms) {
  clearTimeout(nextGateWatchdog);
  if (!nextLocked || idx !== nextLockPage) return;
  nextGateWatchdog = setTimeout(function () { unlockNext(idx); }, ms);
}
// Called by the interaction controllers whenever the reader makes PROGRESS (a
// shape played, the hotspot tapped): pushes the safety unlock back out of the way.
function bumpNextGate() { gateWatchdog(flipped, GATE_IDLE_GRACE_MS); }
// The GAME page has no time-based unlock: Next appears only when the game itself
// reports completion. This watchdog exists purely so a game that never BOOTS
// can't dead-end the story — it re-arms itself (instead of unlocking) for as long
// as the child is actually playing, so a slow player is never handed a skip arrow.
function lbdGateFallback(idx) {
  clearTimeout(nextGateWatchdog);
  if (!nextLocked || idx !== nextLockPage) return;
  nextGateWatchdog = setTimeout(function () {
    if (lbdStarted || lbdFullscreen) { lbdGateFallback(idx); return; }  // being played → gate stays shut
    unlockNext(idx);                                                     // never even started → let them past
  }, LBD_GATE_FALLBACK_MS);
}
// Called from refreshMedia on every NEW page arrival (forward or backward).
function armNextGate(idx) {
  clearTimeout(nextGateWatchdog);
  nextLockPage = idx;
  const page = pages[idx];
  const gated = !!page && !!GATED_PAGE_TYPES[page.type] && idx < totalPages - 1
                && !pageDone[idx];                    // already finished → stays open on revisits
  nextLocked = gated;
  updateProgress();
  if (!gated) return;
  const leaf = leaves[idx];
  if (page.type === "video") {
    // duration + 4s grace when known, 30s when not, plus any pre-play delay.
    const v = leaf && leaf.querySelector("video.page-media");
    const base = (v && isFinite(v.duration) && v.duration > 0) ? v.duration * 1000 + 4000 : 30000;
    gateWatchdog(idx, base + (page.delay || 0));
  } else if (page.type === "lbd") {
    lbdGateFallback(idx);                    // completion-only gate (+ never-booted escape hatch)
  } else {
    // Interaction page: whatever auto-plays on arrival (the sequence intro) plus
    // the idle grace — then re-armed per completed step by bumpNextGate().
    const v = leaf && leaf.querySelector("video");
    const base = (v && isFinite(v.duration) && v.duration > 0) ? v.duration * 1000 : 0;
    gateWatchdog(idx, base + GATE_IDLE_GRACE_MS);
  }
}

/* ---- Nav state (page counter removed) ----------------------------------- */
function updateProgress() {
  // Both arrows are HIDDEN rather than greyed whenever they can't be used, so the
  // reader is never offered a dead control (.is-hidden → display:none in styles.css).
  const noBack = !ready || flipped <= 0;                    // page 1 / cover: nothing to go back to
  const noNext = !ready || flipped >= totalPages - 1        // THE END: nothing to go forward to
                 || nextLocked;                             // gate still closed (see armNextGate)
  if (cornerPrev) { cornerPrev.disabled = noBack; cornerPrev.classList.toggle("is-hidden", noBack); }
  if (cornerNext) {
    cornerNext.disabled = noNext;
    cornerNext.classList.toggle("is-hidden", noNext);
    // Hiding the arrow (display:none) CANCELS a running animation WITHOUT firing
    // animationend — so drop the one-shot class here too, or a half-played pulse
    // would come back to life the next time the arrow appears (on a page that
    // never earned it). Belt and braces with the animationend handler below.
    if (noNext) cornerNext.classList.remove("glow-pulse");
  }
}

/* "You can go on now" cue: the moment a gate opens and the Next arrow appears
   (video ended, interaction finished, game completed) it pulses twice with a
   gold glow and then settles back to its normal look. One-shot — the class is
   stripped on animationend so the NEXT appearance can play it again. Called
   only from unlockNext, so it never fires on a page that was already open
   (revisits to a finished page just show the arrow, quietly). */
function pulseNext() {
  if (!cornerNext || cornerNext.disabled || cornerNext.classList.contains("is-hidden")) return;
  cornerNext.classList.remove("glow-pulse");
  void cornerNext.offsetWidth;            // reflow → restart the one-shot from the top
  cornerNext.classList.add("glow-pulse");
}
if (cornerNext) {
  cornerNext.addEventListener("animationend", function (e) {
    // the glyph's own arrowFadeIn bubbles up here too — only clear our own class
    if (e.animationName === "arrowGlowPulse") cornerNext.classList.remove("glow-pulse");
  });
}

/* ---- Open the 3D cover, then hand off to the page-turning book ----------
   Shared by the first open (openBook) AND Replay (replayBook), so the dramatic
   hinge-open + post-open setup are identical both times. */
function runOpenSequence() {
  ready = false;
  document.body.classList.remove("is-closing");
  document.body.classList.add("is-open");
  // The whole open motion IS the cover's own hinge — NO zoom / camera move.
  book.classList.remove("closing");
  book.classList.add("open");          // cover hinges open on the LEFT spine
  bookFloat.classList.add("rest");     // stop the idle bob
  coverScene.classList.remove("parked");
  flipbookEl.style.zIndex = "";        // cover ABOVE the pages while it swings open
  // Reveal the REAL page right away (it sits beneath the cover, masked by it).
  flipbookEl.classList.add("show");
  // A user gesture drives every open, so start audio here.
  soundOn();
  resumeAudio();
  playCoverFlip();
  playBgMusic();                        // start the looping background music
  primeVideo(0); primeVideo(1);         // unlock page 1 + 2 inside the gesture
  refreshMedia();                       // start the page-1 video right away
  // Once the cover has FULLY opened, park it, lift the pages above it, hand over
  // pointer events, and mark the book READY.
  clearTimeout(_openTimer);
  _openTimer = setTimeout(function () {
    coverScene.classList.add("parked");
    flipbookEl.style.zIndex = "5";        // pages now sit ABOVE the parked cover (z3)
    tapCatcher.style.pointerEvents = "none";
    flipbookEl.style.pointerEvents = "auto";
    ready = true;
    updateProgress();
    refreshMedia();
    resetIdleHint();
  }, COVER_OPEN_MS + 50);
  updateProgress();
}
/* ---- Enter / leave TRUE browser fullscreen. Requested straight from the Play
   tap (a user gesture, required by the Fullscreen API) so every page after the
   cover fills the whole screen. Vendor-prefixed for Safari; silently ignored
   where fullscreen is unsupported (e.g. iPhone Safari has no element FS). ---- */
function goFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen ||
              el.mozRequestFullScreen || el.msRequestFullscreen;
  if (!req) return;
  try { const p = req.call(el); if (p && p.catch) p.catch(function () {}); } catch (_) {}
}
function exitFullscreen() {
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement ||
               document.mozFullScreenElement || document.msFullscreenElement;
  if (!fsEl) return;
  const exit = document.exitFullscreen || document.webkitExitFullscreen ||
               document.mozCancelFullScreen || document.msExitFullscreen;
  if (!exit) return;
  try { const p = exit.call(document); if (p && p.catch) p.catch(function () {}); } catch (_) {}
}

function openBook() {
  console.log("[The Story Night] openBook() called — opened was:", opened);
  if (opened) return;
  // GATE ON THE PRELOADER: the Play button is hidden until every asset is
  // fetched, and this guard makes keyboard / programmatic starts wait too.
  if (window.PRELOAD && !window.PRELOAD.done) return;
  opened = true;
  goFullscreen();          // from the next page on, run in full screen
  runOpenSequence();
}

/* ---- Reset the whole book to the START SCREEN: the CLOSED FRONT COVER + Play
   button, exactly like a fresh load (so tapping Play reads from the top). Shared
   by Replay and Home (called once the closing swing has finished). --------- */
function resetToStart() {
  ready = false; opened = false; flipped = 0;
  updateLbdOverlay();                          // any path back to the cover tears the game down
  renderLeaves();
  leaves.forEach(function (leaf) {
    var vv = leaf.querySelector("video.page-media");
    if (vv) { try { vv.pause(); vv.currentTime = 0; } catch (_) {} }
  });
  Object.keys(specialCtrls).forEach(function (k) { specialCtrls[k].leave(); });   // reset all special pages
  lastMediaIdx = -1;
  // Back on the cover = a fresh read: every page has to earn its Next arrow again.
  Object.keys(pageDone).forEach(function (k) { delete pageDone[k]; });
  document.body.classList.remove("is-open", "is-closing");
  book.classList.remove("open", "closing");
  coverScene.classList.remove("parked");
  cover.style.transform = "";                 // cover CLOSED → front cover + Play button showing
  flipbookEl.classList.remove("show");         // pages hidden behind the closed cover
  flipbookEl.style.zIndex = "";
  flipbookEl.style.pointerEvents = "none";
  bookFloat.classList.remove("rest");          // resume the idle bob
  tapCatcher.style.pointerEvents = "auto";     // Play is tappable again
  hideFlipHint(); clearTimeout(idleHintTimer); clearTimeout(nudgeHideTimer);
  try { bgMusic.pause(); bgMusic.currentTime = 0; } catch (_) {}   // stop music; restarts on Play
  exitFullscreen();                            // back to the cover → leave full screen
  updateProgress();                            // hides the progress read-out (not opened)
}

/* ---- CLOSE THE BOOK: the cover swings SHUT — the exact REVERSE of the opening
   hinge (cover −180 → 0) — and the book lands on the front cover. Driven by
   REPLAY (from THE END page). `afterReset` runs once we're back on the cover.
   ------------------------------------------------------------------------- */
function closeBookToCover(afterReset) {
  ready = false;                               // block flips during the close
  updateLbdOverlay();                          // closing from the game page → hide + reset the overlay
                                               // (ready=false, so it can't re-show or resume music)
  clearTimeout(_openTimer);
  clearTimeout(_homeTimer);
  hideFlipHint(); clearTimeout(idleHintTimer); clearTimeout(nudgeHideTimer);
  if (cornerNext) cornerNext.classList.remove("blink", "blink1", "glow-pulse");
  var v = currentVideo(); if (v) { try { v.pause(); } catch (_) {} }
  // pages back UNDER the cover, so the closing cover sweeps over them
  flipbookEl.style.zIndex = "";
  flipbookEl.style.pointerEvents = "none";
  tapCatcher.style.pointerEvents = "none";
  coverScene.classList.remove("parked");
  // CLOSE — reverse of the opening hinge (cover swings from -180 back to 0).
  // is-closing keeps the current page bright (hides the dark thickness block) and
  // hides the turned-page pile, so the cover folds cleanly with no stray left page.
  document.body.classList.add("is-closing");
  book.classList.remove("open");
  book.classList.add("closing");
  playCoverFlip();
  _homeTimer = setTimeout(function () {
    resetToStart();
    if (typeof afterReset === "function") afterReset();
  }, COVER_CLOSE_MS + 60);
}

/* ---- REPLAY (button on THE END page): close the book with the reverse-of-open
   swing, land on the front cover, and re-arm the title VO for another read. */
function replayBook() {
  if (!opened || animating) return;
  closeBookToCover(function () { _titleVoPlayed = false; playTitleVo(); });
}

/* (goHome() was removed with the Home button — it had no other caller. Replay
   still reaches the cover through closeBookToCover() above.) */

/* ==========================================================================
   INPUT  —  tap PLAY to OPEN the cover; once open, drag + corner arrows +
   keyboard drive the page flip.
   ========================================================================== */
const tapCatcher = document.getElementById("tapCatcher");

// The book opens ONLY from the play button. The tap-catcher still sits on top to
// block page gestures before opening, but it opens the book only when the tap
// lands inside the play button's (breathing) hit-circle — taps elsewhere on the
// cover do nothing.
function tapHitsPlay(e) {
  const r = hint.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const rad = Math.max(r.width, r.height) / 2;
  return Math.hypot(e.clientX - cx, e.clientY - cy) <= rad;
}
if (tapCatcher) tapCatcher.addEventListener("click", function (e) { if (!opened && tapHitsPlay(e)) openBook(); });
// Show the hand (pointer) cursor ONLY when hovering the play button — the sole CTA
// on the cover. Everywhere else on the tap surface stays a normal cursor.
if (tapCatcher) tapCatcher.addEventListener("mousemove", function (e) {
  tapCatcher.style.cursor = (!opened && tapHitsPlay(e)) ? "pointer" : "default";
});

// The play button itself (also covers keyboard: Enter/Space on the focused button).
hint.addEventListener("click", function (e) { e.stopPropagation(); if (!opened) openBook(); });

// Bottom-corner flip arrows (outside the book): back = left, forward = right.
cornerPrev.addEventListener("click", function (e) { e.stopPropagation(); goPrev(); this.blur(); });
cornerNext.addEventListener("click", function (e) { e.stopPropagation(); goNext(); this.blur(); });
if (replayBtn) replayBtn.addEventListener("click", function (e) { e.stopPropagation(); replayBook(); this.blur(); });

// Page interaction — DRAG TO TURN: grab the page and it follows your cursor,
// rotating about the spine, then SNAPS to the nearest state when you let go.
//   • drag LEFT  → turn the current page forward (it comes to rest on the cover)
//   • drag RIGHT → turn the previous page back
// A plain tap does nothing; the corner arrows + keyboard still work.
(function () {
  let startX = 0, startY = 0, pw = 1;
  let leaf = null, dir = 0, decided = false, dragging = false, curlEl = null;
  let lastX = 0, lastT = 0, vx = 0;                   // for flick (velocity) detection
  const DECIDE = 6;                                   // px before we commit to a drag
  const FLICK = 0.45;                                 // px/ms — a quick flick completes the turn
  const FINISH_DEG = 45;                              // turned this far (deg) → completes on release

  // how many degrees the drag has turned the page (0..180)
  function degFromDx(dx) { return Math.max(0, Math.min(180, Math.abs(dx) / pw * 180)); }
  // the live angle for the active leaf, given the raw horizontal travel
  function liveAngle(dx) {
    return (dir === 1) ? degFromDx(Math.min(0, dx))          // forward: leftward turns 0→180
                       : 180 - degFromDx(Math.max(0, dx));   // back: starts at 180, rightward → 0
  }

  flipbookEl.addEventListener("pointerdown", function (e) {
    if (!opened || !ready || animating) return;
    startX = e.clientX; startY = e.clientY;
    lastX = e.clientX; lastT = e.timeStamp || performance.now(); vx = 0;
    decided = false; dragging = true; leaf = null; dir = 0; curlEl = null;
    pw = flipbookEl.getBoundingClientRect().width || 1;
  });

  flipbookEl.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const now = e.timeStamp || performance.now();
    const dt = now - lastT;
    if (dt > 0) vx = (e.clientX - lastX) / dt;         // running horizontal velocity
    lastX = e.clientX; lastT = now;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < DECIDE || Math.abs(dx) <= Math.abs(dy)) return;   // wait for a clear horizontal drag
      if (dx < 0 && flipped < totalPages - 1 && !nextLocked) { dir = 1;  leaf = leaves[flipped]; }  // turn forward (video gate + THE END stop)
      else if (dx > 0 && flipped > 0)         { dir = -1; leaf = leaves[flipped - 1]; } // turn back
      else { dragging = false; return; }                  // nothing to turn that way
      decided = true;
      leaf.style.transition = "none";                     // follow the finger exactly
      leaf.style.zIndex = 300;
      leaf.classList.add("dragging");                     // never GPU-cull / hide a leaf mid-drag
      curlEl = leaf.querySelector(".curl");
      try { flipbookEl.setPointerCapture(e.pointerId); } catch (_) {}
    }
    const ang = Math.max(0, Math.min(180, liveAngle(dx)));
    leaf.style.transform = "rotateY(" + (-ang) + "deg)";
    if (curlEl) curlEl.style.opacity = (ang <= 90 ? ang / 90 : (180 - ang) / 90) * 0.9;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    const L = leaf, D = dir, C = curlEl;
    leaf = null; curlEl = null;
    if (!decided || !L) return;                           // a plain tap → nothing

    const ang = Math.max(0, Math.min(180, liveAngle(e.clientX - startX)));
    // Complete the turn if it's been dragged far enough OR flicked quickly in
    // the turn's direction — no need to drag all the way past halfway.
    const flick = (D === 1) ? (vx < -FLICK) : (vx > FLICK);
    const complete   = (D === 1) ? (ang > FINISH_DEG || flick)
                                 : (ang < 180 - FINISH_DEG || flick);
    const endFlipped = (D === 1) ? complete   : !complete;    // does this leaf end up turned?

    animating = true;
    if (C) C.style.opacity = "";
    if (complete) { playFlip(); flipped += (D === 1) ? 1 : -1; }
    // Lock in the resting classes + z-index NOW (so nothing pops in later), then
    // animate the inline transform from the dragged angle to the target. The
    // .flipped class already holds the same final angle underneath.
    L.style.transition = "";                              // restore the CSS flip transition
    void L.offsetWidth;                                   // reflow so it animates FROM the dragged angle
    L.classList.remove("dragging");                       // hand over to .flipping (added next)
    L.classList.add("flipping");                          // curl shading during the snap
    renderLeaves();                                       // apply .flipped + z-index immediately
    refreshMedia();                                       // START the target video INSTANTLY
    L.style.transform = endFlipped ? "rotateY(-180deg)" : "rotateY(0deg)";
    updateProgress();

    setTimeout(function () {
      L.classList.remove("flipping");
      // Drop the inline transform WITHOUT re-animating: the .flipped class already
      // holds the final angle, so disabling the transition for this swap prevents
      // the leaf from briefly swinging back (the "page reappears on the left" glitch).
      L.style.transition = "none";
      L.style.transform = "";
      void L.offsetWidth;                                 // commit with no transition
      L.style.transition = "";                            // restore for the next turn
      animating = false; updateProgress();
      refreshMedia();                                     // re-assert once settled (idempotent safety net)
    }, FLIP_MS + 40);
  }
  flipbookEl.addEventListener("pointerup", endDrag);
  flipbookEl.addEventListener("pointercancel", endDrag);
})();

window.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight") { e.preventDefault(); opened ? goNext() : openBook(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
  else if ((e.key === " " || e.key === "Enter") && !opened) { e.preventDefault(); openBook(); }
});

// Keep the canvas scaled to fit on resize / rotate.
let _resizeSettle = null;
function onViewportChange() {
  // Suppress the page-turn transitions while the viewport is actively changing, so
  // a rapid resize / resolution change can't make the book LOOK like it's auto-
  // flipping (the leaves re-render during the scale change). Restored once settled.
  document.body.classList.add("is-resizing");
  clearTimeout(_resizeSettle);
  _resizeSettle = setTimeout(function () { document.body.classList.remove("is-resizing"); }, 220);
  fitScale();
  // Re-park the LBD overlay over the (re-scaled) page — unless it's fullscreen,
  // where it already fills the viewport via CSS.
  if (lbdStage && lbdStage.classList.contains("visible") && !lbdFullscreen) positionLbdStage();
}
window.addEventListener("resize", onViewportChange);
window.addEventListener("orientationchange", onViewportChange);

/* ---- Block ALL zoom (pinch, double-tap, ctrl+wheel, ctrl +/-) ------------
   The book is fixed-layout, so zoom would only break it. */
(function () {
  // Never let anything (esp. page images) start a native HTML5 drag — that was
  // showing a "ghost" of the image following the cursor during a page-flip drag.
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) {   // iOS pinch
    document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false });
  });
  window.addEventListener("wheel", function (e) {                          // desktop ctrl+wheel
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });
  window.addEventListener("keydown", function (e) {                        // ctrl/⌘ +/-/0
    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].indexOf(e.key) !== -1) e.preventDefault();
    // Block "Save page" (Ctrl/⌘+S) — a casual way to grab the media.
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) e.preventDefault();
  });
  document.addEventListener("touchmove", function (e) {                    // 2-finger pinch
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // NOTE: the right-click / context menu is intentionally LEFT ENABLED (so "Inspect"
  // and dev tools work). Casual image protection still stands via CSS — no drag,
  // no text-selection, no iOS long-press "Save Image" callout — plus Ctrl+S is blocked.
})();

/* ==========================================================================
   SOUND  —  real audio files in sfx/: Page flip.ogg (every page flip),
   cover page flip.ogg (the cover opening), and the game's ThemeMusic.ogg as the
   looping background music at 20% volume. All muted until the book is opened
   (a user gesture). Ogg/Opus: Chrome/Edge/Firefox + recent Safari (17+).
   ========================================================================== */
let muted = true;

/* ---- Title voice-over — REMOVED ------------------------------------------
   The old element pointed at sfx/the story night.ogg, which is not shipped: it
   404'd on EVERY load and its play() always failed silently (a leftover from
   the "Story Night" theme). Stubs are kept so Replay's re-arm keeps working;
   to bring a title VO back, restore the old block with a real clip in sfx/. */
let _titleVoPlayed = false;
function playTitleVo() {}

// Looping BACKGROUND MUSIC — the SAME theme track the "Power Up, Bots!" game uses,
// at 20% volume. Started on open (a user gesture) so the browser allows it with sound.
// (While the game overlay is on screen we PAUSE this copy so the game's own theme
// isn't doubled/echoed — see updateLbdOverlay.)
const bgMusic = new Audio("PowerUp-Bots-main/story/audios/ThemeMusic.ogg");
bgMusic.loop = true;
bgMusic.volume = 0.20;                      // 20% volume, per request
// preload="none": the preloader fetches the track and feeds the blob below —
// preload="auto" here would double-download it.
bgMusic.preload = "none";
if (window.PRELOAD) PRELOAD.register(bgMusic, "PowerUp-Bots-main/story/audios/ThemeMusic.ogg");
function playBgMusic() {
  try {
    const p = bgMusic.play();
    if (p && p.catch) p.catch(function () {});   // ignore autoplay rejections
  } catch (_) {}
}

/* ---- Pause ALL audio when the tab / window goes to the background -----------
   Background music AND the current page's video (its voice-over) must stop the
   moment the reader switches tab or app, and resume when they come back — they
   were continuing to play in the background. Covers visibilitychange (tab switch),
   blur (other window), and pagehide (mobile app switch / bfcache). */
let _bgWasPlaying = false;
function currentVideo() {
  const leaf = leaves[flipped];
  if (!leaf) return null;
  const pm = leaf.querySelector("video.page-media");
  if (pm) return pm;
  // Special pages (hotspots / sequence) hold one or more overlay videos. Return the
  // one that's actually playing (so tab-blur pauses it), else the visible one.
  const vids = leaf.querySelectorAll("video");
  for (let i = 0; i < vids.length; i++) if (!vids[i].paused) return vids[i];
  for (let i = 0; i < vids.length; i++) if (vids[i].classList.contains("show")) return vids[i];
  return vids[0] || null;
}
function pauseAllAudioFB() {
  if (!bgMusic.paused) { _bgWasPlaying = true; try { bgMusic.pause(); } catch (_) {} }
  const v = currentVideo();
  if (v && !v.paused) { v.dataset.wasPlaying = "1"; try { v.pause(); } catch (_) {} }
  if (audioCtx && audioCtx.state === "running") { try { audioCtx.suspend(); } catch (_) {} }
}
function resumeAllAudioFB() {
  if (document.hidden || !document.hasFocus()) return;   // only when truly back in front
  if (!opened) return;                                   // nothing plays before the book opens
  if (audioCtx && audioCtx.state === "suspended") { try { audioCtx.resume(); } catch (_) {} }
  if (_bgWasPlaying) { _bgWasPlaying = false; playBgMusic(); }
  const v = currentVideo();
  if (v && v.dataset.wasPlaying && !v.ended) { delete v.dataset.wasPlaying; const p = v.play(); if (p && p.catch) p.catch(function () {}); }
}
document.addEventListener("visibilitychange", function () {
  if (document.hidden) pauseAllAudioFB(); else resumeAllAudioFB();
});
window.addEventListener("blur", pauseAllAudioFB);
window.addEventListener("focus", resumeAllAudioFB);
window.addEventListener("pagehide", pauseAllAudioFB);

/* ---- One-shot SFX via Web Audio (glitch-free, zero-latency) --------------
   An <audio> element pays a real first-play init cost and can stutter on short
   one-shots — that was the cover-flip "lag/glitch". Instead we decode each SFX
   ONCE into an AudioBuffer and play it through a BufferSource: sample-accurate,
   no start latency. Any leading silence baked into the mp3 is auto-skipped (we
   start on the first audible sample). Buffers come from base64 data URIs
   (window.SFX_DATA in sfx-data.js) so they decode even on file://, where fetch()
   of a plain path is blocked. If Web Audio is unavailable we fall back to plain
   <audio> elements (the old behaviour). */
let audioCtx = null;
const sfxBuf = {};                          // name -> { buffer, offset (seconds) }

// Fallback <audio> elements — used ONLY if Web Audio fails to init or decode.
// preload="none": they are rarely-used fallbacks, so they must not cost a
// download up front — the preloader feeds them blob: URLs once fetched.
const flipSound = new Audio("sfx/Page%20flip.ogg");
flipSound.preload = "none";
const coverFlipSound = new Audio("sfx/cover%20page%20flip.ogg");
coverFlipSound.preload = "none";
coverFlipSound.volume = 0.35;
if (window.PRELOAD) {
  PRELOAD.register(flipSound, "sfx/Page%20flip.ogg");
  PRELOAD.register(coverFlipSound, "sfx/cover%20page%20flip.ogg");
}

(function initSfx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  const DATA = window.SFX_DATA || {};
  if (!AC || !DATA.cover) return;           // no Web Audio / no inlined data → fallback
  try { audioCtx = new AC(); } catch (_) { audioCtx = null; return; }
  function decode(name, uri) {
    fetch(uri).then(function (r) { return r.arrayBuffer(); })
      .then(function (a) { return audioCtx.decodeAudioData(a); })
      .then(function (buf) {
        // Skip any leading silence so playback starts right on the transient.
        const ch = buf.getChannelData(0), sr = buf.sampleRate, thr = 0.008;
        let first = 0;
        for (let i = 0; i < ch.length; i++) { if (Math.abs(ch[i]) > thr) { first = i; break; } }
        sfxBuf[name] = { buffer: buf, offset: Math.max(0, first / sr - 0.004) };
      })
      .catch(function () {});               // leave name unset → falls back to <audio>
  }
  decode("cover", DATA.cover);
  decode("flip", DATA.flip);
})();

// The audio context starts suspended until a user gesture. Resume it on the first
// pointer press (fires just BEFORE the open click) so the cover-flip sound, played
// a moment later, is instant. Capture phase, not once (cheap + always safe).
function resumeAudio() {
  if (audioCtx && audioCtx.state === "suspended") { try { audioCtx.resume(); } catch (_) {} }
}
document.addEventListener("pointerdown", resumeAudio, { capture: true });

// Play a decoded SFX buffer; returns false if Web Audio isn't ready (→ caller
// falls back to the <audio> element).
function playSfx(name, vol, rate) {
  const entry = sfxBuf[name];
  if (!audioCtx || !entry) return false;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const src = audioCtx.createBufferSource();
    src.buffer = entry.buffer;
    if (rate) src.playbackRate.value = rate;
    const g = audioCtx.createGain();
    g.gain.value = (vol == null ? 1 : vol);
    src.connect(g).connect(audioCtx.destination);
    src.start(0, entry.offset || 0);        // start on the first audible sample
    return true;
  } catch (_) { return false; }
}

// Page-flip sound — snappy 1.5× on every ordinary flip.
function playFlip() {
  if (muted) return;                        // sound turns on when the book opens
  if (playSfx("flip", 1.0, 1.5)) return;    // Web Audio path
  try {                                     // fallback
    flipSound.currentTime = 0; flipSound.playbackRate = 1.5;
    const p = flipSound.play(); if (p && p.catch) p.catch(function () {});
  } catch (_) {}
}
// COVER-page flip sound — played ONLY when the cover opens (never on page flips).
function playCoverFlip() {
  if (muted) return;
  if (playSfx("cover", 0.35)) return;       // Web Audio path
  try {                                     // fallback
    coverFlipSound.currentTime = 0;
    const p = coverFlipSound.play(); if (p && p.catch) p.catch(function () {});
  } catch (_) {}
}
// Turn sound ON when the book is opened (a clear user gesture). Safe to call
// repeatedly.
function soundOn() {
  muted = false;                     // opening the book turns sound on
}


/* ==========================================================================
   PAGE-TURN HINT  —  guidance for readers who don't know how to turn the page.
   When idle, two cues fire together: a hand taps the forward arrow AND the page
   itself does a "ghost" half-flip (lifts toward the next page, then falls back).
   Timing: PAGE 1 after 5s, every later page after 10s of no interaction; repeats
   while idle and is cancelled by any tap / key / flip. Never on the last page or
   while the LBD game is open.
   ========================================================================== */
// The nudge is a HAND on the RIGHT side of the book (assets/handNudge.webp);
// if that image ever fails to load, an emoji hand stands in (the <img> error
// handler swaps to it).
let flipHint = document.createElement("img");
flipHint.className = "flip-hint";
flipHint.setAttribute("aria-hidden", "true");
flipHint.alt = "";
flipHint.decoding = "async";
flipHint.src = "assets/handNudge.webp?v=3";
flipHint.addEventListener("error", function () {
  const el = document.createElement("div");
  el.className = "flip-hint flip-hint--emoji";
  el.setAttribute("aria-hidden", "true");
  el.textContent = "👆";
  if (flipHint.parentNode) flipHint.parentNode.replaceChild(el, flipHint);
  flipHint = el;                 // later show/position calls use the swapped-in element
}, { once: true });
document.body.appendChild(flipHint);

// Flip-tutorial timing. The tutorial is ARMED when a page's video ends; it then
// appears HINT_DELAY (5s) later, and that 5s wait RESETS on every interaction — so
// the reader gets a moment after the video, and 5s of quiet after any tap/flip,
// before the "turn the page" nudge shows. It plays ~2s, then repeats every 9s idle.
const HINT_DELAY    = 5000;    // wait after the video ends / after an interaction
const NUDGE_SHOW_MS = 2000;    // how long one nudge stays on screen
const NUDGE_GAP_MS  = 9000;    // gap after it disappears before it plays again
let idleHintTimer = null;
let nudgeHideTimer = null;
let hintArmed = false;         // has this page's video ended? (tutorial may show)
let peeking = false;
let peekTimers = [];

// The per-page hand-nudge settings (from PAGE_NUDGES above), with DEFAULT_NUDGE
// filling in anything a page leaves out.
function currentNudge() {
  const n = PAGE_NUDGES[flipped] || {};
  return {
    left: n.left != null ? n.left : DEFAULT_NUDGE.left,
    top:  n.top  != null ? n.top  : DEFAULT_NUDGE.top,
    w:    n.w    != null ? n.w    : DEFAULT_NUDGE.w,
    rot:  n.rot  != null ? n.rot  : DEFAULT_NUDGE.rot,
    show: n.show != null ? n.show : DEFAULT_NUDGE.show
  };
}
function pctToPx(v, total) {                                 // "90%" → px, or a bare number → px
  const s = String(v).trim();
  return s.slice(-1) === "%" ? (parseFloat(s) / 100) * total : (parseFloat(s) || 0);
}
function canShowHint() {
  return opened && ready && !animating && !lbdFullscreen &&
         flipped < totalPages - 1 && flipped !== LBD_INDEX && !document.hidden &&
         currentNudge().show !== false;                      // per-page: show:false hides it
}
function positionFlipHint() {
  if (!flipScaleEl) return;
  const r = flipScaleEl.getBoundingClientRect();            // the book's on-screen rect
  const scale = r.width / 1280;                             // book-space px → screen px
  const n = currentNudge();
  const w = (n.w || 80) * scale;                            // editable size
  flipHint.style.width = w + "px";
  flipHint.style.setProperty("--nh-rot", (n.rot || 0) + "deg");   // editable tilt (used by the animation)
  // Place the hand so its FINGERTIP (top-centre of the art) lands at (left,top)%.
  const fx = r.left + pctToPx(n.left, r.width);
  const fy = r.top  + pctToPx(n.top,  r.height);
  flipHint.style.left = Math.round(fx - w / 2) + "px";
  flipHint.style.top  = Math.round(fy) + "px";
}
function showFlipHint() {
  if (!canShowHint()) return;
  positionFlipHint();
  flipHint.classList.add("show");
}
function hideFlipHint() {
  flipHint.classList.remove("show");
}

/* ---- GHOST PAGE-FLIP -------------------------------------------------------
   Lift the current page about halfway toward the next one, then let it fall back
   — a live demo that the page turns. Purely visual; cancelled the instant the
   reader interacts, so a real drag/flip takes over cleanly. */
function cancelPeek() {
  peekTimers.forEach(clearTimeout);
  peekTimers = [];
  if (!peeking) return;
  peeking = false;
  const leaf = leaves[flipped];
  if (leaf) {
    leaf.style.transition = ""; leaf.style.transform = ""; leaf.style.zIndex = "";
    const c = leaf.querySelector(".curl"); if (c) c.style.opacity = "";
  }
  updateZ();
}
function peekFlip() {
  if (peeking || !canShowHint()) return;
  const leaf = leaves[flipped];
  if (!leaf) return;
  peeking = true;
  const curl = leaf.querySelector(".curl");
  leaf.style.zIndex = 300;                               // lift above the rest while peeking
  leaf.style.transition = "transform 720ms cubic-bezier(0.33, 0, 0.2, 1)";
  void leaf.offsetWidth;                                 // commit so the lift animates from flat
  leaf.style.transform = "rotateY(-52deg)";              // turn toward the next page (~halfway)
  if (curl) curl.style.opacity = "0.85";                 // page-curl shading during the lift
  peekTimers.push(setTimeout(function () {               // ...then ease it back down
    leaf.style.transform = "rotateY(0deg)";
    if (curl) curl.style.opacity = "";
  }, 760));
  peekTimers.push(setTimeout(function () {               // clean up once settled
    leaf.style.transition = ""; leaf.style.transform = ""; leaf.style.zIndex = "";
    peeking = false; updateZ();
  }, 760 + 760));
}

// Play the nudge ONCE — hand swipe on the book's right + ghost page-flip + the
// right arrow blinks — hold ~2s, then hide and come back 9s later. Repeats while idle.
function triggerHint() {
  if (!canShowHint()) { idleHintTimer = setTimeout(triggerHint, NUDGE_GAP_MS); return; }
  showFlipHint();
  peekFlip();
  if (cornerNext) cornerNext.classList.add("blink");
  clearTimeout(nudgeHideTimer);
  nudgeHideTimer = setTimeout(function () {
    hideFlipHint();
    if (cornerNext) cornerNext.classList.remove("blink");
    idleHintTimer = setTimeout(triggerHint, NUDGE_GAP_MS);   // ...then again after 9s
  }, NUDGE_SHOW_MS);
}
// ARM the flip tutorial: called the moment a page's video finishes. The nudge then
// appears HINT_DELAY (5s) later — not instantly — giving the reader a beat first.
function armFlipHint() {
  clearTimeout(nudgeHideTimer);
  clearTimeout(idleHintTimer);
  hideFlipHint();
  cancelPeek();
  if (cornerNext) cornerNext.classList.remove("blink");
  if (currentNudge().show === false) { hintArmed = false; return; }   // this page hides its hand
  hintArmed = true;
  idleHintTimer = setTimeout(triggerHint, HINT_DELAY);   // show 5s after the video
}
// Fully DISMISS the flip tutorial AND disarm it (used when leaving a page / closing
// the book) — nothing shows again until the next page's video ends.
function cancelHint() {
  hintArmed = false;
  hideFlipHint();
  cancelPeek();
  if (cornerNext) cornerNext.classList.remove("blink");
  clearTimeout(idleHintTimer);
  clearTimeout(nudgeHideTimer);
}
// Backwards-compat alias (older callers used this name); now it just cancels.
function resetIdleHint() { cancelHint(); }
// Any interaction hides the current nudge. If the tutorial is armed (the video has
// already ended on this page), the 5s countdown RESTARTS — so the nudge returns 5s
// after the reader stops interacting. If not armed, it just stays hidden.
["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (evt) {
  document.addEventListener(evt, function () {
    hideFlipHint();
    cancelPeek();
    if (cornerNext) cornerNext.classList.remove("blink");
    clearTimeout(nudgeHideTimer);
    clearTimeout(idleHintTimer);
    if (hintArmed) idleHintTimer = setTimeout(triggerHint, HINT_DELAY);   // re-show 5s after interaction
  }, { passive: true, capture: true });
});

/* ---- Boot ---------------------------------------------------------------- */
fitScale();                              // scale the fixed 1280x720 book to fit first
renderLeaves();                          // lay out the leaves (all on page 1 to start)
updateProgress();
