import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  FaDesktop,
  FaMobile,
  FaCode,
} from "react-icons/fa";
import {
  LuChevronLeft,
  LuChevronRight,
  LuExternalLink,
  LuRefreshCw,
  LuDownload,
  LuCode,
  LuMinus,
  LuPlus,
  LuMaximize,
  LuContrast,
  LuSlidersHorizontal,
} from "react-icons/lu";
import { useMemo, useState } from "react";
import { AppState, Settings } from "../../types";
import CodeTab from "./CodeTab";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAppStore } from "../../store/app-store";
import { useProjectStore } from "../../store/project-store";
import { useWorkspaceStore } from "../../store/workspace-store";
import { useProjectsStore } from "../../store/projects-store";
import { composePreviewHtml, ComposeInputFile } from "../../lib/compose-preview";
import { extractHtml } from "./extractHtml";
import PreviewComponent from "./PreviewComponent";
import FullscreenPreview from "./FullscreenPreview";
import { downloadCode } from "./download";
import { SelectAndEditToolbarButton } from "../select-and-edit/SelectAndEditControls";
import { normalizeBabelCdn } from "../../lib/babelCdn";
import ImageScanningPreview from "./ImageScanningPreview";

const STAGE_CLASSES: Record<StageKey, string> = {
  studio: "studio-backdrop",
  light: "bg-slate-100 dark:bg-zinc-800",
  dark: "bg-zinc-900",
  grid: "preview-grid",
};
type StageKey = "studio" | "light" | "dark" | "grid";
const STAGE_ORDER: StageKey[] = ["studio", "light", "dark", "grid"];
const WIDTH_PRESETS = [375, 768, 1024, 1280, 1366];


function prepareHtmlForNewTab(code: string) {
  const html = normalizeBabelCdn(code);
  if (/<base\s/i.test(html)) return html;

  const baseTag = `<base href="${window.location.origin}/">`;
  return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}${baseTag}`);
}

function openInNewTab(code: string) {
  const blob = new Blob([prepareHtmlForNewTab(code)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

interface Props {
  settings: Settings;
  saveState?: "idle" | "saving" | "saved";
  onOpenVersions: () => void;
  onOpenEditor: () => void;
}

function PreviewPane({ settings, saveState = "idle", onOpenVersions, onOpenEditor }: Props) {
  const { appState } = useAppStore();
  const { inputMode, head, commits, setHead } = useProjectStore();
  const activeProjectId = useProjectsStore((s) => s.activeProjectId);
  const filesByProject = useWorkspaceStore((s) => s.filesByProject);
  const [activeTab, setActiveTab] = useState("desktop");
  const [desktopScale, setDesktopScale] = useState(1);
  const [desktopViewMode, setDesktopViewMode] = useState<"fit" | "actual">("fit");
  const [zoom, setZoom] = useState(1);
  const [widthOverride, setWidthOverride] = useState<number>(1366);
  const [stage, setStage] = useState<StageKey>("studio");
  const [fullscreen, setFullscreen] = useState(false);

  const shownPercent = Math.round(
    (desktopViewMode === "fit" ? desktopScale : zoom) * 100
  );
  const stepZoom = (delta: number) => {
    setDesktopViewMode("actual");
    setZoom((prev) => Math.min(2, Math.max(0.5, Math.round((prev + delta) * 100) / 100)));
  };

  // Sorted commit list for version navigation
  const sortedCommits = useMemo(() =>
    Object.values(commits).sort(
      (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
    ), [commits]);

  const currentVersionIndex = sortedCommits.findIndex(c => c.hash === head);
  const totalVersions = sortedCommits.length;
  const canGoPrev = currentVersionIndex > 0;
  const canGoNext = currentVersionIndex < totalVersions - 1;

  const currentCommit = head && commits[head] ? commits[head] : "";
  const currentCode = currentCommit
    ? currentCommit.variants[currentCommit.selectedVariantIndex].code
    : "";

  const isSelectedVariantComplete =
    head &&
    commits[head] &&
    commits[head].variants[commits[head].selectedVariantIndex].status ===
      "complete";

  const previewCode =
    inputMode === "video" && appState === AppState.CODING
      ? extractHtml(currentCode)
      : currentCode;

  // Layer the manual workspace files (CSS/JS) onto everything the user sees or
  // exports; the base html stays the head commit's code so streaming is intact.
  const composedCode = useMemo(() => {
    const files = activeProjectId ? filesByProject[activeProjectId] ?? [] : [];
    const cssFiles: ComposeInputFile[] = files
      .filter((f) => f.language === "css")
      .map((f) => ({ path: f.path, content: f.content }));
    const jsFiles: ComposeInputFile[] = files
      .filter((f) => f.language === "js")
      .map((f) => ({ path: f.path, content: f.content }));
    return composePreviewHtml(previewCode, cssFiles, jsFiles);
  }, [previewCode, activeProjectId, filesByProject]);

  const sourceImage = currentCommit ? currentCommit.inputs?.images[0] : undefined;
  const showImageScanningPreview =
    appState === AppState.CODING &&
    currentCommit !== "" &&
    currentCommit.type === "ai_create" &&
    inputMode === "image" &&
    !previewCode.trim() &&
    !!sourceImage;

  const canSelectAndEdit =
    appState === AppState.CODE_READY || !!isSelectedVariantComplete;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="relative flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-gradient-to-b from-white/95 to-slate-50/85 px-4 py-2 shadow-soft backdrop-blur-sm dark:border-zinc-800 dark:from-zinc-900/85 dark:to-zinc-950/80">
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="desktop" title="Desktop" data-testid="tab-desktop">
                <FaDesktop />
              </TabsTrigger>
              <TabsTrigger value="mobile" title="Mobile" data-testid="tab-mobile">
                <FaMobile />
              </TabsTrigger>
              <TabsTrigger value="code" title="Code" data-testid="tab-code" className="gap-2">
                <FaCode />
                Code
              </TabsTrigger>
            </TabsList>
            {(activeTab === "desktop" || activeTab === "mobile") && (
              <div className="hidden sm:inline-flex items-center gap-1">
                {activeTab === "desktop" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Viewport settings"
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <LuSlidersHorizontal className="h-4 w-4" />
                        Viewport
                        <span className="ml-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {shownPercent}% · {widthOverride}px
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-72 space-y-4">
                      {/* Scale mode */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                          Scale
                        </p>
                        <div className="inline-flex w-full rounded-lg bg-gray-100 p-1 dark:bg-zinc-800">
                          <button
                            type="button"
                            onClick={() => setDesktopViewMode("fit")}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                              desktopViewMode === "fit"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-100"
                                : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                          >
                            Fit to screen
                          </button>
                          <button
                            type="button"
                            onClick={() => setDesktopViewMode("actual")}
                            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                              desktopViewMode === "actual"
                                ? "bg-white text-gray-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-100"
                                : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                          >
                            Manual
                          </button>
                        </div>
                      </div>

                      {/* Zoom stepper (manual only) */}
                      {desktopViewMode === "actual" && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                            Zoom
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => stepZoom(-0.1)}
                              className="h-8 w-8"
                            >
                              <LuMinus className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 text-center text-sm font-semibold tabular-nums text-gray-700 dark:text-zinc-200">
                              {shownPercent}%
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => stepZoom(0.1)}
                              className="h-8 w-8"
                            >
                              <LuPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Width presets */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                          Width
                        </p>
                        <div className="grid grid-cols-5 gap-1">
                          {WIDTH_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setWidthOverride(preset)}
                              className={`rounded-md py-1.5 text-[11px] font-medium tabular-nums transition-all ${
                                widthOverride === preset
                                  ? "bg-indigo-500 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                          Background
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {STAGE_ORDER.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setStage(option)}
                              className={`flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-medium capitalize transition-all ${
                                stage === option
                                  ? "bg-indigo-500 text-white shadow-sm"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                              }`}
                            >
                              {option === "studio" && (
                                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400" />
                              )}
                              {option === "dark" && <LuContrast className="h-3 w-3" />}
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                <Button
                  onClick={() => openInNewTab(composedCode)}
                  variant="ghost"
                  size="icon"
                  title="Open in New Tab"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <LuExternalLink />
                </Button>

                <Button
                  onClick={() => setFullscreen(true)}
                  variant="ghost"
                  size="icon"
                  title="Fullscreen preview"
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <LuMaximize />
                </Button>
              </div>
            )}


          </div>

          {/* Version navigation */}
          {totalVersions > 0 && (
            <div className="hidden md:flex shrink-0 items-center justify-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 rounded-full p-1 border border-gray-200/50 dark:border-zinc-700/50 backdrop-blur-sm">
              <Button
                onClick={() => canGoPrev && setHead(sortedCommits[currentVersionIndex - 1].hash)}
                variant="ghost"
                size="icon"
                title="Previous version"
                className={`h-6 w-6 rounded-full hover:bg-white dark:hover:bg-zinc-700 ${!canGoPrev ? "opacity-30 cursor-not-allowed" : ""}`}
                disabled={!canGoPrev}
              >
                <LuChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <div
                onClick={onOpenVersions}
                className="flex items-center justify-center gap-2 px-1 cursor-pointer hover:opacity-70 transition-opacity w-32"
                title="View all versions"
              >
                <span className="brand-gradient-text text-xs font-semibold leading-none">
                  Version {currentVersionIndex + 1}
                </span>
                {currentVersionIndex === totalVersions - 1 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 leading-none flex items-center h-4">
                    Latest
                  </span>
                )}
              </div>
              <Button
                onClick={() => canGoNext && setHead(sortedCommits[currentVersionIndex + 1].hash)}
                variant="ghost"
                size="icon"
                title="Next version"
                className={`h-6 w-6 rounded-full hover:bg-white dark:hover:bg-zinc-700 ${!canGoNext ? "opacity-30 cursor-not-allowed" : ""}`}
                disabled={!canGoNext}
              >
                <LuChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-1">
            {saveState !== "idle" && appState !== AppState.CODING && (
              <span
                className={`mr-1 hidden items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-flex ${
                  saveState === "saving"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                }`}
                title={saveState === "saving" ? "Saving project…" : "Project saved"}
              >
                {saveState === "saving" ? "Saving…" : "Saved"}
              </span>
            )}
            <Button
              onClick={onOpenEditor}
              variant="ghost"
              size="icon"
              title="Open editor"
              className="h-9 w-9 text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:text-sky-300 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
            >
              <LuCode />
            </Button>
            {canSelectAndEdit &&
              (activeTab === "desktop" || activeTab === "mobile") && (
                <SelectAndEditToolbarButton />
              )}
            {(appState === AppState.CODE_READY || isSelectedVariantComplete) && (
              <Button
                onClick={() => downloadCode(composedCode)}
                variant="ghost"
                size="icon"
                title="Download Code"
                className="h-9 w-9"
                data-testid="download-code"
              >
                <LuDownload />
              </Button>
            )}
            <Button
              onClick={() => {
                const iframes = document.querySelectorAll("iframe");
                iframes.forEach((iframe) => {
                  if (iframe.srcdoc) {
                    const content = iframe.srcdoc;
                    iframe.srcdoc = "";
                    iframe.srcdoc = content;
                  }
                });
              }}
              variant="ghost"
              size="icon"
              title="Refresh Preview"
              className="h-9 w-9"
            >
              <LuRefreshCw />
            </Button>
          </div>
        </div>

        {/* Live build indicator while the agent is generating */}
        {appState === AppState.CODING && (
          <div className="relative flex shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/70 px-4 py-1.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
            </span>
            <span className="text-[11px] font-medium text-violet-600 dark:text-violet-300">
              Building your page…
            </span>
            <div className="relative ml-auto h-1 w-40 overflow-hidden rounded-full bg-slate-200/80 dark:bg-zinc-800">
              <div className="load-bar absolute h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
            </div>
          </div>
        )}

        <TabsContent value="desktop" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
          <div key={head ?? "empty"} className="flex min-h-0 flex-1 flex-col">
            {showImageScanningPreview ? (
              <ImageScanningPreview imageUrl={sourceImage} />
            ) : (
              <PreviewComponent
                code={composedCode}
                device="desktop"
                onScaleChange={setDesktopScale}
                viewMode={desktopViewMode}
                widthOverride={widthOverride}
                zoom={zoom}
                stageClass={STAGE_CLASSES[stage]}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="mobile" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
          <div key={head ?? "empty"} className="flex min-h-0 flex-1 flex-col">
            {showImageScanningPreview ? (
              <ImageScanningPreview imageUrl={sourceImage} />
            ) : (
              <PreviewComponent
                code={composedCode}
                device="mobile"
                viewMode="actual"
                stageClass={STAGE_CLASSES[stage]}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="code" className="flex-1 min-h-0 mt-0 overflow-auto">
          <CodeTab
            code={composedCode}
            setCode={() => {}}
            settings={settings}
          />
        </TabsContent>
      </Tabs>

      {fullscreen && (
        <FullscreenPreview code={composedCode} onClose={() => setFullscreen(false)} />
      )}
    </div>
  );
}

export default PreviewPane;
