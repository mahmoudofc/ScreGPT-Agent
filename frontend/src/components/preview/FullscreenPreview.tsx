import { useEffect, useState } from "react";
import { FaDesktop, FaMobile } from "react-icons/fa";
import { LuX, LuMinus, LuPlus, LuMaximize } from "react-icons/lu";
import PreviewComponent from "./PreviewComponent";

interface Props {
  code: string;
  onClose: () => void;
}

const WIDTH_PRESETS = [375, 768, 1024, 1280, 1366];

// Standalone full-viewport preview overlay. Reuses PreviewComponent so the
// framed rendering and select-and-edit plumbing stay identical to the pane.
function FullscreenPreview({ code, onClose }: Props) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [width, setWidth] = useState(1366);
  const [zoom, setZoom] = useState(1);
  const [scale, setScale] = useState(1);

  // Esc closes the overlay.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const effectiveWidth = device === "mobile" ? 375 : width;
  const shownPercent = Math.round((device === "mobile" ? scale : zoom) * 100);

  const adjustZoom = (delta: number) =>
    setZoom((prev) => Math.min(2, Math.max(0.5, Math.round((prev + delta) * 100) / 100)));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-white/10 p-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              title="Desktop"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                device === "desktop"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <FaDesktop />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              title="Mobile"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                device === "mobile"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <FaMobile />
            </button>
          </div>

          {device === "desktop" && (
            <div className="hidden items-center gap-1 sm:inline-flex">
              {WIDTH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setWidth(preset)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    width === preset
                      ? "bg-indigo-500/90 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {device === "desktop" && (
            <div className="inline-flex items-center gap-1 rounded-lg bg-white/10 p-1">
              <button
                type="button"
                onClick={() => adjustZoom(-0.1)}
                title="Zoom out"
                className="rounded-md p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <LuMinus className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center text-[11px] font-semibold text-white tabular-nums">
                {shownPercent}%
              </span>
              <button
                type="button"
                onClick={() => adjustZoom(0.1)}
                title="Zoom in"
                className="rounded-md p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <LuPlus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          title="Close (Esc)"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/20"
        >
          <LuX className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <PreviewComponent
          code={code}
          device={device}
          viewMode={device === "desktop" ? "actual" : "fit"}
          widthOverride={device === "desktop" ? effectiveWidth : undefined}
          zoom={device === "desktop" ? zoom : undefined}
          onScaleChange={device === "desktop" ? setScale : undefined}
        />
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/70">
        <LuMaximize className="mr-1 inline h-3 w-3" />
        Press Esc to exit
      </div>
    </div>
  );
}

export default FullscreenPreview;
