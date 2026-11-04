import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  LuCheck,
  LuLoader,
  LuPalette,
  LuSparkles,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { DesignSystem, Settings } from "../../types";
import { NEW_DESIGN_SYSTEM_CONTENT } from "../../lib/design-systems";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import DesignSystemSelector from "../settings/DesignSystemSelector";

interface Props {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  designSystems: DesignSystem[];
  selectedDesignSystemId: string | null;
  setSelectedDesignSystemId: (id: string | null) => void;
  createDesignSystem: (payload: {
    name: string;
    content: string;
  }) => Promise<DesignSystem>;
  updateDesignSystem: (
    id: string,
    payload: { name?: string; content?: string }
  ) => Promise<DesignSystem>;
  deleteDesignSystem: (id: string) => Promise<void>;
  onManage: () => void;
  onClose: () => void;
}

type SaveStatus = "idle" | "saving" | "saved";

// A few ready-made system-prompt starting points users can drop in and tweak.
const PROMPT_PRESETS: { label: string; value: string }[] = [
  {
    label: "Pixel-perfect",
    value:
      "Reproduce the reference with pixel-perfect fidelity. Match spacing, colors, fonts and radii exactly. Prefer semantic HTML and Tailwind utilities.",
  },
  {
    label: "Modern SaaS",
    value:
      "Build a modern SaaS landing page: generous whitespace, soft shadows, rounded corners, a clear visual hierarchy, and a confident indigo/violet accent palette.",
  },
  {
    label: "Minimal",
    value:
      "Keep the design minimal and typographic. Neutral palette, restrained accents, strong readable fonts, and no unnecessary decoration.",
  },
];

function StatusPill({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <LuLoader className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <LuCheck className="h-3 w-3" />
        Auto-saved
      </span>
    );
  }
  return null;
}

function DesignPanel({
  settings,
  setSettings,
  designSystems,
  selectedDesignSystemId,
  setSelectedDesignSystemId,
  createDesignSystem,
  updateDesignSystem,
  deleteDesignSystem,
  onManage,
  onClose,
}: Props) {
  // --- Custom system prompt (debounced autosave into settings/localStorage) ---
  const [promptDraft, setPromptDraft] = useState(settings.customPrompt ?? "");
  const [promptStatus, setPromptStatus] = useState<SaveStatus>("idle");
  const promptTimer = useRef<number | undefined>(undefined);
  // Track the last value we committed so an external settings change (e.g. a
  // project switch) refreshes the draft without fighting the in-flight timer.
  const lastCommittedPrompt = useRef(settings.customPrompt ?? "");

  useEffect(() => {
    const external = settings.customPrompt ?? "";
    if (external !== lastCommittedPrompt.current) {
      lastCommittedPrompt.current = external;
      setPromptDraft(external);
    }
  }, [settings.customPrompt]);

  function handlePromptChange(value: string) {
    setPromptDraft(value);
    setPromptStatus("saving");
    window.clearTimeout(promptTimer.current);
    promptTimer.current = window.setTimeout(() => {
      const next = value.trim() ? value : null;
      lastCommittedPrompt.current = next ?? "";
      setSettings((prev) => ({ ...prev, customPrompt: next }));
      setPromptStatus("saved");
    }, 600);
  }

  useEffect(() => () => window.clearTimeout(promptTimer.current), []);

  // --- Design system content (debounced autosave to the backend) ---
  const selected = designSystems.find((d) => d.id === selectedDesignSystemId);
  const [nameDraft, setNameDraft] = useState(selected?.name ?? "");
  const [contentDraft, setContentDraft] = useState(selected?.content ?? "");
  const [dsStatus, setDsStatus] = useState<SaveStatus>("idle");
  const dsTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setNameDraft(selected?.name ?? "");
    setContentDraft(selected?.content ?? "");
    setDsStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDesignSystemId]);

  // Re-seed the drafts when the backend copy changes but the field is untouched.
  useEffect(() => {
    if (!selected) return;
    if (dsStatus !== "saving") {
      setNameDraft(selected.name);
    }
  }, [selected, dsStatus]);

  function scheduleDesignSystemSave(nextName: string, nextContent: string) {
    if (!selected) return;
    setDsStatus("saving");
    window.clearTimeout(dsTimer.current);
    dsTimer.current = window.setTimeout(async () => {
      try {
        await updateDesignSystem(selected.id, {
          name: nextName.trim() || selected.name,
          content: nextContent,
        });
        setDsStatus("saved");
      } catch (error) {
        console.error("Failed to save design system", error);
        toast.error("Could not save the design system.");
        setDsStatus("idle");
      }
    }, 800);
  }

  function handleNameChange(value: string) {
    setNameDraft(value);
    scheduleDesignSystemSave(value, contentDraft);
  }

  function handleContentChange(value: string) {
    setContentDraft(value);
    scheduleDesignSystemSave(nameDraft, value);
  }

  useEffect(() => () => window.clearTimeout(dsTimer.current), []);

  async function handleNewDesignSystem() {
    try {
      const created = await createDesignSystem({
        name: `Design system ${designSystems.length + 1}`,
        content: NEW_DESIGN_SYSTEM_CONTENT,
      });
      setSelectedDesignSystemId(created.id);
      toast.success("Design system created.");
    } catch (error) {
      console.error("Failed to create design system", error);
      toast.error("Could not create design system.");
    }
  }

  async function handleDeleteSelected() {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteDesignSystem(selected.id);
      setSelectedDesignSystemId(null);
      toast.success("Design system deleted.");
    } catch (error) {
      console.error("Failed to delete design system", error);
      toast.error("Could not delete design system.");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-5 lg:px-6 lg:py-6">
        {/* Header */}
        <div className="rise-in mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-soft">
            <LuPalette className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Design Studio
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Add your own system prompt and design rules — applied live to every
              generation as the agent writes the code.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <LuX className="h-4 w-4" />
            Close
          </button>
        </div>

        {/* Custom system prompt */}
        <div
          className="rise-in mb-5 rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-700">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <LuSparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Custom system prompt
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Global instructions for the model. Saved automatically.
                </p>
              </div>
            </div>
            <StatusPill status={promptStatus} />
          </div>

          <div className="p-4">
            <Textarea
              value={promptDraft}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="e.g. Always use a dark theme, prefer glassmorphism, use Inter for headings…"
              className="min-h-[140px] font-mono text-xs"
              data-testid="custom-prompt"
            />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Presets
              </span>
              {PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePromptChange(preset.value)}
                  className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                >
                  {preset.label}
                </button>
              ))}
              {promptDraft && (
                <button
                  type="button"
                  onClick={() => handlePromptChange("")}
                  className="ml-auto rounded-full px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Design system */}
        <div
          className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-700">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
                <LuPalette className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Design system
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">
                  Colors, typography and layout rules. Edit inline below.
                </p>
              </div>
            </div>
            <StatusPill status={dsStatus} />
          </div>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[220px] flex-1">
                <DesignSystemSelector
                  designSystems={designSystems}
                  selectedDesignSystemId={selectedDesignSystemId}
                  setSelectedDesignSystemId={setSelectedDesignSystemId}
                  onAddNew={handleNewDesignSystem}
                  onManage={onManage}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNewDesignSystem}
              >
                + New
              </Button>
              {selected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LuTrash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>

            {selected ? (
              <>
                <div>
                  <label
                    htmlFor="design-name"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-zinc-300"
                  >
                    Name
                  </label>
                  <Input
                    id="design-name"
                    value={nameDraft}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Marketing site"
                  />
                </div>
                <div>
                  <label
                    htmlFor="design-content"
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-zinc-300"
                  >
                    Instructions
                  </label>
                  <Textarea
                    id="design-content"
                    value={contentDraft}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder="Fill in details about colors, fonts, components, and layout preferences…"
                    className="min-h-[220px] font-mono text-xs"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-md border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-zinc-700 dark:text-zinc-400">
                No design system selected. Pick one above or click{" "}
                <span className="font-medium">+ New</span> to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignPanel;
