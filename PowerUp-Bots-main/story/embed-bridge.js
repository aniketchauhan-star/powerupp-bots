/* ============================================================================
   EMBED BRIDGE — "Power Up, Bots!" ⇄ flipbook host.
   Loaded LAST in index.html (after the game's own inline script). Two jobs:

   1. START HANDSHAKE — when the TITLE screen's Play button is tapped, post
      {source:"lbd", type:"lbd-start"} to the parent so the flipbook expands the
      parked overlay to true fullscreen. Registered in the CAPTURE phase: the
      game's own (bubble-phase) click handler sets state.locked synchronously,
      so a later bubble listener would see the button already locked and never
      fire. Completion needs no bridge — the game's own completeGame() already
      posts {type:"activity_complete"} (after the final round's "Yay!" voice-over
      has ended and the success Next button was tapped), which the flipbook maps
      to celebrate → shrink → auto-advance.

   2. IDLE CHUNKED ASSET PRELOADER — the game paints sprites via <img> swaps and
      CSS, so assets for screens that aren't up yet are NOT fetched until first
      use; that is the hidden cause of mid-game hitches. Starting ~1s after boot
      (so the title screen paints first), this walks the full asset manifest in
      small chunks (~3 images or 2 audio clips per idle slice, via
      requestIdleCallback with a setTimeout fallback for Safari) and warms:
        • images  → through the game's OWN preloadAsset() cache (_assetCache
                    keeps a hard ref + decode(), so bitmaps can't be evicted
                    before use); plain Image() fallback if unavailable.
        • audio   → a fetch() for full-file HTTP caching, PLUS — for the
                    instruction voice-overs — the exact Audio element the game
                    will later play, pre-created into _instructionAudioCache
                    (mirroring playInstructionAudio's own construction).
        • videos  → fetch() for full-file HTTP caching (IraVid1/2.webm).
      The manifest is the complete on-disk set, so assets referenced ONLY from
      JS string literals or CSS url(...) are covered too — notably:
      laserSound.ogg, gateOpen.ogg (lazy Audio()), LabGate.webp, IraVid2.webm
      (src swapped at runtime), and the TapPanel/leftpanel/cutPanel SVGs.

   The bridge is INERT when the game runs standalone (window.parent === window):
   it registers nothing and preloads nothing.
   ============================================================================ */
(function () {
  "use strict";

  var EMBEDDED = false;
  try { EMBEDDED = !!(window.parent && window.parent !== window); }
  catch (e) { EMBEDDED = true; }             // cross-origin parent access threw → we ARE framed
  if (!EMBEDDED) return;                     // standalone → fully inert

  function post(type) {
    try { window.parent.postMessage({ source: "lbd", type: type }, "*"); } catch (e) { }
  }

  /* ── 1. START HANDSHAKE (capture phase — see header) ─────────────────────── */
  var playBtn = document.getElementById("playButton");
  var playStage = document.getElementById("playStage");
  if (playBtn) {
    playBtn.addEventListener("click", function () {
      // The SAME button is reused on Ira's preplay screen; only the TITLE
      // screen's tap (start-mode) means "the game begins". Mirror the game's
      // own guards so we never signal a tap the game itself ignored.
      if (!playStage || !playStage.classList.contains("start-mode")) return;
      if (!playBtn.classList.contains("play-ready")) return;
      if (window.state && window.state.locked) return;
      post("lbd-start");
    }, true);
  }

  /* ── 2. IDLE CHUNKED ASSET PRELOADER ─────────────────────────────────────── */
  // Complete on-disk manifest (assets/ + audios/). The game's boot already warms
  // its critical-path sprites; preloadAsset/_instructionAudioCache both dedupe,
  // so re-listing them here costs nothing and guarantees NOTHING is missed.
  var IMAGES = [
    "135anglecutCircleHollow.webp", "45angleCircleHollow.webp", "Beam.svg",
    "BgForTutorial.webp", "CircleBlock.webp", "CircleBot.webp",
    "CircleLastFlowHollow1.webp", "CircleLastFlowHollow2.webp",
    "ClickedCutButton.webp", "CutButton.webp", "GameStartScreen.webp",
    "HappyCircleBot.webp", "HappyTriangleBot.webp",
    "Ira.webp", "LabGate.webp", "Laser.webp",
    "LaserMachine.svg", "LaserMachineWithoutLines.webp", "LeftButton.webp",
    "LeftButtonClicked.webp", "LetsGoButton.webp", "LetsPlayBg.webp",
    "Mainbg.webp", "NextButton2.webp", "PlayButton.webp", "RectangleBlock.webp",
    "RectangleHollow.webp", "RectangleHollow2.webp", "RightButton.webp",
    "RightButtonClicked.webp", "SemiCircleHollowleft.webp",
    "SemiCircleHollowright.webp", "SquareBOt.webp", "SquareBotSadState.webp",
    "SquareHollow.webp", "TapPanel.svg", "TappedCutButton.webp",
    "TriangularHollowLeft.webp", "TriangularHollowRight.webp",
    "TryAgainButton.webp", "VerticalRectangleHollow.webp", "cutPanel.svg",
    "happyPinkBot.webp", "image.png", "instructionPannel.webp", "laserlight.webp",
    "leftpanel.svg", "nextButton.webp", "playbtn.webp"
  ].map(function (n) { return "assets/" + n; });

  // Instruction voice-overs — sourced from the game's own INSTRUCTION_AUDIO map
  // at run time so the request URLs (and cache keys) are EXACTLY what
  // playInstructionAudio will use. Falls back to nothing if the map is absent.
  function instructionSrcs() {
    var map = window.INSTRUCTION_AUDIO, out = [], k;
    if (map) { for (k in map) { if (map[k] && out.indexOf(map[k]) < 0) out.push(map[k]); } }
    return out;
  }
  // Audio referenced only from JS literals (lazy Audio() constructions).
  var EXTRA_AUDIO = [
    "audios/ThemeMusic.ogg", "audios/PlugConnect.ogg", "audios/laserSound.ogg",
    "audios/gateOpen.ogg", "audios/clapSound.ogg", "audios/confettiSound.ogg"
  ];
  var VIDEOS = ["assets/IraVid1.webm", "assets/IraVid2.webm"];

  function warmImage(src) {
    if (typeof window.preloadAsset === "function") { window.preloadAsset(src); return; }
    var img = new Image(); img.src = src;               // fallback: plain HTTP-cache warm
  }
  function warmAudio(src, isInstruction) {
    // Full-file HTTP cache first…
    try {
      fetch(src).then(function (r) { return r.blob(); }).catch(function () { });
    } catch (e) { }
    // …then, for instruction VOs, pre-create the EXACT element the game plays
    // (mirrors playInstructionAudio's construction, so it adopts ours instead
    // of building one on first use).
    if (isInstruction && window._instructionAudioCache && !window._instructionAudioCache[src]) {
      try {
        var a = new Audio(src);
        a.preload = "auto";
        a.volume = 0.95;
        a.load();
        window._instructionAudioCache[src] = a;
      } catch (e) { }
    }
  }
  function warmVideo(src) {
    try {
      fetch(src).then(function (r) { return r.blob(); }).catch(function () { });
    } catch (e) { }
  }

  function startPreloader() {
    var qImages = IMAGES.slice();
    var instr = instructionSrcs();
    var qAudio = instr.concat(EXTRA_AUDIO.filter(function (s) { return instr.indexOf(s) < 0; }));
    var qVideo = VIDEOS.slice();

    var idle = window.requestIdleCallback
      ? function (fn) { window.requestIdleCallback(fn, { timeout: 600 }); }
      : function (fn) { setTimeout(fn, 200); };        // Safari fallback

    function slice() {
      var n;
      if (qImages.length) {                            // ~3 images per idle slice
        for (n = 0; n < 3 && qImages.length; n++) warmImage(qImages.shift());
      } else if (qAudio.length) {                      // …then ~2 audio clips per slice
        for (n = 0; n < 2 && qAudio.length; n++) {
          var src = qAudio.shift();
          warmAudio(src, instr.indexOf(src) >= 0);
        }
      } else if (qVideo.length) {                      // …then the two Ira clips
        warmVideo(qVideo.shift());
      } else {
        return;                                        // everything warm — done
      }
      idle(slice);
    }
    idle(slice);
  }

  // Start ~1s after boot so the title screen paints (and its own critical-asset
  // warm cache runs) before background warming begins.
  if (document.readyState === "complete") setTimeout(startPreloader, 1000);
  else window.addEventListener("load", function () { setTimeout(startPreloader, 1000); });
})();
