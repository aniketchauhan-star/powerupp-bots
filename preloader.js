/* ============================================================================
   PRELOADER — fetch EVERY asset (flipbook media + posters + the embedded
   game's complete file set) behind a themed loading bar on the cover, BEFORE
   the Play button appears. Loaded after preload-manifest.js, before script.js.

   • The Play button is hidden while body.preloading is set; the bar sits in its
     place. At 100% the bar fades out and the button pops in. script.js ALSO
     guards openBook() on window.PRELOAD.done, so keyboard / programmatic
     starts wait too.
   • Streaming fetch readers give byte-accurate progress; files are weighted by
     their real on-disk sizes (preload-manifest.js, generated from the actual
     files) and refined by Content-Length. The displayed bar is MONOTONIC.
   • Queue is smallest-first (manifest is pre-sorted), concurrency-limited.
   • kind "media" files are kept as blob: URLs and swapped onto the matching
     flipbook elements, so "loaded" truly means local. Every swapped element
     gets a ONE-TIME error fallback back to its original file URL (videos also
     resume playback). kind "warm" files (posters + everything the game iframe
     requests, with their EXACT request URLs incl. ?v= busters) fill the HTTP
     cache only.
   • FAILURE NEVER BLOCKS: a failed / stalled / aborted fetch (or file:// where
     fetch is blocked) counts as done and the element keeps its original src.
     A stall watchdog aborts any transfer that stops producing bytes.
   ============================================================================ */
(function () {
  "use strict";

  var MANIFEST = window.PRELOAD_MANIFEST || [];
  var CONCURRENCY = 5;          // parallel transfers (spec: ~5)
  var STALL_MS = 20000;         // abort a transfer after this long with no bytes
  var HARD_CAP_MS = 120000;     // absolute per-transfer cap

  var blobs = {};               // decoded path -> blob: URL
  var registered = [];          // media elements registered before their blob landed
  var totalBytes = 0, fileState = {};
  MANIFEST.forEach(function (e) { totalBytes += e[1]; fileState[e[0]] = { size: e[1], got: 0, done: false }; });

  var shownPct = 0, settled = 0, isDone = false;

  var PRELOAD = window.PRELOAD = {
    done: MANIFEST.length === 0,
    /* Resolve a path to its blob URL (or the original path if not fetched). */
    url: function (path) { return blobs[norm(path)] || path; },
    /* Set a media element's src through the blob map + wire the error fallback.
       Used by script.js at DYNAMIC src-assignment sites (hotspot/sequence
       videos), where code compares getAttribute("src") — always compare
       against PRELOAD.url(path) there. */
    setSrc: function (el, path) {
      var u = PRELOAD.url(path);
      if (el.getAttribute("src") === u) return;
      el.src = u;
      if (u !== path) wireFallback(el, path);
    },
    /* Register an out-of-DOM media element (bgMusic, sfx fallbacks) to be fed
       its blob as soon as (or if already) fetched. */
    register: function (el, path) {
      var key = norm(path);
      if (blobs[key]) { feed(el, path, blobs[key]); }
      else registered.push({ el: el, path: path });
    }
  };

  function norm(p) { try { return decodeURIComponent(p); } catch (_) { return p; } }

  function feed(el, origPath, blobURL) {
    if (el.dataset && el.dataset.blobFed) return;
    if (el.dataset) el.dataset.blobFed = "1";
    el.src = blobURL;
    wireFallback(el, origPath);
  }
  /* ONE-TIME error fallback: blob failed → revert to the original file URL and,
     for videos that were mid-play, resume. */
  function wireFallback(el, origPath) {
    if (el.dataset && el.dataset.blobGuard) return;
    if (el.dataset) el.dataset.blobGuard = "1";
    el.addEventListener("error", function () {
      var wasPlaying = (el.tagName === "VIDEO" || el.tagName === "AUDIO") && !el.paused && !el.ended;
      el.src = origPath;
      try { el.load(); } catch (_) {}
      if (wasPlaying) { var p = el.play(); if (p && p.catch) p.catch(function () {}); }
    }, { once: true });
  }

  /* Swap every already-built flipbook element whose src matches this file.
     (script.js runs synchronously before any fetch completion can fire, so the
     static DOM is always fully built by the time sweeps happen.) */
  function sweep(url, blobURL) {
    var key = norm(url);
    var nodes = document.querySelectorAll("video[src], img[src], audio[src]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && el.closest("#asset-manifest")) continue;   // inert reference list
      if (norm(el.getAttribute("src") || "") !== key) continue;
      feed(el, url, blobURL);
    }
    for (var j = registered.length - 1; j >= 0; j--) {
      if (norm(registered[j].path) === key) {
        feed(registered[j].el, registered[j].path, blobURL);
        registered.splice(j, 1);
      }
    }
  }

  /* ── the themed bar (replaces the Play button until 100%) ─────────────── */
  var bar, fill, label;
  function buildBar() {
    var host = document.querySelector(".cover .face.front");
    if (!host) return;
    bar = document.createElement("div");
    bar.className = "load-bar";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-label", "Loading the story");
    bar.innerHTML = '<div class="load-bar-track"><div class="load-bar-fill"></div></div>' +
                    '<div class="load-bar-text">Loading… 0%</div>';
    host.appendChild(bar);
    fill = bar.querySelector(".load-bar-fill");
    label = bar.querySelector(".load-bar-text");
  }
  function paint() {
    var got = 0;
    MANIFEST.forEach(function (e) { var s = fileState[e[0]]; got += Math.min(s.got, s.size); });
    var pct = totalBytes ? Math.round((got / totalBytes) * 100) : 100;
    if (pct > shownPct) shownPct = pct;                     // monotonic
    if (fill) fill.style.width = shownPct + "%";
    if (label) label.textContent = "Loading… " + shownPct + "%";
    if (bar) bar.setAttribute("aria-valuenow", String(shownPct));
  }

  function finish() {
    if (isDone) return;
    isDone = true;
    PRELOAD.done = true;
    shownPct = 100; paint();
    setTimeout(function () {
      document.body.classList.remove("preloading");         // bar fades out, Play pops in (CSS)
      window.dispatchEvent(new Event("preload-done"));
    }, 240);                                                // let the bar visibly hit 100% first
  }

  /* ── transfer engine: streaming reader + stall watchdog ───────────────── */
  function transfer(entry, onSettled) {
    var url = entry[0], kind = entry[2];
    var st = fileState[url];
    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var stallTimer = null, hardTimer = null, closed = false;

    function close(ok, blob) {
      if (closed) return; closed = true;
      clearTimeout(stallTimer); clearTimeout(hardTimer);
      st.done = true; st.got = st.size;                     // failed/aborted counts as DONE (never blocks)
      if (ok && blob && kind === "media") {
        var b = URL.createObjectURL(blob);
        blobs[norm(url)] = b;
        sweep(url, b);
      }
      paint();
      onSettled();
    }
    function armStall() {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(function () { if (ctrl) ctrl.abort(); close(false); }, STALL_MS);
    }

    try {
      hardTimer = setTimeout(function () { if (ctrl) ctrl.abort(); close(false); }, HARD_CAP_MS);
      armStall();
      fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
        if (!r.ok) { close(false); return; }
        var len = parseInt(r.headers.get("Content-Length") || "0", 10);
        if (len > 0 && len !== st.size) {                   // refine the weight with the real length
          totalBytes += (len - st.size); st.size = len;
        }
        if (!r.body || !r.body.getReader) {                 // no streaming → whole-blob fallback
          r.blob().then(function (b) { close(true, b); }, function () { close(false); });
          return;
        }
        var reader = r.body.getReader(), chunks = [];
        (function pump() {
          reader.read().then(function (res) {
            if (closed) return;
            if (res.done) {
              close(true, new Blob(chunks, { type: r.headers.get("Content-Type") || "" }));
              return;
            }
            chunks.push(res.value);
            st.got += res.value.byteLength;
            armStall(); paint(); pump();
          }, function () { close(false); });
        })();
      }, function () { close(false); });                    // fetch rejected (offline / file://)
    } catch (_) { close(false); }                            // fetch unavailable
  }

  function run() {
    document.body.classList.add("preloading");
    buildBar(); paint();
    var next = 0;
    function onSettled() {
      settled++;
      if (settled >= MANIFEST.length) { finish(); return; }
      if (next < MANIFEST.length) transfer(MANIFEST[next++], onSettled);
    }
    if (!MANIFEST.length || typeof fetch !== "function") { finish(); return; }
    var starters = Math.min(CONCURRENCY, MANIFEST.length);
    next = starters;
    for (var i = 0; i < starters; i++) transfer(MANIFEST[i], onSettled);
  }

  run();
})();
