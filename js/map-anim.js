/* ============================================================
   Animated Cloudtopia map — plays the game's own Spine 3.8
   animations on a canvas over the still map image.
   Progressive enhancement: any failure leaves the still image.
   Assets load lazily, only when the map scrolls near the
   viewport, and rendering pauses while it is off screen.
   ============================================================ */
(function () {
  "use strict";

  var wrap = document.getElementById("mapAnim");
  if (!wrap) return;
  var canvas = wrap.querySelector("canvas");
  if (!canvas || !("IntersectionObserver" in window)) return;

  /* keep the still image for people who prefer less motion
     and data-saver connections */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.connection && navigator.connection.saveData) return;

  // every skeleton shares one world space: the map spans this box
  var WORLD_W = 12500, WORLD_H = 7000;

  // draw order: back -> front
  var PIECES = [
    "mt_strata", "sonata_river", "fog_falls", "sonata_hills", "sonata_discs",
    "rainbow_forest", "rainbow_orchard", "school", "academy", "sunnylab",
    "dam", "watermill", "windmill", "farm", "mama_house", "float_pools",
    "town", "carnival", "airship", "fg_clouds"
  ];

  var BASE = "assets/spine/";
  var started = false;
  var visible = false;
  var rafQueued = false;
  var gl, renderer, actors = [], lastTime = 0;

  function frame(now) {
    rafQueued = false;
    if (!visible) { lastTime = 0; return; }
    now /= 1000;
    var delta = lastTime ? now - lastTime : 0;
    lastTime = now;
    if (delta > 0.1) delta = 0.1;

    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(canvas.clientWidth * dpr);
    var h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    renderer.camera.position.x = 0;
    renderer.camera.position.y = 0;
    renderer.camera.viewportWidth = WORLD_W;
    renderer.camera.viewportHeight = WORLD_H;
    renderer.camera.update();

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer.begin();
    for (var i = 0; i < actors.length; i++) {
      var a = actors[i];
      a.state.update(delta);
      a.state.apply(a.skeleton);
      a.skeleton.updateWorldTransform();
      renderer.drawSkeleton(a.skeleton, true);
    }
    renderer.end();
    queueFrame();
  }

  function queueFrame() {
    if (!rafQueued && visible && actors.length) {
      rafQueued = true;
      requestAnimationFrame(frame);
    }
  }

  function build(assetManager) {
    var atlas = assetManager.get(BASE + "main_map.atlas");
    var atlasLoader = new spine.AtlasAttachmentLoader(atlas);
    PIECES.forEach(function (p) {
      var data;
      try {
        data = new spine.SkeletonJson(atlasLoader).readSkeletonData(assetManager.get(BASE + p + ".json"));
      } catch (e) {
        return; // skip a broken piece, keep the rest
      }
      var skeleton = new spine.Skeleton(data);
      skeleton.setToSetupPose();
      skeleton.updateWorldTransform();
      var state = new spine.AnimationState(new spine.AnimationStateData(data));
      if (data.animations.length > 0) {
        state.setAnimation(0, data.animations[0].name, true);
        // stagger the loops so the whole map doesn't tick in unison
        state.tracks[0].trackTime = Math.random() * data.animations[0].duration;
      }
      actors.push({ skeleton: skeleton, state: state });
    });
    queueFrame();
  }

  function init() {
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      if (!gl) return;
      renderer = new spine.webgl.SceneRenderer(canvas, gl);
    } catch (e) {
      return;
    }
    var assetManager = new spine.webgl.AssetManager(gl);
    assetManager.loadTextureAtlas(BASE + "main_map.atlas");
    PIECES.forEach(function (p) { assetManager.loadText(BASE + p + ".json"); });
    (function wait() {
      if (assetManager.isLoadingComplete()) {
        if (Object.keys(assetManager.getErrors()).length) return; // leave the still image
        build(assetManager);
      } else {
        setTimeout(wait, 100);
      }
    })();
  }

  function start() {
    if (started) return;
    started = true;
    var s = document.createElement("script");
    s.src = "js/spine-webgl.js";
    s.onload = init;
    document.head.appendChild(s);
  }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      visible = entry.isIntersecting;
      if (visible) { start(); queueFrame(); }
    });
  }, { rootMargin: "600px 0px" }).observe(wrap);
})();
