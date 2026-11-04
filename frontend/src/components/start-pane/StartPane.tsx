import React from "react";
import { LuSparkles, LuImage, LuType, LuLayers } from "react-icons/lu";
import { DesignSystem, Settings } from "../../types";
import { Stack } from "../../lib/stacks";
import UnifiedInputPane from "../unified-input/UnifiedInputPane";
import Logo from "../core/Logo";
import Agent3D from "../core/Agent3D";

const SUGGESTION_PILLS = [
  { icon: LuImage, label: "Upload a screenshot" },
  { icon: LuType, label: "Describe your idea" },
  { icon: LuLayers, label: "Pick a stack" },
];

interface Props {
  doCreate: (
    images: string[],
    inputMode: "image" | "video",
    textPrompt?: string,
    isAssetExtractionEnabled?: boolean
  ) => void;
  doCreateFromText: (text: string) => void;
  importFromCode: (code: string, stack: Stack) => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  designSystems: DesignSystem[];
  onAddNewDesignSystem: () => void;
  onManageDesignSystems: () => void;
}

const StartPane: React.FC<Props> = ({
  doCreate,
  doCreateFromText,
  importFromCode,
  settings,
  setSettings,
  designSystems,
  onAddNewDesignSystem,
  onManageDesignSystems,
}) => {
  return (
    <div className="brand-backdrop relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Decorative backdrop layers */}
      <div
        aria-hidden="true"
        className="dot-grid dot-grid-pan pointer-events-none absolute inset-0 opacity-40"
      />
      <div
        aria-hidden="true"
        className="aurora-blob pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/20"
      />
      <div
        aria-hidden="true"
        className="aurora-blob aurora-blob-2 pointer-events-none absolute -right-16 top-24 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-500/20"
      />

      <div className="relative mb-7 flex flex-col items-center gap-4 text-center">
        <div className="rise-in">
          <Agent3D variant="avatar" mood="idle" />
        </div>
        <Logo className="scale-110" />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Turn any screenshot into{" "}
          <span className="animated-brand-gradient">working code</span>
        </h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-zinc-400">
          Drop in an image, a URL, or just describe it — ScreGPT builds the page
          for you with an autonomous AI agent.
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {SUGGESTION_PILLS.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-600 backdrop-blur dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300"
            >
              <pill.icon className="h-3.5 w-3.5" />
              {pill.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative w-full max-w-2xl">
        <UnifiedInputPane
          doCreate={doCreate}
          doCreateFromText={doCreateFromText}
          importFromCode={importFromCode}
          settings={settings}
          setSettings={setSettings}
          designSystems={designSystems}
          onAddNewDesignSystem={onAddNewDesignSystem}
          onManageDesignSystems={onManageDesignSystems}
        />
      </div>
      <p className="relative mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
        <LuSparkles className="h-3.5 w-3.5 text-indigo-400/70" />
        Powered by Gemini · your work stays on your device
      </p>
    </div>
  );
};

export default StartPane;
