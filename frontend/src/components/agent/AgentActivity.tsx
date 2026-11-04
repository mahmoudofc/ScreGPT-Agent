import { useEffect, useRef, useState } from "react";
import { useProjectStore } from "../../store/project-store";
import {
  AgentEvent,
  AgentEventStatus,
  AgentEventType,
} from "../commits/types";
import {
  BsChatDots,
  BsChevronDown,
  BsChevronRight,
  BsLightbulb,
  BsFileEarmarkPlus,
  BsPencilSquare,
  BsImage,
  BsScissors,
  BsFiles,
  BsBookmarkCheck,
  BsBoundingBox,
  BsCamera,
} from "react-icons/bs";
import { LuClock, LuListChecks, LuSparkles } from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighterBase } from "react-syntax-highlighter";
import html from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Agent3D, { AgentMood } from "../core/Agent3D";
import { groupCompletedAgentEvents } from "./activity-order";
import {
  formatDurationBetween,
  isTerminalVariantStatus,
} from "./generation-time";

SyntaxHighlighterBase.registerLanguage("html", html);
const SyntaxHighlighter = SyntaxHighlighterBase as any;

function ExpandablePrompt({ prompt }: { prompt: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const promptRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setIsExpanded(false);
  }, [prompt]);

  useEffect(() => {
    const element = promptRef.current;
    if (!element) return;

    const updateClampedState = () => {
      setIsClamped(element.scrollHeight > element.clientHeight + 1);
    };

    updateClampedState();
    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(updateClampedState);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [prompt, isExpanded]);

  return (
    <div>
      <p
        ref={promptRef}
        className={`whitespace-pre-wrap break-words text-xs text-gray-600 dark:text-gray-300 ${
          !isExpanded ? "line-clamp-4" : ""
        }`}
      >
        {prompt}
      </p>
      {(isClamped || isExpanded) && (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded((previous) => !previous)}
            aria-expanded={isExpanded}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {isExpanded ? "Less" : "More"}
          </button>
        </div>
      )}
    </div>
  );
}

function CodePreviewBlock({ code, isGenerating }: { code: string; isGenerating: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGenerating && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [code, isGenerating]);

  return (
    <div ref={containerRef} className="max-h-60 overflow-auto rounded-md">
      <SyntaxHighlighter
        language="html"
        style={vs2015}
        customStyle={{ margin: 0, padding: "0.5rem", fontSize: "0.75rem", borderRadius: "0.375rem" }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function formatDuration(startedAt?: number, endedAt?: number): string {
  return formatDurationBetween(startedAt, endedAt);
}

function getArrayField(value: unknown, field: string): unknown[] | null {
  if (!value || typeof value !== "object") return null;
  const fieldValue = (value as Record<string, unknown>)[field];
  return Array.isArray(fieldValue) ? fieldValue : null;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getExtractedAssetPreviewUrl(asset: unknown): string | null {
  const assetRecord = getRecord(asset);
  if (!assetRecord) return null;
  if (typeof assetRecord.public_url === "string" && assetRecord.public_url) {
    return assetRecord.public_url;
  }
  if (typeof assetRecord.data_url === "string" && assetRecord.data_url) {
    return assetRecord.data_url;
  }
  return null;
}

function isSuccessfulExtractedAsset(asset: unknown): boolean {
  const assetRecord = getRecord(asset);
  if (!assetRecord) return false;
  const status =
    typeof assetRecord.status === "string" ? assetRecord.status : null;
  return Boolean(
    getExtractedAssetPreviewUrl(asset) &&
      status !== "missing" &&
      status !== "error"
  );
}

function getEventIcon(type: AgentEventType, toolName?: string) {
  if (type === "thinking") {
    return <BsLightbulb className="text-violet-500" />;
  }
  if (type === "assistant") {
    return <BsChatDots className="text-indigo-500" />;
  }
  if (toolName === "create_file") {
    return <BsFileEarmarkPlus className="text-indigo-500" />;
  }
  if (toolName === "edit_file") {
    return <BsPencilSquare className="text-violet-500" />;
  }
  if (toolName === "generate_images") {
    return <BsImage className="text-fuchsia-500" />;
  }
  if (toolName === "remove_backgrounds") {
    return <BsScissors className="text-violet-500" />;
  }
  if (toolName === "edit_images") {
    return <BsImage className="text-fuchsia-500" />;
  }
  if (toolName === "retrieve_option") {
    return <BsFiles className="text-indigo-400" />;
  }
  if (toolName === "save_assets") {
    return <BsBookmarkCheck className="text-violet-500" />;
  }
  if (toolName === "extract_assets") {
    return <BsBoundingBox className="text-fuchsia-500" />;
  }
  if (toolName === "screenshot_preview") {
    return <BsCamera className="text-indigo-500" />;
  }
  return <BsFileEarmarkPlus className="text-gray-400" />;
}

// Small colored pill reflecting an event's lifecycle state, aligned with the
// brand palette (running -> indigo, complete -> emerald, error -> rose).
function AgentStatusChip({ status }: { status: AgentEventStatus }) {
  if (status === "complete") return null;
  const config =
    status === "running"
      ? {
          label: "running",
          classes:
            "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
          dot: "bg-indigo-500 animate-pulse",
        }
      : {
          label: "error",
          classes:
            "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
          dot: "bg-rose-500",
        };
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function getEventTitle(event: AgentEvent): string {
  if (event.type === "thinking") {
    if (event.status === "running") return "Thinking";
    const duration = formatDuration(event.startedAt, event.endedAt);
    return duration ? `Thought for ${duration}` : "Thought";
  }
  if (event.type === "assistant") {
    return "Assistant response";
  }
  if (event.type === "tool") {
    if (event.toolName === "create_file") {
      return event.status === "running" ? "Creating file" : "Created file";
    }
    if (event.toolName === "edit_file") {
      return event.status === "running" ? "Editing file" : "Edited file";
    }
    if (event.toolName === "generate_images") {
      const input = event.input as any;
      const output = event.output as any;
      const count = output?.images?.length || input?.count || 0;
      if (event.status === "running") {
        return count ? `Generating ${count} image${count !== 1 ? "s" : ""}` : "Generating images";
      }
      return count ? `Generated ${count} image${count !== 1 ? "s" : ""}` : "Generated images";
    }
    if (event.toolName === "remove_backgrounds") {
      const rbInput = event.input as any;
      const rbOutput = event.output as any;
      const rbCount = rbOutput?.images?.length || rbInput?.image_urls?.length || 0;
      if (event.status === "running") {
        return rbCount > 1 ? `Removing ${rbCount} backgrounds` : "Removing background";
      }
      return rbCount > 1 ? `Removed ${rbCount} backgrounds` : "Background removed";
    }
    if (event.toolName === "edit_images") {
      const editInput = event.input as { edits?: unknown[] } | null;
      const editOutput = event.output as { images?: unknown[] } | null;
      const editCount =
        editOutput?.images?.length || editInput?.edits?.length || 0;
      if (event.status === "running") {
        return editCount
          ? `Editing ${editCount} image${editCount !== 1 ? "s" : ""}`
          : "Editing images";
      }
      return editCount
        ? `Edited ${editCount} image${editCount !== 1 ? "s" : ""}`
        : "Edited images";
    }
    if (event.toolName === "retrieve_option") {
      return event.status === "running"
        ? "Retrieving option"
        : "Retrieved option";
    }
    if (event.toolName === "save_assets") {
      const saveInput = event.input as any;
      const saveOutput = event.output as any;
      const saveCount = saveOutput?.images?.length || saveInput?.asset_ids?.length || 0;
      if (event.status === "running") {
        return saveCount > 1 ? `Saving ${saveCount} assets` : "Saving asset";
      }
      return saveCount > 1 ? `Saved ${saveCount} assets` : "Saved asset";
    }
    if (event.toolName === "extract_assets") {
      const extractInputDescriptions = getArrayField(event.input, "asset_descriptions");
      const extractOutputAssets = getArrayField(event.output, "assets");
      const requestedCount = extractInputDescriptions?.length || 0;
      const successfulCount =
        extractOutputAssets?.filter(isSuccessfulExtractedAsset).length || 0;
      const extractCount =
        extractOutputAssets?.length || extractInputDescriptions?.length || 0;
      if (event.status === "running") {
        return extractCount > 1
          ? `Extracting ${extractCount} assets`
          : "Extracting asset";
      }
      if (
        extractOutputAssets &&
        requestedCount > 0 &&
        successfulCount < requestedCount
      ) {
        return successfulCount > 0
          ? `Extracted ${successfulCount} of ${requestedCount} assets`
          : "Could not extract assets";
      }
      return extractCount > 1
        ? `Extracted ${extractCount} assets`
        : "Extracted asset";
    }
    if (event.toolName === "screenshot_preview") {
      return event.status === "running"
        ? "Screenshotting preview"
        : "Screenshotted preview";
    }
    return event.status === "running" ? "Running tool" : "Tool completed";
  }
  return "Activity";
}


function renderToolDetails(event: AgentEvent, variantCode?: string) {
  if (!event.input && !event.output) return null;

  const renderJson = (data: unknown) => {
    if (!data) return null;
    let json = "";
    try {
      json = JSON.stringify(data, null, 2);
    } catch {
      json = String(data);
    }
    if (json.length > 900) {
      json = json.slice(0, 900) + "...";
    }
    return (
      <pre className="mt-2 rounded-md bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-700 dark:text-gray-200 overflow-x-auto">
        {json}
      </pre>
    );
  };

  const output = event.output as any;
  const input = event.input as any;
  const hasError = Boolean(output?.error);
  const images =
    output && Array.isArray(output.images) ? (output.images as Array<any>) : null;
  const edits =
    output && Array.isArray(output.edits) ? (output.edits as Array<any>) : null;
  const extractedAssets =
    output && Array.isArray(output.assets) ? (output.assets as Array<unknown>) : null;
  const successfulExtractedAssets =
    extractedAssets?.filter(isSuccessfulExtractedAsset) || null;
  const visibleExtractedAssets =
    hasError && successfulExtractedAssets
      ? successfulExtractedAssets
      : extractedAssets;
  const screenshotPreviews =
    output && Array.isArray(output.screenshots)
      ? (output.screenshots as Array<unknown>)
      : [];

  return (
    <div className="text-sm text-gray-700 dark:text-gray-200">
      {hasError && (
        <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 shadow-soft">
          <div className="text-xs uppercase tracking-wide text-red-500">Error</div>
          <div className="mt-1 text-sm text-red-700 dark:text-red-200">
            {output?.error}
          </div>
          {event.input && (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-wide text-red-400">
                Input
              </div>
              {renderJson(event.input)}
            </div>
          )}
        </div>
      )}
      {event.toolName === "create_file" && !hasError && variantCode && (
        <CodePreviewBlock code={variantCode} isGenerating={event.status === "running"} />
      )}

      {event.toolName === "edit_file" && edits && !hasError && (
        <div className="space-y-2">
          {edits.map((edit, index) => (
            <div
              key={`${edit.old_text}-${index}`}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 p-3 shadow-soft"
            >
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Edit {index + 1}
              </div>
              <div className="mt-2 grid gap-2">
                <div>
                  <div className="text-xs text-gray-500">Old</div>
                  <div className="mt-1 rounded bg-red-50 dark:bg-red-900/30 p-2 text-xs font-mono text-red-700 dark:text-red-200 break-all">
                    {edit.old_text}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">New</div>
                  <div className="mt-1 rounded bg-emerald-50 dark:bg-emerald-900/30 p-2 text-xs font-mono text-emerald-700 dark:text-emerald-200 break-all">
                    {edit.new_text}
                  </div>
                </div>
              </div>
              {edit.replaced !== undefined && (
                <div className="mt-2 text-xs text-gray-500">
                  Replaced {edit.replaced} time{edit.replaced === 1 ? "" : "s"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {event.toolName === "generate_images" && !hasError && (
        <div>
          {/* While running: show prompts with dividers */}
          {event.status === "running" && input?.prompts && Array.isArray(input.prompts) && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {input.prompts.map((prompt: string, index: number) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400 py-1.5">
                  {prompt}
                </div>
              ))}
            </div>
          )}
          {/* After complete: 50/50 image left, prompt right */}
          {event.status !== "running" && images && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {images.map((item, index) => (
                <div key={`${item.prompt}-${index}`} className="flex gap-3 py-2">
                  <div className="w-1/2 shrink-0">
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.prompt || `Generated image ${index + 1}`}
                        className="w-full rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        Failed
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 text-xs text-gray-600 dark:text-gray-400 self-center">
                    {item.prompt}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {event.toolName === "remove_backgrounds" && !hasError && (
        <div>
          {/* While running: show the source images */}
          {event.status === "running" && input?.image_urls && Array.isArray(input.image_urls) && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {input.image_urls.map((url: string, index: number) => (
                <div key={index} className="py-2">
                  <img
                    src={url}
                    alt={`Original image ${index + 1}`}
                    className="w-full rounded object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
          {/* After complete: before/after side by side for each image */}
          {event.status !== "running" && output?.images && Array.isArray(output.images) && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {output.images.map((item: any, index: number) => (
                <div key={`${item.image_url}-${index}`} className="flex gap-2 py-2">
                  <div className="w-1/2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Before</div>
                    <img
                      src={item.image_url}
                      alt={`Original image ${index + 1}`}
                      className="w-full rounded object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="w-1/2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">After</div>
                    {item.result_url ? (
                      <div className="relative">
                        <div
                          className="absolute inset-0 rounded"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                            backgroundSize: "10px 10px",
                            backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                          }}
                        />
                        <img
                          src={item.result_url}
                          alt="Background removed"
                          className="relative w-full rounded"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        Failed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {event.toolName === "edit_images" && !hasError && (
        <div>
          {event.status === "running" &&
            input?.edits &&
            Array.isArray(input.edits) && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {input.edits.map((rawItem: unknown, index: number) => {
                  const item = getRecord(rawItem);
                  const imageUrls = (getArrayField(item, "image_urls") || []).filter(
                    (url): url is string => typeof url === "string"
                  );
                  const prompt =
                    typeof item?.prompt === "string" ? item.prompt : null;
                  const aspectRatio =
                    typeof item?.aspect_ratio === "string"
                      ? item.aspect_ratio
                      : "match input";
                  return (
                    <div key={`${prompt || "edit"}-${index}`} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                          Edit {index + 1}
                        </div>
                        <div className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">
                          {aspectRatio}
                        </div>
                      </div>
                      {prompt && (
                        <div className="mt-2">
                          <ExpandablePrompt prompt={prompt} />
                        </div>
                      )}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {imageUrls.map((url: string, imageIndex: number) => (
                          <div key={`${url}-${imageIndex}`}>
                            <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
                              {imageIndex === 0
                                ? "Main image"
                                : `Reference ${imageIndex}`}
                            </div>
                            <img
                              src={url}
                              alt={
                                imageIndex === 0
                                  ? `Main image for edit ${index + 1}`
                                  : `Reference ${imageIndex} for edit ${index + 1}`
                              }
                              className="aspect-square w-full rounded object-cover bg-gray-50 dark:bg-gray-800"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          {event.status !== "running" && images && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {images.map((item, index) => {
                const imageUrls = Array.isArray(item?.image_urls)
                  ? item.image_urls
                  : [];
                const prompt =
                  typeof item?.prompt === "string" ? item.prompt : null;
                const succeeded =
                  item?.status === "ok" && typeof item?.result_url === "string";
                return (
                  <div key={`${prompt || "edit"}-${index}`} className="space-y-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                        Edit {index + 1}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                          {item?.aspect_ratio || "match input"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${
                            succeeded
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {succeeded ? "Complete" : "Failed"}
                        </span>
                      </div>
                    </div>
                    {prompt && <ExpandablePrompt prompt={prompt} />}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                          Before
                        </div>
                        {imageUrls[0] ? (
                          <img
                            src={imageUrls[0]}
                            alt={`Main image for edit ${index + 1}`}
                            className="aspect-square w-full rounded object-contain bg-gray-50 dark:bg-gray-800"
                            loading="lazy"
                          />
                        ) : (
                          <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                            Missing
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                          After
                        </div>
                        {succeeded ? (
                          <img
                            src={item.result_url}
                            alt={`Edited image ${index + 1}`}
                            className="aspect-square w-full rounded object-contain bg-gray-50 dark:bg-gray-800"
                            loading="lazy"
                          />
                        ) : (
                          <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                            Failed
                          </div>
                        )}
                      </div>
                    </div>
                    {imageUrls.length > 1 && (
                      <div>
                        <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                          Reference images
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {imageUrls
                            .slice(1)
                            .map((url: string, referenceIndex: number) => (
                              <img
                                key={`${url}-${referenceIndex}`}
                                src={url}
                                alt={`Reference ${referenceIndex + 1} for edit ${index + 1}`}
                                className="aspect-square w-full rounded object-cover bg-gray-50 dark:bg-gray-800"
                                loading="lazy"
                              />
                            ))}
                        </div>
                      </div>
                    )}
                    {item?.error && (
                      <div className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-200">
                        {item.error}
                      </div>
                    )}
                    {succeeded && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Result URL
                        </div>
                        <div className="mt-1 break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {item.result_url}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {event.toolName === "save_assets" && !hasError && (
        <div className="space-y-3">
          {event.status === "running" && input?.asset_ids && Array.isArray(input.asset_ids) && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {input.asset_ids.map((assetId: string, index: number) => (
                <div key={`${assetId}-${index}`} className="py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Asset ID
                  </div>
                  <div className="break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {assetId}
                  </div>
                </div>
              ))}
            </div>
          )}
          {event.status !== "running" && output?.images && Array.isArray(output.images) && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {output.images.map((item: any, index: number) => (
                <div key={`${item.asset_id}-${index}`} className="flex gap-3 py-2">
                  <div className="w-1/2">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Saved asset
                    </div>
                    {item.public_url ? (
                      <img
                        src={item.public_url}
                        alt={`Saved uploaded asset ${index + 1}`}
                        className="w-full rounded object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        Failed
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 self-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Permanent URL
                    </div>
                    <div className="mt-1 break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {item.public_url}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {event.toolName === "extract_assets" &&
        (!hasError || Boolean(visibleExtractedAssets?.length)) && (
          <div>
            {!hasError &&
              event.status === "running" &&
              input?.asset_descriptions &&
              Array.isArray(input.asset_descriptions) && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {input.asset_descriptions.map((description: string, index: number) => (
                    <div key={`${description}-${index}`} className="py-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Asset {index + 1}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            {event.status !== "running" && visibleExtractedAssets && (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {visibleExtractedAssets.map((asset, index) => {
                  const assetRecord =
                    asset && typeof asset === "object"
                      ? (asset as Record<string, unknown>)
                      : {};
                  const description =
                    typeof assetRecord.description === "string"
                      ? assetRecord.description
                      : `Asset ${index + 1}`;
                  const publicUrl =
                    typeof assetRecord.public_url === "string"
                      ? assetRecord.public_url
                      : null;
                  const previewUrl =
                    publicUrl ||
                    (typeof assetRecord.data_url === "string"
                      ? assetRecord.data_url
                      : null);
                  const boxText = Array.isArray(assetRecord.box_2d)
                    ? assetRecord.box_2d.join(", ")
                    : "No box";
                  const statusLabel =
                    typeof assetRecord.status === "string"
                      ? assetRecord.status
                      : previewUrl
                        ? "ok"
                        : "missing";
                  return (
                    <div key={`${description}-${index}`} className="flex gap-3 py-2">
                      <div className="w-1/2 shrink-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Extracted crop
                        </div>
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={description}
                            className="max-h-48 w-full rounded object-contain bg-gray-50 dark:bg-gray-800"
                            loading="lazy"
                          />
                        ) : (
                          <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                            Missing
                          </div>
                        )}
                      </div>
                      <div className="w-1/2 self-center space-y-2">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Requested asset
                          </div>
                          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                            {description}
                          </div>
                        </div>
                        {publicUrl && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Public URL
                            </div>
                            <div className="mt-1 break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {publicUrl}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">Status</div>
                            <div className="mt-1 font-mono text-gray-600 dark:text-gray-300">
                              {statusLabel}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 dark:text-gray-400">
                              Source image
                            </div>
                            <div className="mt-1 font-mono text-gray-600 dark:text-gray-300">
                              {String(assetRecord.image_index ?? "-")}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Bounding box
                          </div>
                          <div className="mt-1 break-all rounded bg-gray-50 p-2 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            [{boxText}]
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {event.toolName === "screenshot_preview" && !hasError && (
        <div>
          {event.status === "running" && (
            <div className="text-xs text-gray-600 dark:text-gray-400 py-1.5">
              Rendering desktop and mobile previews...
            </div>
          )}
          {event.status !== "running" && (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              {(["desktop", "mobile"] as const).map((viewport) => {
                const screenshot = screenshotPreviews.find((item) => {
                  const itemRecord = getRecord(item);
                  return itemRecord?.viewport === viewport;
                });
                const screenshotRecord = getRecord(screenshot);
                const imageUrl =
                  typeof screenshotRecord?.image_url === "string"
                    ? screenshotRecord.image_url
                    : null;
                return (
                  <div key={viewport}>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                      {viewport}
                    </div>
                    {imageUrl ? (
                      <div className="max-h-96 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                        <img
                          src={imageUrl}
                          alt={`Screenshot of the generated ${viewport} preview`}
                          className="w-full"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                        Missing
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!event.toolName && !hasError && (
        <>
          {event.input && (
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Input
              </div>
              {renderJson(event.input)}
            </div>
          )}
          {event.output && (
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Output
              </div>
              {renderJson(event.output)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AgentEventCard({
  event,
  autoExpand,
  variantCode,
}: {
  event: AgentEvent;
  autoExpand?: boolean;
  variantCode?: string;
}) {
  const [expanded, setExpanded] = useState(Boolean(autoExpand));

  useEffect(() => {
    if (autoExpand) {
      setExpanded(true);
    }
  }, [autoExpand]);

  const isExpanded =
    (event.type !== "thinking" && event.status === "running") || expanded;

  if (event.type === "assistant") {
    if (!event.content) return null;
    return (
      <div className="py-1 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            img: ({ ...props }) => (
              <div className="my-2 flex justify-start max-w-full">
                <img
                  {...props}
                  className="max-h-60 max-w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  loading="lazy"
                />
              </div>
            ),
          }}
        >
          {event.content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="agent-enter relative pl-6">
      {/* Timeline rail */}
      <span
        aria-hidden="true"
        className="absolute left-[9px] top-1 h-full w-px bg-slate-200 dark:bg-zinc-700"
      />
      {/* Node dot holding the event icon, colored by lifecycle status */}
      <span
        className={`absolute left-0 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border bg-white text-[11px] shadow-soft dark:bg-zinc-900 ${
          event.status === "running"
            ? "animate-pulse border-transparent bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white ring-2 ring-indigo-200/60 dark:ring-indigo-500/20 [&_svg]:text-white"
            : event.status === "error"
            ? "border-rose-300 dark:border-rose-500/60"
            : "border-emerald-300 dark:border-emerald-500/50"
        }`}
      >
        {getEventIcon(event.type, event.toolName)}
      </span>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-2 py-1.5 text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <span className={`text-sm flex-1 ${event.status === "running" ? "active-step-shimmer" : ""}`}>
          {getEventTitle(event)}
        </span>
        <AgentStatusChip status={event.status} />
        {isExpanded ? (
          <BsChevronDown className="text-xs shrink-0" />
        ) : (
          <BsChevronRight className="text-xs shrink-0" />
        )}
      </button>
      {isExpanded && (
        <div className="pb-2">
          {event.type === "thinking" && event.content && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  img: ({ ...props }) => (
                    <div className="my-2 flex justify-start max-w-full">
                      <img
                        {...props}
                        className="max-h-60 max-w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                        loading="lazy"
                      />
                    </div>
                  ),
                }}
              >
                {event.content}
              </ReactMarkdown>
            </div>
          )}
          {event.type === "tool" && renderToolDetails(event, variantCode)}
        </div>
      )}
    </div>
  );
}

function AgentActivity() {
  const { head, commits, latestCommitHash } = useProjectStore();
  const [expandedStepGroups, setExpandedStepGroups] = useState<
    Record<string, boolean>
  >({});

  const currentCommit = head ? commits[head] : null;
  const selectedVariant = currentCommit
    ? currentCommit.variants[currentCommit.selectedVariantIndex]
    : null;
  const selectedVariantStatus = selectedVariant?.status;
  const variantUiKey =
    currentCommit ? `${currentCommit.hash}:${currentCommit.selectedVariantIndex}` : "";

  const variantCode = selectedVariant?.code || "";
  const events = selectedVariant?.agentEvents || [];
  const lastAssistantId = [...events]
    .reverse()
    .find((event) => event.type === "assistant")?.id;

  const isDone = isTerminalVariantStatus(selectedVariantStatus);
  // Reflect the variant's lifecycle in the agent's facial expression/color.
  const agentMood: AgentMood =
    selectedVariantStatus === "error"
      ? "error"
      : selectedVariantStatus === "complete"
      ? "success"
      : selectedVariantStatus === "cancelled"
      ? "idle"
      : "working";
  const isLatestCommit = head === latestCommitHash;

  // Ticking elapsed time while the agent is still working, so the summary
  // header feels live rather than static.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (isDone) return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isDone]);

  if (!isLatestCommit || events.length === 0) {
    return null;
  }

  const completedEventGroups = groupCompletedAgentEvents(events);

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const startedAt = firstEvent?.startedAt ?? selectedVariant?.requestStartedAt;
  const endedAt = isDone
    ? selectedVariant?.completedAt ?? lastEvent?.endedAt
    : nowTick;
  const totalDuration = formatDurationBetween(startedAt, endedAt);
  const stepCount = events.filter((event) => event.type !== "assistant").length;
  const runningCount = events.filter((event) => event.status === "running").length;

  // Compact summary strip describing the overall generation state.
  const statusLabel =
    selectedVariantStatus === "error"
      ? "Ran into an error"
      : selectedVariantStatus === "complete"
      ? "Generation complete"
      : runningCount > 0
      ? "Working on it…"
      : "Thinking…";

  // The action currently in flight, surfaced as a live sub-label.
  const runningEvent = events.find((event) => event.status === "running");

  return (
    <div className="bubble-in mb-3 flex items-start gap-3">
      {/* Floating 3D agent anchors the assistant side of the thread */}
      <Agent3D variant="avatar" mood={agentMood} />
      <div className="relative min-w-0 flex-1 space-y-1 overflow-hidden rounded-2xl rounded-tl-md border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/60 px-4 py-3 shadow-soft dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/60">
        {/* Brand top accent bar */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
        />
        {/* Summary strip: overall status + step count + elapsed time */}
        <div className="mb-1 flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <LuSparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {statusLabel}
            </span>
            {!isDone && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
            {stepCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <LuListChecks className="h-3 w-3" />
                {stepCount} step{stepCount !== 1 ? "s" : ""}
              </span>
            )}
            {totalDuration && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <LuClock className="h-3 w-3" />
                {totalDuration}
              </span>
            )}
          </div>
        </div>
        {!isDone && runningEvent && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-300">
            <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
            <span className="truncate active-step-shimmer">
              {getEventTitle(runningEvent)}
            </span>
          </div>
        )}
        {isDone ? (
          <>
            {completedEventGroups.map((group) => {
            if (group.type === "assistant") {
              return (
                <AgentEventCard
                  key={group.event.id}
                  event={group.event}
                  autoExpand={group.event.id === lastAssistantId}
                />
              );
            }

            const firstStep = group.events[0];
            const lastStep = group.events[group.events.length - 1];
            const groupUiKey = `${variantUiKey}:${firstStep.id}`;
            const isExpanded = Boolean(expandedStepGroups[groupUiKey]);
            const groupDuration = formatDuration(
              firstStep.startedAt,
              lastStep.endedAt
            );

            return (
              <div key={groupUiKey}>
                <button
                  onClick={() =>
                    setExpandedStepGroups((previous) => ({
                      ...previous,
                      [groupUiKey]: !previous[groupUiKey],
                    }))
                  }
                  className="w-full flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-left shadow-soft transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/5"
                >
                  {isExpanded ? (
                    <BsChevronDown className="text-indigo-400 text-xs" />
                  ) : (
                    <BsChevronRight className="text-indigo-400 text-xs" />
                  )}
                  {/* Brand-gradient badge echoing the agent palette */}
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-soft"
                  >
                    <BsLightbulb className="h-3 w-3" />
                  </span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Worked through {group.events.length} step
                    {group.events.length !== 1 ? "s" : ""}
                    {groupDuration ? ` in ${groupDuration}` : ""}
                  </span>
                </button>
                {isExpanded && (
                  <div className="mt-1.5 space-y-1.5">
                    {group.events.map((event) => (
                      <AgentEventCard
                        key={event.id}
                        event={event}
                        variantCode={
                          event.toolName === "create_file"
                            ? variantCode
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
        ) : (
          events.map((event) => (
            <AgentEventCard
              key={event.id}
              event={event}
              autoExpand={event.type === "assistant" && event.id === lastAssistantId}
              variantCode={event.toolName === "create_file" ? variantCode : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default AgentActivity;
