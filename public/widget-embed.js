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

  function initWidget() {
    var runtimeUrl = resolveFromScript("widget-runtime.js");
    import(runtimeUrl)
      .then(runInit)
      .catch(function (err) {
        var fallbackUrl = resolveFromScript("widget-runtime.tsx");
        import(fallbackUrl)
          .then(runInit)
          .catch(function (fallbackErr) {
            console.error("[QuestLayer] Failed to load widget runtime", err);
            console.error("[QuestLayer] Failed to load widget runtime fallback", fallbackErr);
          });
      });
  }

  if (window.location && window.location.protocol === "file:") {
    console.warn("[QuestLayer] Embed requires http(s) so module imports can load; use a local server.");
  }

  initWidget();
})();
