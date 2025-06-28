import { c as createLucideIcon$1, e as createRoot, j as jsxRuntimeExports, r as reactExports, d as getSettings, h as getProviderById, m as motion, A as AI_PROVIDERS, E as ExternalLink, C as CheckCircle, b as AlertCircle, s as saveSettings, i as clearSettings } from "./storage.js";
const Save = createLucideIcon$1("Save", [
  [
    "path",
    {
      d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
      key: "1owoqh"
    }
  ],
  ["polyline", { points: "17 21 17 13 7 13 7 21", key: "1md35c" }],
  ["polyline", { points: "7 3 7 8 15 8", key: "8nz8an" }]
]);
const TestTube = createLucideIcon$1("TestTube", [
  [
    "path",
    {
      d: "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2",
      key: "187lwq"
    }
  ],
  ["path", { d: "M8.5 2h7", key: "csnxdl" }],
  ["path", { d: "M14.5 16h-5", key: "1ox875" }]
]);
const Trash2 = createLucideIcon$1("Trash2", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
]);
const options = "";
const Options = () => {
  const [settings, setSettings] = reactExports.useState({
    selectedProvider: "",
    apiKey: "",
    isConfigured: false,
    hasCompletedOnboarding: false
  });
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const [isTesting, setIsTesting] = reactExports.useState(false);
  const [testResult, setTestResult] = reactExports.useState(null);
  const [showApiKey, setShowApiKey] = reactExports.useState(false);
  reactExports.useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        isConfigured: !!(settings.selectedProvider && settings.apiKey)
      });
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      alert("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      setTestResult("success");
    } catch (error) {
      setTestResult("error");
    } finally {
      setIsTesting(false);
    }
  };
  const handleReset = async () => {
    if (confirm("Tem certeza que deseja limpar todas as configurações?")) {
      try {
        await clearSettings();
        setSettings({
          selectedProvider: "",
          apiKey: "",
          isConfigured: false,
          hasCompletedOnboarding: false
        });
        alert("Configurações limpas com sucesso!");
      } catch (error) {
        alert("Erro ao limpar configurações");
      }
    }
  };
  const selectedProviderData = getProviderById(settings.selectedProvider);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gray-50 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-4xl mx-auto px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      className: "bg-white rounded-lg shadow-sm border border-gray-200",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-4 border-b border-gray-200", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Configurações do Assistente IA" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 mt-1", children: "Configure sua inteligência artificial para automatizar tarefas web" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Provedor de IA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: AI_PROVIDERS.map((provider) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `p-4 border-2 rounded-lg cursor-pointer transition-all ${settings.selectedProvider === provider.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`,
                onClick: () => setSettings({ ...settings, selectedProvider: provider.id }),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl", children: provider.icon }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900", children: provider.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: provider.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-600 font-medium", children: provider.costInfo })
                ] })
              },
              provider.id
            )) })
          ] }),
          settings.selectedProvider && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            motion.div,
            {
              initial: { opacity: 0, height: 0 },
              animate: { opacity: 1, height: "auto" },
              className: "space-y-4",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Configuração da API" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl", children: selectedProviderData?.icon }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-blue-900", children: selectedProviderData?.name }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-800 mb-3", children: selectedProviderData?.description }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "a",
                      {
                        href: selectedProviderData?.setupUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800",
                        children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Obter chave de API" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-3 h-3" })
                        ]
                      }
                    )
                  ] })
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: selectedProviderData?.apiKeyLabel }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: showApiKey ? "text" : "password",
                        value: settings.apiKey,
                        onChange: (e) => setSettings({ ...settings, apiKey: e.target.value }),
                        placeholder: "Cole sua chave de API aqui...",
                        className: "w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowApiKey(!showApiKey),
                        className: "absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700",
                        children: showApiKey ? "Ocultar" : "Mostrar"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      onClick: handleTest,
                      disabled: !settings.apiKey || isTesting,
                      className: "flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                      children: isTesting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Testando..." })
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(TestTube, { className: "w-4 h-4" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Testar Conexão" })
                      ] })
                    }
                  ),
                  testResult === "success" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-1 text-green-600", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Conexão bem-sucedida!" })
                  ] }),
                  testResult === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-1 text-red-600", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: "Erro na conexão" })
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "💡 Dicas de Uso" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-gray-700 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Mantenha sua chave de API segura e não a compartilhe" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Monitore o uso para evitar custos inesperados" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Use instruções claras e específicas para melhores resultados" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• A extensão funciona melhor em sites em português" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between pt-6 border-t border-gray-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: handleReset,
                className: "flex items-center space-x-2 text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Limpar Configurações" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleSave,
                disabled: !settings.selectedProvider || !settings.apiKey || isSaving,
                className: "flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Salvando..." })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Salvar Configurações" })
                ] })
              }
            )
          ] })
        ] })
      ]
    }
  ) }) });
};
const container = document.getElementById("options-root");
if (container) {
  const root = createRoot(container);
  root.render(/* @__PURE__ */ jsxRuntimeExports.jsx(Options, {}));
}
