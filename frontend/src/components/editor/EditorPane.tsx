import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LuFileCode,
  LuFileText,
  LuBraces,
  LuPlus,
  LuX,
  LuCheck,
  LuTrash2,
  LuSave,
  LuRotateCcw,
  LuCopy,
  LuFileLock2,
  LuEye,
  LuMonitor,
  LuCode,
} from "react-icons/lu";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import { Settings } from "../../types";
import { useProjectStore } from "../../store/project-store";
import { useWorkspaceStore, WorkspaceFile, INDEX_HTML_PATH } from "../../store/workspace-store";
import { useProjectsStore } from "../../store/projects-store";
import { composePreviewHtml, ComposeInputFile } from "../../lib/compose-preview";
import CodeMirror, { CodeLanguage, CursorPosition } from "../preview/CodeMirror";

interface Props {
  settings: Settings;
}

interface Draft {
  content: string;
  dirty: boolean;
}

const LANGUAGE_ICON: Record<CodeLanguage, React.ComponentType<{ className?: string }>> = {
  html: LuFileCode,
  css: LuBraces,
  js: LuFileText,
};

const LANGUAGE_BADGE: Record<CodeLanguage, string> = {
  html: "from-orange-500 to-rose-500",
  css: "from-sky-500 to-indigo-500",
  js: "from-amber-500 to-yellow-500",
};

function EditorPane({ settings }: Props) {
  const { head, commits } = useProjectStore();
  const setHeadCode = useProjectStore((s) => s.setHeadCode);
  const activeProjectId = useProjectsStore((s) => s.activeProjectId);
  const filesByProject = useWorkspaceStore((s) => s.filesByProject);
  const ensureSeed = useWorkspaceStore((s) => s.ensureSeed);
  const updateFileContent = useWorkspaceStore((s) => s.updateFileContent);
  const setSeedHtml = useWorkspaceStore((s) => s.setSeedHtml);
  const addFile = useWorkspaceStore((s) => s.addFile);
  const deleteFile = useWorkspaceStore((s) => s.deleteFile);
  const renameFile = useWorkspaceStore((s) => s.renameFile);

  const files = useMemo(
    () => (activeProjectId ? filesByProject[activeProjectId] ?? [] : []),
    [activeProjectId, filesByProject]
  );

  const headCode = useMemo(() => {
    if (!head || !commits[head]) return "";
    const commit = commits[head];
    return commit.variants[commit.selectedVariantIndex]?.code ?? "";
  }, [head, commits]);

  const [openIds, setOpenIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"css" | "js">("css");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, col: 1, selected: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const draftFor = useCallback(
    (file: WorkspaceFile): Draft =>
      drafts[file.id] ?? { content: file.content, dirty: false },
    [drafts]
  );

  // Keep the workspace index.html in sync with the head code and reset drafts
  // whenever the version changes (per the editor's per-version editing model).
  const prevHeadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeProjectId) return;
    if (headCode) {
      ensureSeed(activeProjectId, headCode);
      setSeedHtml(activeProjectId, headCode);
    } else {
      ensureSeed(activeProjectId, "");
    }
    // A version switch invalidates unsaved edits — drop them loudly instead of
    // silently showing stale drafts against new content.
    const switched =
      prevHeadRef.current !== null && prevHeadRef.current !== head;
    if (switched && Object.values(drafts).some((d) => d.dirty)) {
      setDrafts({});
      toast("Switched version — unsaved edits discarded", { icon: "ℹ️" });
    }
    prevHeadRef.current = head;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId, head]);

  const htmlFile = files.find((f) => f.path === INDEX_HTML_PATH);
  const assetFiles = files.filter((f) => f.path !== INDEX_HTML_PATH);

  // Auto-open index.html once it exists. The guard lives inside the updater so
  // double-invoked effects (StrictMode) cannot append the same id twice.
  useEffect(() => {
    if (htmlFile) {
      setOpenIds((prev) =>
        prev.includes(htmlFile.id) ? prev : [...prev, htmlFile.id]
      );
      setActiveId((prev) => prev ?? htmlFile.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlFile?.id]);

  // Drop drafts for files that no longer exist.
  useEffect(() => {
    setDrafts((prev) => {
      const ids = new Set(files.map((f) => f.id));
      const next: Record<string, Draft> = {};
      for (const [id, draft] of Object.entries(prev)) {
        if (ids.has(id)) next[id] = draft;
      }
      return next;
    });
  }, [files]);

  const activeFile = files.find((f) => f.id === activeId) ?? null;

  const openFile = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveId(id);
  };

  const closeTab = (id: string) => {
    setOpenIds((prev) => {
      const next = prev.filter((openId) => openId !== id);
      if (activeId === id) {
        setActiveId(next[next.length - 1] ?? null);
      }
      return next;
    });
  };

  // Write a draft back to its durable home: index.html edits patch the head
  // commit; user files update the workspace store.
  const persistFile = useCallback(
    (file: WorkspaceFile, content: string) => {
      if (file.path === INDEX_HTML_PATH) {
        if (head) setHeadCode(head, content);
        if (activeProjectId) setSeedHtml(activeProjectId, content);
      } else if (activeProjectId) {
        updateFileContent(activeProjectId, file.id, content);
      }
    },
    [head, setHeadCode, activeProjectId, setSeedHtml, updateFileContent]
  );

  const handleSave = useCallback(() => {
    if (!activeFile) return;
    const draft = draftFor(activeFile);
    if (!draft.dirty) return;
    persistFile(activeFile, draft.content);
    setDrafts((prev) => ({
      ...prev,
      [activeFile.id]: { content: draft.content, dirty: false },
    }));
    toast.success(`Saved ${activeFile.path}`);
  }, [activeFile, draftFor, persistFile]);

  const handleSaveAll = () => {
    const dirty = files
      .map((f) => ({ file: f, draft: draftFor(f) }))
      .filter((entry) => entry.draft.dirty);
    if (dirty.length === 0) return;
    const nextDrafts: Record<string, Draft> = {};
    for (const { file, draft } of dirty) {
      persistFile(file, draft.content);
      nextDrafts[file.id] = { content: draft.content, dirty: false };
    }
    setDrafts((prev) => ({ ...prev, ...nextDrafts }));
    toast.success(`Saved ${dirty.length} file${dirty.length === 1 ? "" : "s"}`);
  };

  // Ctrl/Cmd+S saves the active file (also bound inside CodeMirror itself).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const handleRevert = () => {
    if (!activeFile) return;
    setDrafts((prev) => ({
      ...prev,
      [activeFile.id]: { content: activeFile.content, dirty: false },
    }));
  };

  const handleCopy = () => {
    if (!activeFile) return;
    copy(draftFor(activeFile).content);
    toast.success("Copied to clipboard");
  };

  const handleAddFile = () => {
    if (!activeProjectId) return;
    const withExt = /\.[a-z]+$/i.test(newName) ? newName : `${newName}.${newType}`;
    const result = addFile(activeProjectId, withExt, newType);
    if (result.ok) {
      openFile(result.file.id);
      setIsAdding(false);
      setNewName("");
      toast.success(`Created ${result.file.path}`);
    } else {
      toast.error(result.error);
    }
  };

  const startRename = (file: WorkspaceFile) => {
    if (!file.isUserFile) return;
    setConfirmDeleteId(null);
    setRenamingId(file.id);
    setRenameValue(file.path);
  };

  const commitRename = (file: WorkspaceFile) => {
    setRenamingId(null);
    if (!activeProjectId) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === file.path) return;
    const result = renameFile(activeProjectId, file.id, trimmed);
    if (!result.ok) toast.error(result.error);
  };

  const handleDelete = (file: WorkspaceFile) => {
    if (!activeProjectId || !file.isUserFile) return;
    deleteFile(activeProjectId, file.id);
    closeTab(file.id);
    setConfirmDeleteId(null);
  };

  // ---- Live preview (debounced composition of drafts over the head code) ----
  useEffect(() => {
    if (!showPreview) {
      setPreviewDoc(null);
      return;
    }
    const timer = window.setTimeout(() => {
      const base = htmlFile ? draftFor(htmlFile).content : "";
      const cssFiles: ComposeInputFile[] = files
        .filter((f) => f.language === "css")
        .map((f) => ({ path: f.path, content: draftFor(f).content }));
      const jsFiles: ComposeInputFile[] = files
        .filter((f) => f.language === "js")
        .map((f) => ({ path: f.path, content: draftFor(f).content }));
      setPreviewDoc(composePreviewHtml(base, cssFiles, jsFiles));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [showPreview, drafts, files, htmlFile, draftFor]);

  const activeDraft = activeFile ? draftFor(activeFile) : null;
  const dirtyCount = files.filter((f) => draftFor(f).dirty).length;
  const lineCount = activeDraft ? activeDraft.content.split("\n").length : 0;
  const charCount = activeDraft ? activeDraft.content.length : 0;

  const fileRows = (
    <>
      {htmlFile && (
        <FileRow
          file={htmlFile}
          index={0}
          active={activeId === htmlFile.id}
          dirty={draftFor(htmlFile).dirty}
          locked
          onOpen={() => openFile(htmlFile.id)}
        />
      )}
      {assetFiles.map((file, i) => (
        <FileRow
          key={file.id}
          file={file}
          index={i + 1}
          active={activeId === file.id}
          dirty={draftFor(file).dirty}
          renaming={renamingId === file.id}
          renameValue={renameValue}
          confirmingDelete={confirmDeleteId === file.id}
          onOpen={() => openFile(file.id)}
          onRenameStart={() => startRename(file)}
          onRenameChange={setRenameValue}
          onRenameCommit={() => commitRename(file)}
          onDeleteRequest={() => setConfirmDeleteId(file.id)}
          onConfirmDelete={() => handleDelete(file)}
          onCancelDelete={() => setConfirmDeleteId(null)}
        />
      ))}
    </>
  );

  return (
    <div className="flex h-full min-h-0 bg-slate-50 dark:bg-zinc-950">
      {/* File tree */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-3 py-2 dark:border-zinc-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Files
          </span>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            title="New file"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:text-zinc-500 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-300"
          >
            <LuPlus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {fileRows}

          {isAdding && (
            <NewFileForm
              newName={newName}
              newType={newType}
              onNameChange={setNewName}
              onTypeChange={setNewType}
              onSubmit={handleAddFile}
              onCancel={() => setIsAdding(false)}
            />
          )}
        </div>
      </aside>

      {/* Editor column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile file chips (the tree is desktop-only) */}
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200/80 bg-white/80 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:hidden">
          {files.map((file) => {
            const Icon = LANGUAGE_ICON[file.language];
            const isActive = activeId === file.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => openFile(file.id)}
                className={`flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
                    : "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-3 w-3" />
                {file.path}
                {draftFor(file).dirty && (
                  <span className="dot-pulse h-1 w-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsAdding((v) => !v)}
            title="New file"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/15"
          >
            <LuPlus className="h-3.5 w-3.5" />
          </button>
        </div>
        {isAdding && (
          <div className="border-b border-slate-200/70 px-3 py-2 dark:border-zinc-800 sm:hidden">
            <NewFileForm
              newName={newName}
              newType={newType}
              onNameChange={setNewName}
              onTypeChange={setNewType}
              onSubmit={handleAddFile}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-slate-200/80 bg-white/80 px-2 pt-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          {openIds.map((id) => {
            const file = files.find((f) => f.id === id);
            if (!file) return null;
            const isActive = id === activeId;
            const dirty = draftFor(file).dirty;
            const Icon = LANGUAGE_ICON[file.language];
            return (
              <div
                key={id}
                onClick={() => setActiveId(id)}
                className={`group relative flex cursor-pointer items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <span className="absolute inset-x-1 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                )}
                <Icon
                  className={`h-3 w-3 shrink-0 bg-gradient-to-br bg-clip-text opacity-70 ${LANGUAGE_BADGE[file.language]}`}
                />
                <span className="max-w-[140px] truncate">{file.path}</span>
                {dirty && (
                  <span className="dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(id);
                  }}
                  className="ml-0.5 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                >
                  <LuX className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 bg-gradient-to-b from-white/95 to-slate-50/85 px-4 py-2 dark:border-zinc-800 dark:from-zinc-900/85 dark:to-zinc-950/80">
          <div className="flex min-w-0 items-center gap-2">
            {activeFile && (
              <>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${
                    LANGUAGE_BADGE[activeFile.language]
                  }`}
                >
                  {(() => {
                    const Icon = LANGUAGE_ICON[activeFile.language];
                    return <Icon className="h-4 w-4" />;
                  })()}
                </span>
                <span className="truncate text-sm font-medium text-slate-700 dark:text-zinc-200">
                  {activeFile.path}
                </span>
                <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 sm:inline">
                  {activeFile.language}
                </span>
                {dirtyCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <span className="dot-pulse h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {dirtyCount} unsaved
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              title="Toggle live preview"
              className={`hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors md:flex ${
                showPreview
                  ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <LuEye className="h-3.5 w-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!activeFile}
              title="Copy file"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LuCopy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRevert}
              disabled={!activeDraft?.dirty}
              title="Revert changes"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <LuRotateCcw className="h-3.5 w-3.5" /> Revert
            </button>
            {dirtyCount > 1 && (
              <button
                type="button"
                onClick={handleSaveAll}
                title="Save all files"
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500/30 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              >
                <LuSave className="h-3.5 w-3.5" /> Save all
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!activeDraft?.dirty}
              title="Save (Ctrl/Cmd+S)"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LuSave className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>

        {/* Body: editor + optional live preview */}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col p-2">
            {activeFile && activeDraft ? (
              <CodeMirror
                key={activeFile.id}
                code={activeDraft.content}
                editorTheme={settings.editorTheme}
                language={activeFile.language}
                fullHeight
                className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 shadow-soft dark:border-zinc-800"
                onCursor={setCursor}
                onSaveKey={handleSave}
                onCodeChange={(content) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [activeFile.id]: {
                      content,
                      dirty: content !== activeFile.content,
                    },
                  }))
                }
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 text-center dark:border-zinc-800">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft">
                  <LuCode className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                    No file open
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">
                    Pick a file from the tree to start editing
                  </p>
                </div>
              </div>
            )}
          </div>

          {showPreview && (
            <div className="hidden w-[45%] max-w-[560px] shrink-0 flex-col border-l border-slate-200/80 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/40 md:flex">
              <div className="flex items-center gap-2 border-b border-slate-200/70 px-3 py-1.5 dark:border-zinc-800">
                <LuMonitor className="h-3.5 w-3.5 text-sky-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Live preview
                </span>
                <span className="ml-auto text-[10px] text-slate-400/80 dark:text-zinc-600">
                  updates as you type
                </span>
              </div>
              <div className="min-h-0 flex-1 p-2">
                {previewDoc !== null ? (
                  <iframe
                    title="Editor live preview"
                    srcDoc={previewDoc}
                    sandbox="allow-scripts allow-forms allow-modals allow-popups"
                    className="h-full w-full rounded-lg border border-slate-200/80 bg-white dark:border-zinc-800"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 dark:border-zinc-800 dark:text-zinc-500">
                    Rendering…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200/70 bg-white/90 px-3 py-1 text-[11px] text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-500">
          <div className="flex min-w-0 items-center gap-3">
            {activeFile ? (
              <span className="truncate">{activeFile.path}</span>
            ) : (
              <span>No file</span>
            )}
            <span className="hidden lg:inline">
              Ctrl+S save · Ctrl+F find · Tab complete
            </span>
          </div>
          {activeFile && (
            <div className="flex shrink-0 items-center gap-3">
              <span>
                Ln {cursor.line}, Col {cursor.col}
                {cursor.selected > 0 && ` · ${cursor.selected} selected`}
              </span>
              <span className="hidden sm:inline">{lineCount} lines</span>
              <span className="hidden sm:inline">{charCount} chars</span>
              <span className="uppercase">{activeFile.language}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface NewFileFormProps {
  newName: string;
  newType: "css" | "js";
  onNameChange: (v: string) => void;
  onTypeChange: (v: "css" | "js") => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function NewFileForm({
  newName,
  newType,
  onNameChange,
  onTypeChange,
  onSubmit,
  onCancel,
}: NewFileFormProps) {
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/40 p-2 dark:border-indigo-500/40 dark:bg-indigo-500/10">
      <input
        autoFocus
        value={newName}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="filename"
        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <div className="flex items-center gap-1">
        {(["css", "js"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onTypeChange(type)}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              newType === type
                ? "bg-indigo-500 text-white"
                : "bg-white text-slate-500 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            .{type}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-1 text-[11px] font-semibold text-white"
        >
          Create
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface FileRowProps {
  file: WorkspaceFile;
  index: number;
  active: boolean;
  dirty: boolean;
  locked?: boolean;
  renaming?: boolean;
  renameValue?: string;
  confirmingDelete?: boolean;
  onOpen: () => void;
  onRenameStart?: () => void;
  onRenameChange?: (v: string) => void;
  onRenameCommit?: () => void;
  onDeleteRequest?: () => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
}

function FileRow({
  file,
  index,
  active,
  dirty,
  locked,
  renaming,
  renameValue,
  confirmingDelete,
  onOpen,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onDeleteRequest,
  onConfirmDelete,
  onCancelDelete,
}: FileRowProps) {
  const Icon = LANGUAGE_ICON[file.language];

  if (renaming) {
    return (
      <div className="px-2 py-1">
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRenameCommit?.();
            if (e.key === "Escape") onRenameCommit?.();
          }}
          onBlur={() => onRenameCommit?.()}
          className="w-full rounded-md border border-indigo-300 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-400 dark:border-indigo-500/50 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onOpen}
      onDoubleClick={() => !locked && onRenameStart?.()}
      style={{ ["--row-index" as string]: String(index) }}
      className={`stagger-row group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200"
          : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span
        className="min-w-0 flex-1 truncate"
        title={file.isUserFile ? "Double-click to rename" : undefined}
      >
        {file.path}
      </span>
      {dirty && (
        <span className="dot-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
      )}
      {locked ? (
        <LuFileLock2 className="h-3 w-3 shrink-0 text-slate-300 dark:text-zinc-600" title="Managed by the agent" />
      ) : confirmingDelete ? (
        <span className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirmDelete?.();
            }}
            className="rounded p-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15"
            title="Confirm delete"
          >
            <LuCheck className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancelDelete?.();
            }}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            title="Cancel"
          >
            <LuX className="h-3.5 w-3.5" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest?.();
          }}
          className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
          title="Delete file"
        >
          <LuTrash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default EditorPane;
