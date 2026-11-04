import { useCallback, useEffect, useRef, useState } from "react";
import { generateCode } from "./generateCode";
import { AppState, AppTheme, EditorTheme, Settings } from "./types";
import {
  BUILTIN_DESIGN_SYSTEM_ID,
  NEW_DESIGN_SYSTEM_CONTENT,
} from "./lib/design-systems";
import { IS_RUNNING_ON_CLOUD } from "./config";
import { OnboardingNote } from "./components/messages/OnboardingNote";
import { usePersistedState } from "./hooks/usePersistedState";
import TermsOfServiceDialog from "./components/TermsOfServiceDialog";
import { USER_CLOSE_WEB_SOCKET_CODE } from "./constants";
import toast from "react-hot-toast";
import { nanoid } from "nanoid";
import { Stack } from "./lib/stacks";
import { CodeGenerationModel } from "./lib/models";
import useBrowserTabIndicator from "./hooks/useBrowserTabIndicator";
import { LuChevronLeft } from "react-icons/lu";
import {
  buildAssistantHistoryMessage,
  buildUpdateGenerationRequest,
  buildUserHistoryMessage,
  cloneVariantHistory,
  GenerationRequest,
  registerAssetIds,
} from "./lib/prompt-history";
// import TipLink from "./components/messages/TipLink";
import { useAppStore } from "./store/app-store";
import { useProjectStore } from "./store/project-store";
import { useDesignSystems } from "./hooks/useDesignSystems";
import {
  buildSelectedElementInstruction,
  describeElementContext,
} from "./components/select-and-edit/utils";
import { useEscapeToExitSelectMode } from "./components/select-and-edit/useEscapeToExitSelectMode";
import Sidebar from "./components/sidebar/Sidebar";
import IconStrip, { PanelId } from "./components/sidebar/IconStrip";
import HistoryDisplay from "./components/history/HistoryDisplay";
import PreviewPane from "./components/preview/PreviewPane";
import EditorPane from "./components/editor/EditorPane";
import ProjectsPanel from "./components/projects/ProjectsPanel";
import DesignPanel from "./components/design/DesignPanel";
import StartPane from "./components/start-pane/StartPane";
import SettingsTab from "./components/settings/SettingsTab";
import DesignSystemsModal from "./components/settings/DesignSystemsModal";
import { AiEditCommit, Commit } from "./components/commits/types";
import { createCommit } from "./components/commits/utils";
import { useProjectsStore } from "./store/projects-store";

function App() {
  const {
    // Inputs
    inputMode,
    setInputMode,
    referenceImages,
    setReferenceImages,
    initialPrompt,
    setInitialPrompt,
    upsertPromptAssets,
    resetPromptAssets,

    head,
    commits,
    addCommit,
    removeCommit,
    setHead,
    appendCommitCode,
    setCommitCode,
    resetCommits,
    resetHead,
    updateVariantStatus,
    resizeVariants,
    setVariantModels,
    appendVariantHistoryMessage,
    startAgentEvent,
    appendAgentEventContent,
    finishAgentEvent,

    // Outputs
    appendExecutionConsole,
    resetExecutionConsoles,
  } = useProjectStore();

  const {
    disableInSelectAndEditMode,
    setUpdateInstruction,
    updateImages,
    setUpdateImages,
    appState,
    setAppState,
    selectedElement,
    setSelectedElement,
  } = useAppStore();

  const activeProjectId = useProjectsStore((s) => s.activeProjectId);
  const snapshotActive = useProjectsStore((s) => s.snapshotActive);
  const createProject = useProjectsStore((s) => s.createProject);
  const updateActiveMeta = useProjectsStore((s) => s.updateActiveMeta);

  // Last autosave outcome, surfaced as a subtle status pill in the workspace.
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const performSnapshot = useCallback(() => {
    if (!activeProjectId) return;
    setSaveState("saving");
    const result = snapshotActive();
    if (result === "quota") {
      toast.error(
        "Browser storage is full — the latest version could not be saved. " +
          "Delete an old project to free space."
      );
    }
    window.setTimeout(() => setSaveState("saved"), 200);
  }, [activeProjectId, snapshotActive]);

  // Persist on every state transition (create/complete/cancel).
  useEffect(() => {
    if (activeProjectId) snapshotActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  // Debounced autosave while code streams in, so a mid-generation refresh does
  // not lose the partially built variant. The commits object identity changes
  // on every streamed chunk, which re-arms this timer.
  useEffect(() => {
    if (appState !== AppState.CODING || !activeProjectId) return;
    const timer = window.setTimeout(performSnapshot, 2500);
    return () => window.clearTimeout(timer);
  }, [commits, appState, activeProjectId, performSnapshot]);

  // Settings
  const [settings, setSettings] = usePersistedState<Settings>(
    {
      openAiApiKey: null,
      openAiBaseURL: null,
      replicateApiKey: null,
      anthropicApiKey: null,
      geminiApiKey: null,
      geminiApiKeys: [],
      screenshotOneApiKey: null,
      isImageGenerationEnabled: true,
      editorTheme: EditorTheme.COBALT,
      generatedCodeConfig: Stack.HTML_TAILWIND,
      codeGenerationModel: CodeGenerationModel.GEMINI_3_FLASH_PREVIEW_MINIMAL,
      selectedDesignSystemId: null,
      customPrompt: null,
      // Only relevant for hosted version
      isTermOfServiceAccepted: false,
    },
    "setting"
  );
  const [appTheme, setAppTheme] = usePersistedState<AppTheme>(
    AppTheme.SYSTEM,
    "app-theme"
  );

  // Resolved appearance for the icon-strip toggle (System follows the OS).
  const isDarkMode =
    appTheme === AppTheme.DARK ||
    (appTheme === AppTheme.SYSTEM &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const toggleAppTheme = () =>
    setAppTheme(isDarkMode ? AppTheme.LIGHT : AppTheme.DARK);

  // Icon rail vs full labeled sidebar (persisted across sessions).
  const [sidebarExpanded, setSidebarExpanded] = usePersistedState<boolean>(
    false,
    "sidebar-expanded"
  );

  const wsRef = useRef<WebSocket>(null);
  const lastThinkingEventIdRef = useRef<Record<number, string>>({});
  const lastAssistantEventIdRef = useRef<Record<number, string>>({});
  const lastToolEventIdRef = useRef<Record<number, string>>({});

  const [panel, setPanel] = useState<PanelId>("chat");
  const [mobilePane, setMobilePane] = useState<"preview" | "chat">("preview");
  const [isDesignSystemsModalOpen, setIsDesignSystemsModalOpen] =
    useState(false);
  const [designSystemsModalInitialId, setDesignSystemsModalInitialId] =
    useState<string | null>(null);
  const {
    designSystems,
    isLoading: areDesignSystemsLoading,
    createDesignSystem,
    updateDesignSystem,
    deleteDesignSystem,
  } = useDesignSystems();

  const setSelectedDesignSystemId = useCallback(
    (id: string | null) => {
      setSettings((prev) => ({ ...prev, selectedDesignSystemId: id }));
    },
    [setSettings]
  );

  const openDesignSystemsManager = useCallback((focusedId?: string | null) => {
    setDesignSystemsModalInitialId(focusedId ?? null);
    setIsDesignSystemsModalOpen(true);
  }, []);

  const handleAddNewDesignSystem = useCallback(async () => {
    try {
      const isFirst = designSystems.length === 0;
      const created = await createDesignSystem({
        name: `Design system ${designSystems.length + 1}`,
        content: NEW_DESIGN_SYSTEM_CONTENT,
      });
      if (isFirst) {
        setSelectedDesignSystemId(created.id);
      }
      openDesignSystemsManager(created.id);
    } catch (error) {
      console.error("Failed to create design system", error);
      toast.error("Could not create design system.");
    }
  }, [
    createDesignSystem,
    designSystems.length,
    openDesignSystemsManager,
    setSelectedDesignSystemId,
  ]);
  // Indicate coding state using the browser tab's favicon and title
  useBrowserTabIndicator(appState === AppState.CODING);

  useEscapeToExitSelectMode();

  // When the user already has the settings in local storage, newly added keys
  // do not get added to the settings so if it's falsy, we populate it with the default
  // value
  useEffect(() => {
    if (!settings.generatedCodeConfig) {
      setSettings((prev) => ({
        ...prev,
        generatedCodeConfig: Stack.HTML_TAILWIND,
      }));
    }
  }, [settings.generatedCodeConfig, setSettings]);

  useEffect(() => {
    if (!("selectedDesignSystemId" in settings)) {
      setSettings((prev) => ({
        ...prev,
        selectedDesignSystemId: null,
      }));
    }
  }, [settings, setSettings]);

  // First-ever launch (no stored choice yet): default to the built-in
  // ScreGPT Signature design system so generations start polished.
  useEffect(() => {
    if (areDesignSystemsLoading) return;
    if ("selectedDesignSystemId" in settings) return;
    if (
      designSystems.some(
        (designSystem) => designSystem.id === BUILTIN_DESIGN_SYSTEM_ID
      )
    ) {
      setSettings((prev) => ({
        ...prev,
        selectedDesignSystemId: BUILTIN_DESIGN_SYSTEM_ID,
      }));
    }
  }, [areDesignSystemsLoading, designSystems, settings, setSettings]);

  // Older persisted settings predate the custom prompt field; backfill it so
  // the Design panel has a stable value to bind to.
  useEffect(() => {
    if (!("customPrompt" in settings)) {
      setSettings((prev) => ({
        ...prev,
        customPrompt: null,
      }));
    }
  }, [settings, setSettings]);

  // Migrate a stored single Gemini key into the new multi-key list once the
  // `geminiApiKeys` field is missing from older local-storage settings.
  useEffect(() => {
    if (!Array.isArray(settings.geminiApiKeys)) {
      setSettings((prev) => ({
        ...prev,
        geminiApiKeys: prev.geminiApiKey ? [prev.geminiApiKey] : [],
      }));
    }
  }, [settings.geminiApiKeys, settings.geminiApiKey, setSettings]);


  useEffect(() => {
    if (
      settings.selectedDesignSystemId &&
      !areDesignSystemsLoading &&
      !designSystems.some(
        (designSystem) => designSystem.id === settings.selectedDesignSystemId
      )
    ) {
      setSettings((prev) => ({
        ...prev,
        selectedDesignSystemId: null,
      }));
    }
  }, [
    areDesignSystemsLoading,
    designSystems,
    settings.selectedDesignSystemId,
    setSettings,
  ]);

  // Per-project memory of stack + design system: when the active project
  // changes, restore its saved choices into the live settings.
  useEffect(() => {
    if (!activeProjectId) return;
    const project = useProjectsStore
      .getState()
      .projects.find((p) => p.id === activeProjectId);
    if (!project) return;
    setSettings((prev) => {
      if (
        prev.generatedCodeConfig === project.stack &&
        prev.selectedDesignSystemId === project.designSystemId
      ) {
        return prev;
      }
      return {
        ...prev,
        generatedCodeConfig: project.stack,
        selectedDesignSystemId: project.designSystemId,
      };
    });
  }, [activeProjectId, setSettings]);

  // Mirror stack + design system changes back onto the active project so the
  // next time it is opened the same choices are restored.
  useEffect(() => {
    if (!activeProjectId) return;
    updateActiveMeta({
      stack: settings.generatedCodeConfig,
      designSystemId: settings.selectedDesignSystemId,
    });
  }, [
    activeProjectId,
    settings.generatedCodeConfig,
    settings.selectedDesignSystemId,
    updateActiveMeta,
  ]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark =
        appTheme === AppTheme.DARK ||
        (appTheme === AppTheme.SYSTEM && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.body.classList.toggle("dark", isDark);
    };
    applyTheme();

    if (appTheme !== AppTheme.SYSTEM) {
      return;
    }

    const onChange = () => applyTheme();
    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [appTheme]);

  const getAssetsById = () => useProjectStore.getState().assetsById;

  // Functions
  const reset = () => {
    // Stop any in-flight generation so late websocket events can't mutate
    // state after the reset (e.g. flipping the app back to CODE_READY).
    cancelCodeGeneration();
    setAppState(AppState.INITIAL);
    setUpdateInstruction("");
    setUpdateImages([]);
    disableInSelectAndEditMode();
    resetExecutionConsoles();

    resetCommits();
    resetHead();
    resetPromptAssets();

    // Inputs
    setInputMode("image");
    setReferenceImages([]);
  };

  const regenerate = () => {
    if (head === null) {
      toast.error(
        "No current version set. Please contact support via chat or Github."
      );
      throw new Error("Regenerate called with no head");
    }

    const currentCommit = commits[head];
    if (!currentCommit) {
      toast.error("The selected version could not be found.");
      return;
    }

    if (currentCommit.type === "ai_edit") {
      regenerateUpdate(currentCommit);
      return;
    }

    if (currentCommit.type === "code_create") {
      toast.error("Imported code cannot be regenerated.");
      return;
    }

    // Re-run the initial create request.
    if (inputMode === "image" || inputMode === "video") {
      doCreate(referenceImages, inputMode);
    } else {
      doCreateFromText(initialPrompt);
    }
  };

  // Used when the user cancels the code generation
  const cancelCodeGeneration = () => {
    wsRef.current?.close?.(USER_CLOSE_WEB_SOCKET_CODE);
  };

  // Used for user-initiated cancellation and failed edit rollbacks
  const cancelCodeGenerationAndReset = (commit: Commit) => {
    // When the current commit is the first version, reset the entire app state
    if (commit.type === "ai_create") {
      reset();
    } else {
      // Otherwise, remove current commit from commits
      removeCommit(commit.hash);

      // Revert to parent commit
      const parentCommitHash = commit.parentHash;
      if (parentCommitHash) {
        setHead(parentCommitHash);
      } else {
        throw new Error("Parent commit not found");
      }

      setAppState(AppState.CODE_READY);
    }
  };

  function doGenerateCode(
    params: GenerationRequest,
    generationParentHash: string | null = head
  ) {
    // Reset the execution console
    resetExecutionConsoles();

    // Set the app state to coding during generation
    setAppState(AppState.CODING);

    const { variantHistory, ...requestParams } = params;

    const selectedDesignSystem = designSystems.find(
      (designSystem) => designSystem.id === settings.selectedDesignSystemId
    );

    // Merge settings with params
    const updatedParams = {
      ...settings,
      ...requestParams,
      designSystem: selectedDesignSystem?.content ?? null,
    };

    // Use 4 variants for create, 2 for edits to match backend counts
    // and avoid a flash when the backend sends the actual variant count
    const initialVariantCount =
      requestParams.generationType === "create" ? 4 : 2;
    const baseCommitObject = {
      variants: Array(initialVariantCount)
        .fill(null)
        .map(() => ({
          code: "",
          history: cloneVariantHistory(variantHistory),
        })),
    };

    const commitInputObject =
      requestParams.generationType === "create"
        ? {
            ...baseCommitObject,
            type: "ai_create" as const,
            parentHash: null,
            inputs: requestParams.prompt,
          }
        : {
            ...baseCommitObject,
            type: "ai_edit" as const,
            parentHash: generationParentHash,
            inputs: requestParams.prompt,
          };

    // Create a new commit and set it as the head
    const commit = createCommit(commitInputObject);
    addCommit(commit);
    setHead(commit.hash);

    lastThinkingEventIdRef.current = {};
    lastAssistantEventIdRef.current = {};
    lastToolEventIdRef.current = {};

    const finishThinkingEvent = (variantIndex: number, status: "complete" | "error") => {
      const eventId = lastThinkingEventIdRef.current[variantIndex];
      if (!eventId) return;
      finishAgentEvent(commit.hash, variantIndex, eventId, {
        status,
        endedAt: Date.now(),
      });
      delete lastThinkingEventIdRef.current[variantIndex];
    };

    const finishAssistantEvent = (variantIndex: number, status: "complete" | "error") => {
      const eventId = lastAssistantEventIdRef.current[variantIndex];
      if (!eventId) return;
      finishAgentEvent(commit.hash, variantIndex, eventId, {
        status,
        endedAt: Date.now(),
      });
      delete lastAssistantEventIdRef.current[variantIndex];
    };

    const finishToolEvent = (variantIndex: number, status: "complete" | "error") => {
      const eventId = lastToolEventIdRef.current[variantIndex];
      if (!eventId) return;
      finishAgentEvent(commit.hash, variantIndex, eventId, {
        status,
        endedAt: Date.now(),
      });
      delete lastToolEventIdRef.current[variantIndex];
    };

    const finishInFlightEvents = (status: "complete" | "error") => {
      Object.keys(lastThinkingEventIdRef.current).forEach((key) => {
        finishThinkingEvent(Number(key), status);
      });
      Object.keys(lastAssistantEventIdRef.current).forEach((key) => {
        finishAssistantEvent(Number(key), status);
      });
      Object.keys(lastToolEventIdRef.current).forEach((key) => {
        finishToolEvent(Number(key), status);
      });
    };

    generateCode(wsRef, updatedParams, {
      onChange: (token, variantIndex) => {
        appendCommitCode(commit.hash, variantIndex, token);
      },
      onSetCode: (code, variantIndex) => {
        setCommitCode(commit.hash, variantIndex, code);
      },
      onStatusUpdate: (line, variantIndex) =>
        appendExecutionConsole(variantIndex, line),
      onVariantComplete: (variantIndex) => {
        console.log(`Variant ${variantIndex} complete event received`);
        updateVariantStatus(commit.hash, variantIndex, "complete");
        const currentCode =
          useProjectStore.getState().commits[commit.hash]?.variants[variantIndex]
            ?.code || "";
        if (currentCode.trim().length > 0) {
          appendVariantHistoryMessage(
            commit.hash,
            variantIndex,
            buildAssistantHistoryMessage(currentCode)
          );
        }
        finishThinkingEvent(variantIndex, "complete");
        finishAssistantEvent(variantIndex, "complete");
        finishToolEvent(variantIndex, "complete");
        if (commit.type === "ai_edit") {
          const {
            updateInstruction: currentInstruction,
            updateImages: currentImages,
          } = useAppStore.getState();
          const instructionUnchanged =
            currentInstruction === commit.inputs.text;
          const imagesUnchanged =
            currentImages.length === commit.inputs.images.length &&
            currentImages.every(
              (image, index) => image === commit.inputs.images[index]
            );

          // This conditional clear handles three UX scenarios:
          // 1) All variants fail: no completion event, so keep prompt/images for retry.
          // 2) A variant completes and user has typed/changed images: do not clear.
          // 3) A variant completes and user has not changed draft: clear for next edit.
          if (instructionUnchanged && imagesUnchanged) {
            setUpdateInstruction("");
            setUpdateImages([]);
          }
        }
        snapshotActive();
      },
      onVariantError: (variantIndex, error) => {
        console.error(`Error in variant ${variantIndex}:`, error);
        updateVariantStatus(commit.hash, variantIndex, "error", error);
        finishThinkingEvent(variantIndex, "error");
        finishAssistantEvent(variantIndex, "error");
        finishToolEvent(variantIndex, "error");
      },
      onVariantCount: (count) => {
        console.log(`Backend is using ${count} variants`);
        resizeVariants(commit.hash, count);
      },
      onVariantModels: (models) => {
        setVariantModels(commit.hash, models);
      },
      onThinking: (content, variantIndex, eventId) => {
        if (!eventId) return;
        lastThinkingEventIdRef.current[variantIndex] = eventId;
        startAgentEvent(commit.hash, variantIndex, {
          id: eventId,
          type: "thinking",
          status: "running",
          startedAt: Date.now(),
        });
        appendAgentEventContent(commit.hash, variantIndex, eventId, content);
      },
      onAssistant: (content, variantIndex, eventId) => {
        if (!eventId) return;
        lastAssistantEventIdRef.current[variantIndex] = eventId;
        startAgentEvent(commit.hash, variantIndex, {
          id: eventId,
          type: "assistant",
          status: "running",
          startedAt: Date.now(),
        });
        appendAgentEventContent(commit.hash, variantIndex, eventId, content);
      },
      onToolStart: (data, variantIndex, eventId) => {
        if (!eventId) return;
        const lastThinking = lastThinkingEventIdRef.current[variantIndex];
        if (lastThinking && lastThinking !== eventId) {
          finishThinkingEvent(variantIndex, "complete");
        }
        const lastAssistant = lastAssistantEventIdRef.current[variantIndex];
        if (lastAssistant && lastAssistant !== eventId) {
          finishAssistantEvent(variantIndex, "complete");
        }
        startAgentEvent(commit.hash, variantIndex, {
          id: eventId,
          type: "tool",
          status: "running",
          toolName: data?.name,
          input: data?.input,
          startedAt: Date.now(),
        });
        lastToolEventIdRef.current[variantIndex] = eventId;
      },
      onToolResult: (data, variantIndex, eventId) => {
        if (!eventId) return;
        finishAgentEvent(commit.hash, variantIndex, eventId, {
          status: data?.ok === false ? "error" : "complete",
          output: data?.output,
          endedAt: Date.now(),
        });
        if (lastToolEventIdRef.current[variantIndex] === eventId) {
          delete lastToolEventIdRef.current[variantIndex];
        }
      },
      onCancel: (reason, errorMessage) => {
        // The project may have been reset while this generation was still in
        // flight — a stale cancellation must not mutate app state.
        if (!useProjectStore.getState().commits[commit.hash]) return;

        // Close any running agent events when the socket ends without per-event
        // terminal messages, otherwise they remain stuck in "running" state.
        finishInFlightEvents(reason === "request_failed" ? "error" : "complete");

        if (reason === "request_failed" && commit.type === "ai_create") {
          const latestCreateCommit = useProjectStore.getState().commits[commit.hash];
          latestCreateCommit?.variants.forEach((variant, variantIndex) => {
            if (variant.status === "generating") {
              updateVariantStatus(
                commit.hash,
                variantIndex,
                "error",
                errorMessage || "Generation failed. Please retry."
              );
            }
          });
          setAppState(AppState.CODE_READY);
          return;
        }

        cancelCodeGenerationAndReset(commit);
      },
      onComplete: () => {
        // Same guard as onCancel: a generation finishing after its project
        // was reset must not pull the app back into the editor.
        if (!useProjectStore.getState().commits[commit.hash]) return;
        finishInFlightEvents("complete");
        setAppState(AppState.CODE_READY);
        snapshotActive();
      },
    });
  }

  // Initial version creation
  function doCreate(
    referenceImages: string[],
    inputMode: "image" | "video",
    textPrompt: string = "",
    isAssetExtractionEnabled = true
  ) {
    // Reset any existing state
    reset();

    // Set the input states
    setReferenceImages(referenceImages);
    setInputMode(inputMode);

    // Kick off the code generation
    if (referenceImages.length > 0) {
      const media =
        inputMode === "video" ? [referenceImages[0]] : referenceImages;
      const imageAssetIds =
        inputMode === "image"
          ? registerAssetIds(
              "image",
              media,
              getAssetsById,
              upsertPromptAssets,
              nanoid
            )
          : [];
      const videoAssetIds =
        inputMode === "video"
          ? registerAssetIds(
              "video",
              media,
              getAssetsById,
              upsertPromptAssets,
              nanoid
            )
          : [];
      const variantHistory = [
        buildUserHistoryMessage(textPrompt, imageAssetIds, videoAssetIds),
      ];
      doGenerateCode({
        generationType: "create",
        inputMode,
        prompt: {
          text: textPrompt,
          images: inputMode === "image" ? media : [],
          videos: inputMode === "video" ? media : [],
        },
        // Asset extraction operates on still screenshots. Video data uses the
        // same transport shape for Gemini, so explicitly disable extraction
        // instead of letting the agent try to crop a video payload.
        isAssetExtractionEnabled:
          inputMode === "image" && isAssetExtractionEnabled,
        variantHistory,
      });
    }
  }

  function doCreateFromText(text: string) {
    // Reset any existing state
    reset();

    setInputMode("text");
    setInitialPrompt(text);
    doGenerateCode({
      generationType: "create",
      inputMode: "text",
      prompt: { text, images: [], videos: [] },
      variantHistory: [buildUserHistoryMessage(text)],
    });
  }

  function regenerateUpdate(commit: AiEditCommit) {
    const parentHash = commit.parentHash;
    const parentCommit = parentHash ? commits[parentHash] : null;
    if (!parentHash || !parentCommit) {
      toast.error("The previous version needed to retry this edit was not found.");
      return;
    }

    const parentVariant =
      parentCommit.variants[parentCommit.selectedVariantIndex];
    if (!parentVariant) {
      toast.error("The selected option from the previous version was not found.");
      return;
    }

    const imageAssetIds = registerAssetIds(
      "image",
      commit.inputs.images,
      getAssetsById,
      upsertPromptAssets,
      nanoid
    );

    doGenerateCode(
      buildUpdateGenerationRequest({
        inputMode,
        prompt: commit.inputs,
        parentCommit,
        imageAssetIds,
        getAssetsById,
      }),
      parentHash
    );
  }

  // Subsequent updates
  async function doUpdate(updateInstruction: string) {
    if (updateInstruction.trim() === "") {
      toast.error("Please include some instructions for AI on what to update.");
      return;
    }

    if (head === null) {
      toast.error(
        "No current version set. Contact support or open a Github issue."
      );
      throw new Error("Update called with no head");
    }

    const currentCommit = commits[head];
    if (!currentCommit) {
      toast.error("The selected version could not be found.");
      return;
    }

    let modifiedUpdateInstruction = updateInstruction;
    let selectedElementHtml: string | undefined;

    // Send in a reference to the selected element if it exists. Selection
    // visuals are overlays, so the element's outerHTML is already clean.
    if (selectedElement) {
      const elementHtml = selectedElement.outerHTML;
      selectedElementHtml = elementHtml;
      modifiedUpdateInstruction = buildSelectedElementInstruction(
        updateInstruction,
        elementHtml,
        selectedElement.isConnected
          ? describeElementContext(selectedElement)
          : undefined
      );
      setSelectedElement(null);
    }

    const updateImageAssetIds = registerAssetIds(
      "image",
      updateImages,
      getAssetsById,
      upsertPromptAssets,
      nanoid
    );

    doGenerateCode(
      buildUpdateGenerationRequest({
        inputMode,
        prompt: {
          text: updateInstruction,
          fullText: modifiedUpdateInstruction,
          images: updateImages,
          videos: [],
          selectedElementHtml,
        },
        parentCommit: currentCommit,
        imageAssetIds: updateImageAssetIds,
        getAssetsById,
      })
    );
  }

  const handleTermDialogOpenChange = (open: boolean) => {
    setSettings((s) => ({
      ...s,
      isTermOfServiceAccepted: !open,
    }));
  };

  function setStack(stack: Stack) {
    setSettings((prev) => ({
      ...prev,
      generatedCodeConfig: stack,
    }));
  }

  function importFromCode(code: string, stack: Stack) {
    // Reset any existing state
    reset();

    // Set up this project
    setStack(stack);

    // Create a new commit and set it as the head
    const commit = createCommit({
      type: "code_create",
      parentHash: null,
      variants: [{ code, history: [] }],
      inputs: null,
    });
    addCommit(commit);
    setHead(commit.hash);

    // Set the app state
    setAppState(AppState.CODE_READY);
    snapshotActive();
  }

  const isCodingOrReady =
    appState === AppState.CODING || appState === AppState.CODE_READY;
  const canEdit = isCodingOrReady && head !== null;
  const isSettingsOpen = panel === "settings";
  const isVersionsOpen = panel === "versions";
  const isProjectsOpen = panel === "projects";
  // Design Studio is a full-width workspace view, available at any app state.
  const isDesignOpen = panel === "design";
  // Editor mode only makes sense once the project has code.
  const isEditorMode = panel === "editor" && canEdit;
  const isFullWidthView = isSettingsOpen || isDesignOpen || isEditorMode;
  const showContentPanel =
    (isCodingOrReady || isVersionsOpen || isProjectsOpen) && !isFullWidthView;
  const showMobileChatPane =
    showContentPanel && mobilePane === "chat" && !isEditorMode;

  const selectPanel = (next: PanelId) => {
    setPanel(next);
    if (next === "chat" || next === "versions" || next === "projects") {
      setMobilePane("chat");
    } else {
      setMobilePane("preview");
    }
  };

  const openVersions = () => selectPanel("versions");

  return (
    <div
      className={`dark:bg-black dark:text-white ${
        appState === AppState.CODING || appState === AppState.CODE_READY
          ? "flex h-dvh flex-col overflow-hidden lg:block lg:h-screen"
          : "min-h-screen"
      }`}
    >
      {IS_RUNNING_ON_CLOUD && (
        <TermsOfServiceDialog
          open={!settings.isTermOfServiceAccepted}
          onOpenChange={handleTermDialogOpenChange}
        />
      )}

      {/* Icon strip - always visible; expands into a labeled sidebar */}
      <div
        className={`sticky top-0 z-50 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col lg:transition-[width] lg:duration-200 ${
          sidebarExpanded ? "lg:w-60" : "lg:w-16"
        }`}
      >
        <IconStrip
          activePanel={panel}
          showVersions={isCodingOrReady}
          showEditor={isCodingOrReady}
          canEdit={canEdit}
          isDark={isDarkMode}
          expanded={sidebarExpanded}
          onSelectPanel={selectPanel}
          onLogoClick={() => selectPanel("chat")}
          onToggleTheme={toggleAppTheme}
          onToggleExpanded={() => setSidebarExpanded((v) => !v)}
          onNewProject={() => {
            // Snapshot the outgoing project inside createProject, then start
            // a clean session for the new one.
            const n = useProjectsStore.getState().projects.length + 1;
            cancelCodeGeneration();
            createProject(`Untitled ${n}`);
            setPanel("chat");
            setMobilePane("preview");
          }}
        />
      </div>

      {isCodingOrReady && !isFullWidthView && (
        <div className="border-b border-gray-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden">
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => {
                if (isVersionsOpen) setPanel("chat");
                setMobilePane("preview");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mobilePane === "preview"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-gray-500 dark:text-zinc-400"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setMobilePane("chat")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mobilePane === "chat"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-gray-500 dark:text-zinc-400"
              }`}
            >
              Chat
            </button>
          </div>
        </div>
      )}

      {/* Content panel - shows sidebar, versions, or projects */}
      {showContentPanel && (
        <div
          className={`border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-white lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[calc(28rem-4rem)] lg:flex-col lg:border-b-0 lg:border-r lg:transition-[left] lg:duration-200 ${
            sidebarExpanded ? "lg:left-60" : "lg:left-16"
          } ${
            showMobileChatPane ? "block" : "hidden lg:flex"
          }`}
        >
            {isVersionsOpen ? (
              <div className="flex-1 overflow-y-auto sidebar-scrollbar-stable px-4">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Versions</h2>
                    <button
                      onClick={() => setPanel("chat")}
                      className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      <LuChevronLeft className="w-3.5 h-3.5" />
                      Back to chat
                    </button>
                  </div>
                  <HistoryDisplay />
                </div>
              </div>
            ) : isProjectsOpen ? (
              <div className="flex-1 overflow-hidden">
                <ProjectsPanel
                  onBack={() => setPanel(canEdit ? "chat" : "chat")}
                />
              </div>
            ) : (
              <>
                {IS_RUNNING_ON_CLOUD && !settings.openAiApiKey && (
                  <div className="px-6 mt-4">
                    <OnboardingNote />
                  </div>
                )}

                {isCodingOrReady && (
                  <Sidebar
                    doUpdate={doUpdate}
                    regenerate={regenerate}
                    cancelCodeGeneration={cancelCodeGeneration}
                    designSystem={{
                      designSystems,
                      selectedDesignSystemId: settings.selectedDesignSystemId,
                      setSelectedDesignSystemId,
                      onAddNew: handleAddNewDesignSystem,
                      onManage: () => openDesignSystemsManager(),
                    }}
                    onOpenVersions={openVersions}
                  />
                )}
              </>
            )}
        </div>
      )}

      <main
        className={`${
          isFullWidthView
            ? `flex flex-1 min-h-0 flex-col lg:h-full ${sidebarExpanded ? "lg:pl-60" : "lg:pl-16"}`
            : showContentPanel
              ? `flex flex-1 min-h-0 flex-col lg:h-full ${sidebarExpanded ? "lg:pl-[39rem]" : "lg:pl-[28rem]"}`
              : sidebarExpanded
                ? "lg:pl-60"
                : "lg:pl-16"
        } lg:transition-[padding] lg:duration-200 ${isCodingOrReady && !isFullWidthView && mobilePane === "chat" ? "hidden lg:flex" : ""}`}
      >
        {isSettingsOpen ? (
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            appTheme={appTheme}
            setAppTheme={setAppTheme}
          />
        ) : isDesignOpen ? (
          <DesignPanel
            settings={settings}
            setSettings={setSettings}
            designSystems={designSystems}
            selectedDesignSystemId={settings.selectedDesignSystemId}
            setSelectedDesignSystemId={setSelectedDesignSystemId}
            createDesignSystem={createDesignSystem}
            updateDesignSystem={updateDesignSystem}
            deleteDesignSystem={deleteDesignSystem}
            onManage={() => openDesignSystemsManager()}
            onClose={() => selectPanel("chat")}
          />
        ) : isEditorMode ? (
          <EditorPane settings={settings} />
        ) : (
          <>
            {appState === AppState.INITIAL && (
              <StartPane
                doCreate={doCreate}
                doCreateFromText={doCreateFromText}
                importFromCode={importFromCode}
                settings={settings}
                setSettings={setSettings}
                designSystems={designSystems}
                onAddNewDesignSystem={handleAddNewDesignSystem}
                onManageDesignSystems={() => openDesignSystemsManager()}
              />
            )}

            {isCodingOrReady && (
              <PreviewPane
                settings={settings}
                saveState={saveState}
                onOpenVersions={openVersions}
                onOpenEditor={() => selectPanel("editor")}
              />
            )}
          </>
        )}
      </main>

      <DesignSystemsModal
        open={isDesignSystemsModalOpen}
        onOpenChange={setIsDesignSystemsModalOpen}
        designSystems={designSystems}
        selectedDesignSystemId={settings.selectedDesignSystemId}
        setSelectedDesignSystemId={setSelectedDesignSystemId}
        initialEditingId={designSystemsModalInitialId}
        createDesignSystem={createDesignSystem}
        updateDesignSystem={updateDesignSystem}
        deleteDesignSystem={deleteDesignSystem}
      />
    </div>
  );
}

export default App;
