import { useCallback, useEffect, useRef, useState } from "react";
import useThrottle from "../../hooks/useThrottle";
import { useAppStore } from "../../store/app-store";
import { normalizeBabelCdn } from "../../lib/babelCdn";
import {
  applySelectModeCursor,
  hideHoverOverlay,
  hideSelectionOverlay,
  removeHoverOverlay,
  removeSelectModeCursor,
  removeSelectionOverlay,
  showHoverOverlay,
  showSelectionOverlay,
} from "../select-and-edit/overlays";

interface Props {
  code: string;
  device: "mobile" | "desktop";
  onScaleChange?: (scale: number) => void;
  viewMode?: "fit" | "actual";
  // Explicit CSS backdrop layer for the stage (defaults to the studio look).
  stageClass?: string;
  // Overrides the viewport width in px (used by breakpoint presets, desktop only).
  widthOverride?: number;
  // Manual zoom factor used when viewMode === "actual" (desktop only).
  zoom?: number;
}

const MOBILE_VIEWPORT_WIDTH = 375;
export const DESKTOP_VIEWPORT_WIDTH = 1366;

function PreviewComponent({
  code,
  device,
  onScaleChange,
  viewMode,
  stageClass,
  widthOverride,
  zoom,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const sizingRef = useRef<HTMLDivElement | null>(null);

  // Don't update code more often than every 200ms.
  const throttledCode = useThrottle(code, 200);

  // Select and edit functionality
  const [clickEvent, setClickEvent] = useState<MouseEvent | null>(null);
  const activeMode = viewMode ?? "fit";

  // In select-and-edit mode, intercept clicks in the capture phase so the
  // generated app's own handlers (React/Vue listeners, Bootstrap/Ionic
  // behaviors, link navigation, form submits) never fire while selecting.
  const handleIframeClick = useCallback((event: MouseEvent) => {
    if (!inSelectAndEditModeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    setClickEvent(event);
  }, []);

  // Suppress the rest of the pointer sequence (and form submits) while
  // selecting, since app handlers can be bound to those events too.
  const handleIframeInteraction = useCallback((event: Event) => {
    if (!inSelectAndEditModeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleIframeLinkClick = useCallback((event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest?.("a");
    if (!target) return;
    const href = target.getAttribute("href");
    if (href && href.startsWith("#")) {
      event.preventDefault();
    }
  }, []);

  // Devtools-style hover ring while selecting
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  const handleIframeMouseOver = useCallback((event: MouseEvent) => {
    if (!inSelectAndEditModeRef.current) return;
    const target = event.target as HTMLElement;
    if (!target || !target.getBoundingClientRect) return;

    // The locked target owns this space. Avoid stacking the lighter hover
    // treatment over it, which can obscure the stronger selection ring/label.
    const selected = useAppStore.getState().selectedElement;
    if (selected && (target === selected || selected.contains(target))) {
      hoveredElementRef.current = null;
      hideHoverOverlay(target.ownerDocument);
      return;
    }

    hoveredElementRef.current = target;
    showHoverOverlay(target);
  }, []);

  const handleIframeMouseOut = useCallback((event: MouseEvent) => {
    if (!inSelectAndEditModeRef.current) return;
    // Only when the pointer leaves the iframe viewport entirely
    if (event.relatedTarget) return;
    hoveredElementRef.current = null;
    hideHoverOverlay((event.target as HTMLElement)?.ownerDocument);
  }, []);

  // Keep the rings glued to their elements while the page scrolls or
  // resizes under a stationary cursor.
  const handleIframeReposition = useCallback(() => {
    if (!inSelectAndEditModeRef.current) return;
    const hovered = hoveredElementRef.current;
    if (hovered && hovered.isConnected) {
      showHoverOverlay(hovered);
    }
    const selected = useAppStore.getState().selectedElement;
    if (selected && selected.isConnected) {
      showSelectionOverlay(selected);
    }
  }, []);

  // Escape exits select mode even when focus is inside the iframe.
  const handleIframeKeyDown = useCallback((event: KeyboardEvent) => {
    if (!inSelectAndEditModeRef.current) return;
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    useAppStore.getState().disableInSelectAndEditMode();
  }, []);

  const {
    inSelectAndEditMode,
    selectedElement,
    setSelectedElement,
  } = useAppStore();

  const inSelectAndEditModeRef = useRef(inSelectAndEditMode);
  useEffect(() => {
    inSelectAndEditModeRef.current = inSelectAndEditMode;
  }, [inSelectAndEditMode]);

  // Handle click events to select elements
  useEffect(() => {
    if (!inSelectAndEditModeRef.current || !clickEvent) {
      return;
    }

    const targetElement = clickEvent.target as HTMLElement;
    if (!targetElement) return;

    // Replace the transient hover treatment with the visually stronger locked
    // target immediately; hovering other elements remains available afterward.
    hoveredElementRef.current = null;
    hideHoverOverlay(targetElement.ownerDocument);
    setSelectedElement(targetElement);
  }, [clickEvent, setSelectedElement]);

  // Render the selection ring for whatever element is currently selected
  // (clearing it when the selection is cleared from anywhere, e.g. the
  // sidebar's X button or after submitting an edit).
  useEffect(() => {
    if (selectedElement && selectedElement.isConnected) {
      showSelectionOverlay(selectedElement);
      return;
    }
    hideSelectionOverlay(iframeRef.current?.contentWindow?.document);
  }, [selectedElement]);

  // Apply/remove select-mode side effects (cursor, hover and selection
  // rings) when the mode toggles.
  useEffect(() => {
    const doc = iframeRef.current?.contentWindow?.document;
    if (inSelectAndEditMode) {
      applySelectModeCursor(doc);
      return;
    }
    if (selectedElement) {
      setSelectedElement(null);
    }
    hoveredElementRef.current = null;
    removeHoverOverlay(doc);
    removeSelectionOverlay(doc);
    removeSelectModeCursor(doc);
  }, [inSelectAndEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply a fixed viewport per device and scale to fit the available pane.
  useEffect(() => {
    const updateScale = () => {
      const wrapper = wrapperRef.current;
      const iframe = iframeRef.current;
      if (!wrapper || !iframe) return;

      const viewportWidth = wrapper.clientWidth;
      const viewportHeight = wrapper.clientHeight;

      if (device === "desktop") {
        const targetWidth = widthOverride ?? DESKTOP_VIEWPORT_WIDTH;
        const scaleValue =
          activeMode === "fit"
            ? Math.min(1, viewportWidth / targetWidth)
            : zoom ?? 1;
        // Reserve the scaled footprint so the stage scrolls correctly when
        // zoomed past the pane or viewing a wide breakpoint.
        const iframeHeight = scaleValue > 0 ? viewportHeight / scaleValue : viewportHeight;

        if (sizingRef.current) {
          sizingRef.current.style.width = `${targetWidth * scaleValue}px`;
          sizingRef.current.style.height = `${iframeHeight * scaleValue}px`;
        }

        onScaleChange?.(scaleValue);
        iframe.style.width = `${targetWidth}px`;
        iframe.style.height = `${iframeHeight}px`;
        iframe.style.transform = `scale(${scaleValue})`;
        iframe.style.transformOrigin = "top left";
        return;
      }

      onScaleChange?.(1);
      iframe.style.width = `${MOBILE_VIEWPORT_WIDTH}px`;
      iframe.style.height = `${viewportHeight}px`;
      iframe.style.transform = "scale(1)";
      iframe.style.transformOrigin = "top left";
    };

    updateScale();

    window.addEventListener("resize", updateScale);
    const resizeObserver = new ResizeObserver(updateScale);
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver.disconnect();
    };
  }, [activeMode, device, onScaleChange, widthOverride, zoom]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const suppressedEvents = ["pointerdown", "mousedown", "mouseup", "submit"];

    const handleLoad = () => {
      const win = iframe.contentWindow;
      if (!win) return;
      // Intercept on the window in the capture phase: the window is the
      // first node in the propagation path, so this runs before any handler
      // the generated app registered, including capture-phase delegated
      // handlers on document (e.g. Bootstrap's data API).
      win.addEventListener("click", handleIframeClick, true);
      for (const type of suppressedEvents) {
        win.addEventListener(type, handleIframeInteraction, true);
      }
      win.addEventListener("mouseover", handleIframeMouseOver, true);
      win.addEventListener("mouseout", handleIframeMouseOut, true);
      win.addEventListener("scroll", handleIframeReposition, true);
      win.addEventListener("resize", handleIframeReposition);
      win.addEventListener("keydown", handleIframeKeyDown, true);
      win.document.addEventListener("click", handleIframeLinkClick);
      // A reload replaces the document, so re-apply mode side effects.
      if (inSelectAndEditModeRef.current) {
        applySelectModeCursor(win.document);
      }
    };

    iframe.addEventListener("load", handleLoad);
    // The current document may already be loaded (e.g. the component
    // re-rendered after the iframe's load event); attach to it directly.
    // addEventListener dedupes identical handlers, so this is safe.
    if (iframe.contentWindow?.document.readyState === "complete") {
      handleLoad();
    }

    return () => {
      iframe.removeEventListener("load", handleLoad);
      const win = iframe.contentWindow;
      if (win) {
        win.removeEventListener("click", handleIframeClick, true);
        for (const type of suppressedEvents) {
          win.removeEventListener(type, handleIframeInteraction, true);
        }
        win.removeEventListener("mouseover", handleIframeMouseOver, true);
        win.removeEventListener("mouseout", handleIframeMouseOut, true);
        win.removeEventListener("scroll", handleIframeReposition, true);
        win.removeEventListener("resize", handleIframeReposition);
        win.removeEventListener("keydown", handleIframeKeyDown, true);
        win.document.removeEventListener("click", handleIframeLinkClick);
      }
    };
  }, [
    handleIframeClick,
    handleIframeLinkClick,
    handleIframeInteraction,
    handleIframeMouseOver,
    handleIframeMouseOut,
    handleIframeReposition,
    handleIframeKeyDown,
  ]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Normalize the Babel CDN so generated React pages (old and new) mount.
    const html = normalizeBabelCdn(throttledCode);
    if (iframe.srcdoc !== html) {
      iframe.srcdoc = html;
    }
  }, [throttledCode]);

  const iframeEl = (
    <iframe
      id={`preview-${device}`}
      ref={iframeRef}
      title="Preview"
      className="block border-0"
    />
  );

  const stage = stageClass ?? "studio-backdrop";

  // Mobile: a real phone bezel floating on the studio backdrop.
  if (device === "mobile") {
    return (
      <div className={`${stage} relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden p-4 sm:p-6`}>
        <div className="phone-frame frame-in flex h-full w-fit items-stretch">
          <span aria-hidden="true" className="phone-notch" />
          <div ref={wrapperRef} className="phone-screen relative">
            {iframeEl}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: presented inside a browser window. The screen area scrolls when a
  // wide breakpoint or manual zoom exceeds the pane.
  return (
    <div className={`${stage} relative flex min-h-0 flex-1 items-stretch justify-center overflow-hidden p-4 sm:p-6`}>
      <div className="browser-shell frame-in flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900">
        {/* Browser chrome bar */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white px-4 py-2 dark:border-zinc-800 dark:from-zinc-800/60 dark:to-zinc-900">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto flex max-w-md flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="truncate">preview.screngpt.app</span>
          </div>
        </div>
        <div ref={wrapperRef} className="relative min-h-0 flex-1 overflow-auto bg-white">
          <div ref={sizingRef} className="relative">
            {iframeEl}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewComponent;
