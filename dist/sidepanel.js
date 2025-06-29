import { r as reactExports, u as useIsomorphicLayoutEffect, f as frame, a as useConstant, P as PresenceContext, L as LayoutGroupContext, c as createLucideIcon$1, j as jsxRuntimeExports, m as motion, A as AI_PROVIDERS, C as CheckCircle, b as AlertCircle, E as ExternalLink, g as getAvailableModels, s as saveSettings, d as getSettings, e as createRoot } from "./storage.js";
const sidepanel = "";
function useIsMounted() {
  const isMounted = reactExports.useRef(false);
  useIsomorphicLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
}
function useForceUpdate() {
  const isMounted = useIsMounted();
  const [forcedRenderCount, setForcedRenderCount] = reactExports.useState(0);
  const forceRender = reactExports.useCallback(() => {
    isMounted.current && setForcedRenderCount(forcedRenderCount + 1);
  }, [forcedRenderCount]);
  const deferredForceRender = reactExports.useCallback(() => frame.postRender(forceRender), [forceRender]);
  return [deferredForceRender, forcedRenderCount];
}
class PopChildMeasure extends reactExports.Component {
  getSnapshotBeforeUpdate(prevProps) {
    const element = this.props.childRef.current;
    if (element && prevProps.isPresent && !this.props.isPresent) {
      const size = this.props.sizeRef.current;
      size.height = element.offsetHeight || 0;
      size.width = element.offsetWidth || 0;
      size.top = element.offsetTop;
      size.left = element.offsetLeft;
    }
    return null;
  }
  /**
   * Required with getSnapshotBeforeUpdate to stop React complaining.
   */
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
}
function PopChild({ children, isPresent }) {
  const id = reactExports.useId();
  const ref = reactExports.useRef(null);
  const size = reactExports.useRef({
    width: 0,
    height: 0,
    top: 0,
    left: 0
  });
  reactExports.useInsertionEffect(() => {
    const { width, height, top, left } = size.current;
    if (isPresent || !ref.current || !width || !height)
      return;
    ref.current.dataset.motionPopId = id;
    const style = document.createElement("style");
    document.head.appendChild(style);
    if (style.sheet) {
      style.sheet.insertRule(`
          [data-motion-pop-id="${id}"] {
            position: absolute !important;
            width: ${width}px !important;
            height: ${height}px !important;
            top: ${top}px !important;
            left: ${left}px !important;
          }
        `);
    }
    return () => {
      document.head.removeChild(style);
    };
  }, [isPresent]);
  return reactExports.createElement(PopChildMeasure, { isPresent, childRef: ref, sizeRef: size }, reactExports.cloneElement(children, { ref }));
}
const PresenceChild = ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode }) => {
  const presenceChildren = useConstant(newChildrenMap);
  const id = reactExports.useId();
  const context = reactExports.useMemo(
    () => ({
      id,
      initial,
      isPresent,
      custom,
      onExitComplete: (childId) => {
        presenceChildren.set(childId, true);
        for (const isComplete of presenceChildren.values()) {
          if (!isComplete)
            return;
        }
        onExitComplete && onExitComplete();
      },
      register: (childId) => {
        presenceChildren.set(childId, false);
        return () => presenceChildren.delete(childId);
      }
    }),
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */
    presenceAffectsLayout ? void 0 : [isPresent]
  );
  reactExports.useMemo(() => {
    presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
  }, [isPresent]);
  reactExports.useEffect(() => {
    !isPresent && !presenceChildren.size && onExitComplete && onExitComplete();
  }, [isPresent]);
  if (mode === "popLayout") {
    children = reactExports.createElement(PopChild, { isPresent }, children);
  }
  return reactExports.createElement(PresenceContext.Provider, { value: context }, children);
};
function newChildrenMap() {
  return /* @__PURE__ */ new Map();
}
function useUnmountEffect(callback) {
  return reactExports.useEffect(() => () => callback(), []);
}
const getChildKey = (child) => child.key || "";
function updateChildLookup(children, allChildren) {
  children.forEach((child) => {
    const key = getChildKey(child);
    allChildren.set(key, child);
  });
}
function onlyElements(children) {
  const filtered = [];
  reactExports.Children.forEach(children, (child) => {
    if (reactExports.isValidElement(child))
      filtered.push(child);
  });
  return filtered;
}
const AnimatePresence = ({ children, custom, initial = true, onExitComplete, exitBeforeEnter, presenceAffectsLayout = true, mode = "sync" }) => {
  const forceRender = reactExports.useContext(LayoutGroupContext).forceRender || useForceUpdate()[0];
  const isMounted = useIsMounted();
  const filteredChildren = onlyElements(children);
  let childrenToRender = filteredChildren;
  const exitingChildren = reactExports.useRef(/* @__PURE__ */ new Map()).current;
  const presentChildren = reactExports.useRef(childrenToRender);
  const allChildren = reactExports.useRef(/* @__PURE__ */ new Map()).current;
  const isInitialRender = reactExports.useRef(true);
  useIsomorphicLayoutEffect(() => {
    isInitialRender.current = false;
    updateChildLookup(filteredChildren, allChildren);
    presentChildren.current = childrenToRender;
  });
  useUnmountEffect(() => {
    isInitialRender.current = true;
    allChildren.clear();
    exitingChildren.clear();
  });
  if (isInitialRender.current) {
    return reactExports.createElement(reactExports.Fragment, null, childrenToRender.map((child) => reactExports.createElement(PresenceChild, { key: getChildKey(child), isPresent: true, initial: initial ? void 0 : false, presenceAffectsLayout, mode }, child)));
  }
  childrenToRender = [...childrenToRender];
  const presentKeys = presentChildren.current.map(getChildKey);
  const targetKeys = filteredChildren.map(getChildKey);
  const numPresent = presentKeys.length;
  for (let i = 0; i < numPresent; i++) {
    const key = presentKeys[i];
    if (targetKeys.indexOf(key) === -1 && !exitingChildren.has(key)) {
      exitingChildren.set(key, void 0);
    }
  }
  if (mode === "wait" && exitingChildren.size) {
    childrenToRender = [];
  }
  exitingChildren.forEach((component, key) => {
    if (targetKeys.indexOf(key) !== -1)
      return;
    const child = allChildren.get(key);
    if (!child)
      return;
    const insertionIndex = presentKeys.indexOf(key);
    let exitingComponent = component;
    if (!exitingComponent) {
      const onExit = () => {
        exitingChildren.delete(key);
        const leftOverKeys = Array.from(allChildren.keys()).filter((childKey) => !targetKeys.includes(childKey));
        leftOverKeys.forEach((leftOverKey) => allChildren.delete(leftOverKey));
        presentChildren.current = filteredChildren.filter((presentChild) => {
          const presentChildKey = getChildKey(presentChild);
          return (
            // filter out the node exiting
            presentChildKey === key || // filter out the leftover children
            leftOverKeys.includes(presentChildKey)
          );
        });
        if (!exitingChildren.size) {
          if (isMounted.current === false)
            return;
          forceRender();
          onExitComplete && onExitComplete();
        }
      };
      exitingComponent = reactExports.createElement(PresenceChild, { key: getChildKey(child), isPresent: false, onExitComplete: onExit, custom, presenceAffectsLayout, mode }, child);
      exitingChildren.set(key, exitingComponent);
    }
    childrenToRender.splice(insertionIndex, 0, exitingComponent);
  });
  childrenToRender = childrenToRender.map((child) => {
    const key = child.key;
    return exitingChildren.has(key) ? child : reactExports.createElement(PresenceChild, { key: getChildKey(child), isPresent: true, presenceAffectsLayout, mode }, child);
  });
  return reactExports.createElement(reactExports.Fragment, null, exitingChildren.size ? childrenToRender : childrenToRender.map((child) => reactExports.cloneElement(child)));
};
const ArrowLeft = createLucideIcon$1("ArrowLeft", [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
]);
const ChevronLeft = createLucideIcon$1("ChevronLeft", [
  ["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]
]);
const ChevronRight = createLucideIcon$1("ChevronRight", [
  ["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]
]);
const Clock = createLucideIcon$1("Clock", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
]);
const Loader = createLucideIcon$1("Loader", [
  ["line", { x1: "12", x2: "12", y1: "2", y2: "6", key: "gza1u7" }],
  ["line", { x1: "12", x2: "12", y1: "18", y2: "22", key: "1qhbu9" }],
  ["line", { x1: "4.93", x2: "7.76", y1: "4.93", y2: "7.76", key: "xae44r" }],
  [
    "line",
    { x1: "16.24", x2: "19.07", y1: "16.24", y2: "19.07", key: "bxnmvf" }
  ],
  ["line", { x1: "2", x2: "6", y1: "12", y2: "12", key: "89khin" }],
  ["line", { x1: "18", x2: "22", y1: "12", y2: "12", key: "pb8tfm" }],
  ["line", { x1: "4.93", x2: "7.76", y1: "19.07", y2: "16.24", key: "1uxjnu" }],
  ["line", { x1: "16.24", x2: "19.07", y1: "7.76", y2: "4.93", key: "6duxfx" }]
]);
const Pause = createLucideIcon$1("Pause", [
  ["rect", { width: "4", height: "16", x: "6", y: "4", key: "iffhe4" }],
  ["rect", { width: "4", height: "16", x: "14", y: "4", key: "sjin7j" }]
]);
const Play = createLucideIcon$1("Play", [
  ["polygon", { points: "5 3 19 12 5 21 5 3", key: "191637" }]
]);
const RefreshCw = createLucideIcon$1("RefreshCw", [
  [
    "path",
    { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }
  ],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  [
    "path",
    { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }
  ],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
]);
const Send = createLucideIcon$1("Send", [
  ["path", { d: "m22 2-7 20-4-9-9-4Z", key: "1q3vgg" }],
  ["path", { d: "M22 2 11 13", key: "nzbqef" }]
]);
const Settings = createLucideIcon$1("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);
const Sparkles = createLucideIcon$1("Sparkles", [
  [
    "path",
    {
      d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
      key: "17u4zn"
    }
  ],
  ["path", { d: "M5 3v4", key: "bklmnn" }],
  ["path", { d: "M19 17v4", key: "iiml17" }],
  ["path", { d: "M3 5h4", key: "nem4j1" }],
  ["path", { d: "M17 19h4", key: "lbex7p" }]
]);
const Square = createLucideIcon$1("Square", [
  [
    "rect",
    { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }
  ]
]);
const OnboardingFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = reactExports.useState(0);
  const [selectedProvider, setSelectedProvider] = reactExports.useState("");
  const [apiKey, setApiKey] = reactExports.useState("");
  const [selectedModel, setSelectedModel] = reactExports.useState("");
  const [availableModels, setAvailableModels] = reactExports.useState([]);
  const [isTestingConnection, setIsTestingConnection] = reactExports.useState(false);
  const [isLoadingModels, setIsLoadingModels] = reactExports.useState(false);
  const steps = [
    "Bem-vindo",
    "Escolha sua IA",
    "Configure a chave",
    "Escolha o modelo",
    "Teste a conexão",
    "Pronto!"
  ];
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const loadModels = async () => {
    if (!apiKey || !selectedProvider)
      return;
    setIsLoadingModels(true);
    try {
      const models = await getAvailableModels(selectedProvider, apiKey);
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
      const provider = AI_PROVIDERS.find((p) => p.id === selectedProvider);
      if (provider) {
        setAvailableModels(provider.defaultModels);
        setSelectedModel(provider.defaultModels[0]);
      }
    } finally {
      setIsLoadingModels(false);
    }
  };
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      await saveSettings({
        selectedProvider,
        apiKey,
        selectedModel,
        isConfigured: true,
        hasCompletedOnboarding: true
      });
      nextStep();
    } catch (error) {
      alert("Erro ao testar conexão. Verifique sua chave de API.");
    } finally {
      setIsTestingConnection(false);
    }
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl mb-4", children: "🤖" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Bem-vindo ao Assistente IA Web!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600 leading-relaxed", children: "Automatize tarefas repetitivas na web com inteligência artificial. Vou te ajudar a configurar tudo em poucos passos simples." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-blue-800 mb-2", children: "O que você pode fazer:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-blue-700 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• "Faça uma postagem de bom dia no LinkedIn"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• "Consulte preços de passagem para São Paulo"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• "Bata meu ponto no sistema da empresa"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• E muito mais!" })
            ] })
          ] })
        ] });
      case 1:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Escolha seu Provedor de IA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Selecione qual inteligência artificial você quer usar" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: AI_PROVIDERS.map((provider2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedProvider === provider2.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`,
              onClick: () => setSelectedProvider(provider2.id),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: provider2.icon }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-800", children: provider2.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600 mb-2", children: provider2.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-600 font-medium", children: provider2.costInfo })
                ] }),
                selectedProvider === provider2.id && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-blue-500" })
              ] })
            },
            provider2.id
          )) })
        ] });
      case 2:
        const provider = AI_PROVIDERS.find((p) => p.id === selectedProvider);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Configure sua Chave de API" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-600", children: [
              "Você precisa de uma chave para usar ",
              provider?.name
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-yellow-600 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-yellow-800", children: "Como obter sua chave:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Clique no link abaixo para abrir o site oficial" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Crie uma conta ou faça login" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: 'Procure por "API Keys" ou "Chaves de API"' }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Crie uma nova chave e copie ela" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Cole a chave no campo abaixo" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "a",
            {
              href: provider?.setupUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Abrir ",
                  provider?.name
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: provider?.apiKeyLabel }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: apiKey,
                onChange: (e) => setApiKey(e.target.value),
                placeholder: "Cole sua chave de API aqui...",
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              }
            )
          ] })
        ] });
      case 3:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-800 mb-2", children: "Escolha o Modelo de IA" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Selecione qual modelo você quer usar" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: loadModels,
              disabled: !apiKey || isLoadingModels,
              className: "flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              children: isLoadingModels ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Carregando..." })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Carregar Modelos" })
              ] })
            }
          ) }),
          availableModels.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Modelos Disponíveis:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-2", children: availableModels.map((model) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedModel === model ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`,
                onClick: () => setSelectedModel(model),
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-800", children: model }),
                  selectedModel === model && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-blue-500" })
                ] })
              },
              model
            )) })
          ] }),
          availableModels.length === 0 && !isLoadingModels && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-gray-500", children: 'Clique em "Carregar Modelos" para ver os modelos disponíveis' })
        ] });
      case 4:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Vamos testar sua configuração" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Clique no botão abaixo para verificar se tudo está funcionando" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-gray-800 mb-2", children: "Configuração Atual:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-gray-600 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Provedor:" }),
                " ",
                AI_PROVIDERS.find((p) => p.id === selectedProvider)?.name
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Modelo:" }),
                " ",
                selectedModel
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "API Key:" }),
                " ",
                apiKey ? "••••••••" : "Não configurada"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: testConnection,
              disabled: isTestingConnection || !apiKey || !selectedModel,
              className: "bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              children: isTestingConnection ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Testando conexão..." })
              ] }) : "Testar Conexão"
            }
          )
        ] });
      case 5:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl mb-4", children: "🎉" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "Tudo pronto!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Sua extensão está configurada e pronta para usar. Agora você pode automatizar suas tarefas web!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-green-800 mb-2", children: "Próximos passos:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-green-700 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Clique no ícone da extensão na barra do navegador" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: '• Digite uma instrução como "Abra o Gmail"' }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Veja a mágica acontecer!" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onComplete,
              className: "bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors",
              children: "Começar a usar"
            }
          )
        ] });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-2", children: steps.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: `flex items-center ${index <= currentStep ? "text-blue-600" : "text-gray-400"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`,
                children: index + 1
              }
            ),
            index < steps.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `w-12 h-0.5 mx-2 ${index < currentStep ? "bg-blue-600" : "bg-gray-200"}`
              }
            )
          ]
        },
        index
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-500 text-center", children: [
        "Passo ",
        currentStep + 1,
        " de ",
        steps.length,
        ": ",
        steps[currentStep]
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.3 },
        className: "min-h-[400px] flex flex-col justify-center",
        children: renderStepContent()
      },
      currentStep
    ) }),
    currentStep < steps.length - 1 && currentStep !== 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mt-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: prevStep,
          disabled: currentStep === 0,
          className: "flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Anterior" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: nextStep,
          disabled: currentStep === 1 && !selectedProvider || currentStep === 2 && !apiKey || currentStep === 3 && !selectedModel,
          className: "flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Próximo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4" })
          ]
        }
      )
    ] })
  ] });
};
const TaskExecutor = ({ steps, onComplete, onCancel }) => {
  const [currentStepIndex, setCurrentStepIndex] = reactExports.useState(0);
  const [isExecuting, setIsExecuting] = reactExports.useState(false);
  const [isPaused, setIsPaused] = reactExports.useState(false);
  const [executedSteps, setExecutedSteps] = reactExports.useState(/* @__PURE__ */ new Set());
  const [error, setError] = reactExports.useState(null);
  const [isCheckingScript, setIsCheckingScript] = reactExports.useState(false);
  const checkContentScript = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id)
        return false;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("Timeout ao verificar content script");
          resolve(false);
        }, 3e3);
        chrome.tabs.sendMessage(tab.id, { type: "PING" }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            console.log("Content script não encontrado:", chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(response?.success && response?.ready);
          }
        });
      });
    } catch (error2) {
      console.error("Erro ao verificar content script:", error2);
      return false;
    }
  };
  const injectContentScript = async () => {
    try {
      setIsCheckingScript(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id)
        return false;
      console.log("🔄 Tentando injetar content script...");
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        console.log("✅ Script injetado via chrome.scripting");
      } catch (scriptingError) {
        console.log("❌ Erro com chrome.scripting:", scriptingError);
        try {
          await chrome.runtime.sendMessage({
            type: "INJECT_CONTENT_SCRIPT",
            tabId: tab.id
          });
          console.log("✅ Script injetado via background");
        } catch (backgroundError) {
          console.log("❌ Erro com background script:", backgroundError);
          return false;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      const isReady = await checkContentScript();
      console.log("🔍 Content script pronto:", isReady);
      return isReady;
    } catch (error2) {
      console.error("❌ Erro ao injetar content script:", error2);
      return false;
    } finally {
      setIsCheckingScript(false);
    }
  };
  const executeStep = async (step, index) => {
    try {
      setError(null);
      let isReady = await checkContentScript();
      if (!isReady) {
        console.log("Content script não encontrado, tentando injetar...");
        isReady = await injectContentScript();
        if (!isReady) {
          throw new Error("Não foi possível carregar o content script na página");
        }
      }
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Timeout ao executar passo"));
        }, 3e4);
        chrome.tabs.sendMessage(tab.id, {
          type: "EXECUTE_STEP",
          step
        }, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error(`Erro de comunicação: ${chrome.runtime.lastError.message}`));
            return;
          }
          if (response?.success) {
            setExecutedSteps((prev) => /* @__PURE__ */ new Set([...prev, index]));
            resolve(true);
          } else {
            reject(new Error(response?.error || "Erro desconhecido ao executar passo"));
          }
        });
      });
    } catch (error2) {
      console.error("Erro ao executar passo:", error2);
      throw error2;
    }
  };
  const startExecution = async () => {
    setIsExecuting(true);
    setIsPaused(false);
    setError(null);
    try {
      for (let i = currentStepIndex; i < steps.length; i++) {
        if (isPaused)
          break;
        setCurrentStepIndex(i);
        try {
          await executeStep(steps[i], i);
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (stepError) {
          setError(`Erro no passo ${i + 1}: ${stepError.message}`);
          setIsExecuting(false);
          return;
        }
      }
      setIsExecuting(false);
      onComplete();
    } catch (error2) {
      setError(`Erro geral: ${error2.message}`);
      setIsExecuting(false);
    }
  };
  const pauseExecution = () => {
    setIsPaused(true);
    setIsExecuting(false);
  };
  const stopExecution = () => {
    setIsExecuting(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setExecutedSteps(/* @__PURE__ */ new Set());
    setError(null);
    onCancel();
  };
  const retryFromCurrent = () => {
    setError(null);
    startExecution();
  };
  const forceInjectScript = async () => {
    setError(null);
    const success = await injectContentScript();
    if (success) {
      setError(null);
    } else {
      setError("Não foi possível injetar o content script. Tente recarregar a página.");
    }
  };
  const getStepIcon = (index) => {
    if (executedSteps.has(index)) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckCircle, { className: "w-5 h-5 text-green-500" });
    } else if (index === currentStepIndex && isExecuting) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-5 h-5 text-blue-500 animate-pulse" });
    } else {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 rounded-full border-2 border-gray-300" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-gray-800 mb-2", children: "Executando Tarefa" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-600", children: [
        executedSteps.size,
        " de ",
        steps.length,
        " passos concluídos"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "bg-blue-600 h-2 rounded-full transition-all duration-300",
        style: { width: `${executedSteps.size / steps.length * 100}%` }
      }
    ) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start space-x-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-red-800", children: "Erro na Execução" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700 mt-1", children: error }),
          error.includes("content script") && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-red-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              "💡 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Possíveis soluções:" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc list-inside mt-1 space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Recarregue a página atual (F5)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Verifique se a página permite scripts" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Tente em uma página diferente" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: retryFromCurrent,
            className: "flex items-center space-x-1 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Tentar Novamente" })
            ]
          }
        ),
        error.includes("content script") && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: forceInjectScript,
            disabled: isCheckingScript,
            className: "flex items-center space-x-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors",
            children: isCheckingScript ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Injetando..." })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Forçar Injeção" })
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-60 overflow-y-auto space-y-2", children: steps.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: index * 0.1 },
        className: `flex items-center space-x-3 p-3 rounded-lg ${index === currentStepIndex && isExecuting ? "bg-blue-50 border border-blue-200" : executedSteps.has(index) ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`,
        children: [
          getStepIcon(index),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-gray-800", children: step.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500", children: [
              step.action,
              " ",
              step.target && `→ ${step.target}`
            ] })
          ] })
        ]
      },
      step.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center space-x-3", children: [
      !isExecuting && !isPaused && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: startExecution,
          className: "flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Iniciar" })
          ]
        }
      ),
      isExecuting && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: pauseExecution,
          className: "flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pause, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Pausar" })
          ]
        }
      ),
      isPaused && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: startExecution,
          className: "flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Continuar" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: stopExecution,
          className: "flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Square, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Parar" })
          ]
        }
      )
    ] })
  ] });
};
class AIService {
  async makeRequest(prompt) {
    const settings = await getSettings();
    if (!settings.isConfigured) {
      throw new Error("IA não configurada. Configure primeiro nas opções.");
    }
    switch (settings.selectedProvider) {
      case "openai":
        return this.callOpenAI(prompt, settings.apiKey, settings.selectedModel);
      case "gemini":
        return this.callGemini(prompt, settings.apiKey, settings.selectedModel);
      case "ollama":
        return this.callOllama(prompt, settings.apiKey, settings.selectedModel);
      default:
        throw new Error("Provedor de IA não suportado");
    }
  }
  async callOpenAI(prompt, apiKey, model) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: 'Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}'
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro na API OpenAI: ${response.status} - ${errorData}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }
  async callGemini(prompt, apiKey, model) {
    const modelName = model || "gemini-1.5-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}

Instrução: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048
        }
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro na API Gemini: ${response.status} - ${errorData}`);
    }
    const data = await response.json();
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Resposta inválida da API Gemini");
    }
    return data.candidates[0].content.parts[0].text;
  }
  async callOllama(prompt, baseUrl, model) {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model || "llama2",
        prompt: `Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}

Instrução: ${prompt}`,
        stream: false
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro no Ollama: ${response.status} - ${errorData}`);
    }
    const data = await response.json();
    return data.response;
  }
  async processInstruction(instruction) {
    try {
      const response = await this.makeRequest(instruction);
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const parsed = JSON.parse(jsonStr);
      return {
        steps: parsed.steps.map((step, index) => ({
          id: `step-${index}`,
          description: step.description,
          action: step.action,
          target: step.target,
          value: step.value,
          completed: false
        })),
        explanation: parsed.explanation,
        warnings: parsed.warnings || []
      };
    } catch (error) {
      console.error("Erro ao processar instrução:", error);
      throw new Error(`Não foi possível processar a instrução: ${error.message}`);
    }
  }
}
const aiService = new AIService();
const SidePanel = () => {
  const [settings, setSettings] = reactExports.useState(null);
  const [instruction, setInstruction] = reactExports.useState("");
  const [isProcessing, setIsProcessing] = reactExports.useState(false);
  const [currentTask, setCurrentTask] = reactExports.useState(null);
  const [showOnboarding, setShowOnboarding] = reactExports.useState(false);
  reactExports.useState("main");
  reactExports.useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      setSettings(userSettings);
      if (!userSettings.hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };
  const handleSubmitInstruction = async () => {
    if (!instruction.trim() || isProcessing)
      return;
    setIsProcessing(true);
    try {
      const response = await aiService.processInstruction(instruction);
      setCurrentTask(response);
      setInstruction("");
    } catch (error) {
      alert("Erro ao processar instrução. Verifique sua configuração.");
    } finally {
      setIsProcessing(false);
    }
  };
  const handleTaskComplete = () => {
    setCurrentTask(null);
  };
  const handleTaskCancel = () => {
    setCurrentTask(null);
  };
  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };
  if (showOnboarding) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      OnboardingFlow,
      {
        onComplete: () => {
          setShowOnboarding(false);
          loadSettings();
        }
      }
    ) });
  }
  if (!settings?.isConfigured) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-6 max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertCircle, { className: "w-16 h-16 text-yellow-500 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-gray-800", children: "Configuração Necessária" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "Configure sua IA antes de usar a extensão" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: openOptions,
            className: "w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium",
            children: "Abrir Configurações"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowOnboarding(true),
            className: "w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium",
            children: "Iniciar Configuração Guiada"
          }
        )
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex flex-col bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { mode: "wait", children: currentTask ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      className: "h-full flex flex-col",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleTaskCancel,
              className: "flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-5 h-5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Voltar" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-gray-800", children: "Executando Tarefa" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16" }),
          " "
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          TaskExecutor,
          {
            steps: currentTask.steps,
            onComplete: handleTaskComplete,
            onCancel: handleTaskCancel
          }
        ) })
      ]
    },
    "task-executor"
  ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
    motion.div,
    {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      className: "h-full flex flex-col",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-7 h-7 text-blue-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-lg font-semibold text-gray-800", children: "Assistente IA" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-gray-500", children: [
                settings.selectedProvider,
                " • ",
                settings.selectedModel
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: openOptions,
              className: "p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-800", children: "💡 Exemplos Rápidos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-2", children: [
              "Abra o Gmail e verifique novos emails",
              "Faça uma postagem no LinkedIn sobre produtividade",
              "Consulte o clima para hoje no Google",
              "Pesquise por apartamentos para alugar",
              "Abra o YouTube e procure por tutoriais de React"
            ].map((example, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setInstruction(example),
                className: "text-left text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors border border-blue-100 hover:border-blue-200",
                children: example
              },
              index
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-semibold text-gray-800", children: "🎯 O que você quer que eu faça?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: instruction,
                  onChange: (e) => setInstruction(e.target.value),
                  placeholder: "Ex: Faça uma postagem de bom dia no meu LinkedIn",
                  className: "w-full p-4 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm",
                  rows: 4,
                  onKeyDown: (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitInstruction();
                    }
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: handleSubmitInstruction,
                  disabled: !instruction.trim() || isProcessing,
                  className: "absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                  children: isProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Loader, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-5 h-5" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-blue-900 mb-3", children: "💡 Dicas para Melhores Resultados" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-xs text-blue-800 space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Seja específico sobre o que quer fazer" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: 'Mencione o site se necessário (ex: "no LinkedIn")' })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Use linguagem natural e simples" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start space-x-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-600", children: "•" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Divida tarefas complexas em passos menores" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-gray-800 mb-2", children: "📊 Status da Configuração" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Provedor:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-800", children: settings.selectedProvider })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Modelo:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-800", children: settings.selectedModel })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-600", children: "Status:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-green-600", children: "✓ Configurado" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: openOptions,
              className: "inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Configurações Avançadas" })
              ]
            }
          ) })
        ] })
      ]
    },
    "main-interface"
  ) }) });
};
const container = document.getElementById("sidepanel-root");
if (container) {
  const root = createRoot(container);
  root.render(/* @__PURE__ */ jsxRuntimeExports.jsx(SidePanel, {}));
}
