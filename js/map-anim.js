/* ============================================================
   Animated Cloudtopia map — plays the game's own Spine 3.8
   animations on canvases over the still map artwork:
   - the hero background (cover-cropped, like the CSS background)
   - the map showpiece in the World section (fit)
   Progressive enhancement: any failure leaves the still images.
   Rendering pauses while a canvas is off screen.
   ============================================================ */
(function () {
  "use strict";

  /* keep the still images for people who prefer less motion
     and data-saver connections */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.connection && navigator.connection.saveData) return;
  if (!("IntersectionObserver" in window)) return;

  // every skeleton shares one world space: the map spans this box
  var WORLD_W = 12500, WORLD_H = 7000;

  /* draw order: back -> front, copied from the game's HomeScreen.unity
     sibling order — land_a/land_b are the static landmasses that mask
     the river and pool edges, they must sit exactly here. One deviation:
     fog_falls goes behind the landmasses so the waterfall emerges from
     under the cliff and the bridge, like in the flattened map artwork */
  var PIECES = [
    "float_pools", "fog_falls", "land_b", "sonata_river", "land_a",
    "academy", "carnival", "farm", "mama_house", "mt_strata",
    "school", "rainbow_forest", "rainbow_orchard", "sonata_hills",
    "sonata_discs", "sunnylab", "town", "watermill", "windmill",
    "dam", "airship", "fg_clouds"
  ];

  var BASE = "assets/spine/";
  var runtimeRequested = false;
  var runtimeReady = false;
  var pendingStages = [];

  /* targets: the hero crops like `background: center 62% / cover`,
     the map card shows the whole artwork (its canvas matches the
     image's aspect ratio, so fit == exact overlay) */
  var stages = [
    { canvas: document.getElementById("heroMapCanvas"), mode: "cover", posX: 0.5, posY: 0.62 },
    { canvas: document.querySelector("#mapAnim canvas"), mode: "fit", posX: 0.5, posY: 0.5 }
  ].filter(function (s) { return s.canvas; });
  if (!stages.length) return;

  function frame(stage, now) {
    stage.rafQueued = false;
    if (!stage.visible) { stage.lastTime = 0; return; }
    now /= 1000;
    var delta = stage.lastTime ? now - stage.lastTime : 0;
    stage.lastTime = now;
    if (delta > 0.1) delta = 0.1;

    var canvas = stage.canvas, gl = stage.gl;
    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(canvas.clientWidth * dpr);
    var h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) { queueFrame(stage); return; }
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);

    /* map the world box onto the canvas the same way the CSS
       background is drawn (cover crop or full fit) */
    var pxPerWorld = stage.mode === "cover"
      ? Math.max(w / WORLD_W, h / WORLD_H)
      : Math.min(w / WORLD_W, h / WORLD_H);
    var imgW = WORLD_W * pxPerWorld, imgH = WORLD_H * pxPerWorld;
    var offX = (w - imgW) * stage.posX;
    var offY = (h - imgH) * stage.posY;
    var cam = stage.renderer.camera;
    cam.viewportWidth = w / pxPerWorld;
    cam.viewportHeight = h / pxPerWorld;
    cam.position.x = -WORLD_W / 2 + (w / 2 - offX) / pxPerWorld;
    cam.position.y = WORLD_H / 2 - (h / 2 - offY) / pxPerWorld;
    cam.update();

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    stage.renderer.begin();
    for (var i = 0; i < stage.actors.length; i++) {
      var a = stage.actors[i];
      a.state.update(delta);
      a.state.apply(a.skeleton);
      a.skeleton.updateWorldTransform();
      stage.renderer.drawSkeleton(a.skeleton, a.pma);
    }
    stage.renderer.end();
    queueFrame(stage);
  }

  function queueFrame(stage) {
    if (!stage.rafQueued && stage.visible && stage.actors && stage.actors.length) {
      stage.rafQueued = true;
      requestAnimationFrame(function (now) { frame(stage, now); });
    }
  }

  function initStage(stage) {
    if (stage.started) return;
    stage.started = true;
    try {
      stage.gl = stage.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      if (!stage.gl) return;
      stage.renderer = new spine.webgl.SceneRenderer(stage.canvas, stage.gl);
    } catch (e) {
      return;
    }
    var assetManager = new spine.webgl.AssetManager(stage.gl);
    assetManager.loadTextureAtlas(BASE + "main_map.atlas");
    /* the foreground clouds are bone-scaled x8, so the shared atlas is
       too soft for them — they get their own full-resolution atlas
       (straight alpha, hence pma false below) */
    assetManager.loadTextureAtlas(BASE + "fg_clouds_hd.atlas");
    PIECES.forEach(function (p) { assetManager.loadText(BASE + p + ".json"); });
    (function wait() {
      if (assetManager.isLoadingComplete()) {
        if (Object.keys(assetManager.getErrors()).length) return; // leave the still image
        var atlasLoader = new spine.AtlasAttachmentLoader(assetManager.get(BASE + "main_map.atlas"));
        var hdCloudLoader = new spine.AtlasAttachmentLoader(assetManager.get(BASE + "fg_clouds_hd.atlas"));
        stage.actors = [];
        PIECES.forEach(function (p) {
          var data;
          try {
            var loader = p === "fg_clouds" ? hdCloudLoader : atlasLoader;
            data = new spine.SkeletonJson(loader).readSkeletonData(assetManager.get(BASE + p + ".json"));
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
          stage.actors.push({ skeleton: skeleton, state: state, pma: p !== "fg_clouds" });
        });
        queueFrame(stage);
      } else {
        setTimeout(wait, 100);
      }
    })();
  }

  function requestStage(stage) {
    if (runtimeReady) { initStage(stage); return; }
    pendingStages.push(stage);
    if (runtimeRequested) return;
    runtimeRequested = true;
    var s = document.createElement("script");
    s.src = "js/spine-webgl.js";
    s.onload = function () {
      runtimeReady = true;
      pendingStages.forEach(initStage);
      pendingStages = [];
    };
    document.head.appendChild(s);
  }

  stages.forEach(function (stage) {
    stage.visible = false;
    stage.lastTime = 0;
    stage.rafQueued = false;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        stage.visible = entry.isIntersecting;
        if (stage.visible) { requestStage(stage); queueFrame(stage); }
      });
    }, { rootMargin: "600px 0px" }).observe(stage.canvas);
  });
})();
