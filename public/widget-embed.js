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

  function initWidget() {
    var runtimeUrl = resolveFromScript("widget-runtime.js");
    import(runtimeUrl)
      .then(function (mod) {
        var init = mod.init || mod.initQuestLayer || (window.QuestLayer && window.QuestLayer.init);
        if (init) {
          init(config);
        } else {
          console.error("[QuestLayer] Widget runtime loaded, but init() is missing.");
        }
      })
      .catch(function (err) {
        console.error("[QuestLayer] Failed to load widget runtime", err);
      });
  }

  if (window.location && window.location.protocol === "file:") {
    console.warn("[QuestLayer] Embed requires http(s) so module imports can load; use a local server.");
  }

  initWidget();
})();
