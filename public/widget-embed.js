(function () {
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var config = {};
  var rawConfig = script && script.getAttribute("data-config");
  if (rawConfig) {
    try {
      config = JSON.parse(rawConfig);
    } catch (err) {
      console.error("[QuestLayer] Invalid data-config JSON", err);
    }
  }
  var rawMountId = script && (script.getAttribute("data-mount") || script.getAttribute("data-mount-id"));
  if (rawMountId && typeof rawMountId === "string") {
    rawMountId = rawMountId.replace(/^#/, "");
    config.mountId = config.mountId || rawMountId;
  }

  var inlineMode = config.position === "free-form" || Boolean(config.mountId);
  if (inlineMode) {
    if (!config.position) {
      config.position = "free-form";
    }
    if (!config.mountId) {
      config.mountId = "questlayer-inline-" + Math.random().toString(36).slice(2, 10);
    }
    var mountEl = document.getElementById(config.mountId);
    if (!mountEl) {
      mountEl = document.createElement("div");
      mountEl.id = config.mountId;
      if (script && script.parentNode) {
        script.parentNode.insertBefore(mountEl, script);
      } else if (document.body) {
        document.body.appendChild(mountEl);
      }
    }
  }

  function resolveFromScript(path) {
    if (script && script.src) {
      try {
        return new URL(path, script.src).toString();
      } catch (err) {
        return path;
      }
    }
    return path;
  }

  function runInit(mod) {
    var init = mod.init || mod.initQuestLayer || (window.QuestLayer && window.QuestLayer.init);
    if (init) {
      init(config);
    } else {
      console.error("[QuestLayer] Widget runtime loaded, but init() is missing.");
    }
  }

  function isLikelyViteDev(origin) {
    return /localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0/.test(origin);
  }

  function ensureViteReactPreamble() {
    if (window.__vite_plugin_react_preamble_installed__) {
      return;
    }
    window.$RefreshReg$ = function () {};
    window.$RefreshSig$ = function () {
      return function (type) {
        return type;
      };
    };
    window.__vite_plugin_react_preamble_installed__ = true;
  }

  function loadViteReactPreamble(origin) {
    return import(origin + "/@react-refresh").then(function (mod) {
      var RefreshRuntime = mod.default || mod;
      if (!RefreshRuntime || !RefreshRuntime.injectIntoGlobalHook) {
        return;
      }
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = function () {};
      window.$RefreshSig$ = function () {
        return function (type) {
          return type;
        };
      };
      window.__vite_plugin_react_preamble_installed__ = true;
    });
  }

  function initWidget() {
    var cacheBuster = "v=" + Date.now().toString(36) + Math.random().toString(36).slice(2);
    var runtimeUrl = resolveFromScript("widget-runtime.js") + "?" + cacheBuster;
    var origin = script && script.src ? new URL(script.src).origin : window.location.origin;

    if (isLikelyViteDev(origin)) {
      ensureViteReactPreamble();
      Promise.resolve()
        .then(function () {
          return loadViteReactPreamble(origin);
        })
        .then(function () {
          return import(origin + "/@vite/client");
        })
        .then(function () {
          return import(runtimeUrl);
        })
        .then(runInit)
        .catch(function (err) {
          var fallbackUrl = resolveFromScript("widget-runtime.tsx") + "?" + cacheBuster;
          import(fallbackUrl)
            .then(runInit)
            .catch(function (fallbackErr) {
              console.error("[QuestLayer] Failed to load widget runtime", err);
              console.error("[QuestLayer] Failed to load widget runtime fallback", fallbackErr);
            });
        });
      return;
    }

    import(runtimeUrl)
      .then(runInit)
      .catch(function (err) {
        var distUrl = resolveFromScript("dist/widget-runtime.js") + "?" + cacheBuster;
        import(distUrl)
          .then(runInit)
          .catch(function (distErr) {
            console.error("[QuestLayer] Failed to load widget runtime", err);
            console.error("[QuestLayer] Failed to load dist widget runtime", distErr);
          });
      });
  }

  if (window.location && window.location.protocol === "file:") {
    console.warn("[QuestLayer] Embed requires http(s) so module imports can load; use a local server.");
  }

  initWidget();
})();
