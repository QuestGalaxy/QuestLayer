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

  function loadScript(src, attrs, onload) {
    var s = document.createElement("script");
    s.src = src;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        s.setAttribute(key, attrs[key]);
      });
    }
    if (onload) s.onload = onload;
    document.head.appendChild(s);
    return s;
  }

  function ensureFonts() {
    if (document.querySelector("link[data-questlayer-fonts]")) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Space+Mono&family=Inter:wght@400;700;900&display=swap";
    link.setAttribute("data-questlayer-fonts", "true");
    document.head.appendChild(link);
  }

  function ensureTailwind(onReady) {
    if (document.querySelector("script[data-questlayer-tailwind]")) {
      if (onReady) onReady();
      return;
    }
    loadScript(
      "https://cdn.tailwindcss.com",
      { "data-questlayer-tailwind": "true" },
      function () {
        if (onReady) onReady();
      }
    );
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

  function ensureVitePreamble() {
    if (window.__vite_plugin_react_preamble_installed__) {
      return Promise.resolve();
    }
    var refreshUrl = resolveFromScript("/@react-refresh");
    return import(refreshUrl)
      .then(function (mod) {
        var RefreshRuntime = mod.default || mod;
        if (!RefreshRuntime) return;
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = function () {};
        window.$RefreshSig$ = function () {
          return function (type) {
            return type;
          };
        };
        window.__vite_plugin_react_preamble_installed__ = true;
      })
      .catch(function () {
        return;
      });
  }

  function initWidget() {
    var runtimeUrl = resolveFromScript("widget-runtime.js");

    ensureVitePreamble().then(function () {
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
    });
  }

  ensureFonts();
  ensureTailwind(initWidget);
})();
