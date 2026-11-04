import { create } from "zustand";
import { nanoid } from "nanoid";
import type { CodeLanguage } from "../components/preview/CodeMirror";

export const INDEX_HTML_PATH = "index.html";

export interface WorkspaceFile {
  id: string;
  path: string;
  content: string;
  language: CodeLanguage;
  // index.html (the seed) is not a user file and cannot be renamed or deleted.
  isUserFile: boolean;
  createdAt: number;
}

interface FilesByProject {
  [projectId: string]: WorkspaceFile[];
}

interface WorkspaceStore {
  filesByProject: FilesByProject;
  getFiles: (projectId: string) => WorkspaceFile[];
  // Ensures an index.html seed exists for the project without clobbering it.
  ensureSeed: (projectId: string, html: string) => void;
  // Overwrites the index.html seed content (used to mirror head code changes).
  setSeedHtml: (projectId: string, html: string) => void;
  updateFileContent: (projectId: string, fileId: string, content: string) => void;
  addFile: (
    projectId: string,
    path: string,
    language: CodeLanguage
  ) => { ok: true; file: WorkspaceFile } | { ok: false; error: string };
  deleteFile: (projectId: string, fileId: string) => void;
  renameFile: (
    projectId: string,
    fileId: string,
    path: string
  ) => { ok: true } | { ok: false; error: string };
  resetWorkspace: (projectId: string) => void;
}

const STORAGE_KEY = "workspace-files";

const ALLOWED_EXTENSIONS: Record<CodeLanguage, string> = {
  html: ".html",
  css: ".css",
  js: ".js",
};

function languageForPath(path: string): CodeLanguage | null {
  const lower = path.toLowerCase();
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".js")) return "js";
  return null;
}

function loadFromStorage(): FilesByProject {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FilesByProject) : {};
  } catch {
    return {};
  }
}

function persist(filesByProject: FilesByProject) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filesByProject));
  } catch {
    // Ignore quota / serialization failures — the in-memory store still works.
  }
}

function makeSeedFile(html: string): WorkspaceFile {
  return {
    id: nanoid(),
    path: INDEX_HTML_PATH,
    content: html,
    language: "html",
    isUserFile: false,
    createdAt: Date.now(),
  };
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  filesByProject: loadFromStorage(),

  getFiles: (projectId) => get().filesByProject[projectId] ?? [],

  ensureSeed: (projectId, html) =>
    set((state) => {
      const existing = state.filesByProject[projectId];
      if (existing && existing.some((f) => !f.isUserFile)) {
        return state;
      }
      const filesByProject: FilesByProject = {
        ...state.filesByProject,
        [projectId]: [makeSeedFile(html), ...(existing ?? [])],
      };
      persist(filesByProject);
      return { filesByProject };
    }),

  setSeedHtml: (projectId, html) =>
    set((state) => {
      const existing = state.filesByProject[projectId] ?? [];
      const hasSeed = existing.some((f) => !f.isUserFile);
      const updated = hasSeed
        ? existing.map((f) =>
            f.isUserFile ? f : { ...f, content: html }
          )
        : [makeSeedFile(html), ...existing];
      const filesByProject: FilesByProject = {
        ...state.filesByProject,
        [projectId]: updated,
      };
      persist(filesByProject);
      return { filesByProject };
    }),

  updateFileContent: (projectId, fileId, content) =>
    set((state) => {
      const existing = state.filesByProject[projectId] ?? [];
      const filesByProject: FilesByProject = {
        ...state.filesByProject,
        [projectId]: existing.map((f) =>
          f.id === fileId ? { ...f, content } : f
        ),
      };
      persist(filesByProject);
      return { filesByProject };
    }),

  addFile: (projectId, path, language) => {
    const trimmed = path.trim();
    const detected = languageForPath(trimmed);
    if (!trimmed) return { ok: false as const, error: "File name is required." };
    if (!detected)
      return {
        ok: false as const,
        error: "Only .html, .css and .js files are supported.",
      };
    if (detected !== language)
      return {
        ok: false as const,
        error: `A ${language} file must end with ${ALLOWED_EXTENSIONS[language]}.`,
      };
    if (trimmed === INDEX_HTML_PATH)
      return { ok: false as const, error: "index.html already exists." };

    const { filesByProject } = get();
    const existing = filesByProject[projectId] ?? [];
    if (existing.some((f) => f.path.toLowerCase() === trimmed.toLowerCase()))
      return { ok: false as const, error: "A file with that name exists." };

    const file: WorkspaceFile = {
      id: nanoid(),
      path: trimmed,
      content: "",
      language,
      isUserFile: true,
      createdAt: Date.now(),
    };
    const next: FilesByProject = {
      ...filesByProject,
      [projectId]: [...existing, file],
    };
    persist(next);
    set({ filesByProject: next });
    return { ok: true as const, file };
  },

  deleteFile: (projectId, fileId) =>
    set((state) => {
      const existing = state.filesByProject[projectId] ?? [];
      const target = existing.find((f) => f.id === fileId);
      if (!target || !target.isUserFile) return state; // Seed is locked.
      const next: FilesByProject = {
        ...state.filesByProject,
        [projectId]: existing.filter((f) => f.id !== fileId),
      };
      persist(next);
      return { filesByProject: next };
    }),

  renameFile: (projectId, fileId, path) => {
    const trimmed = path.trim();
    const { filesByProject } = get();
    const existing = filesByProject[projectId] ?? [];
    const target = existing.find((f) => f.id === fileId);
    if (!target || !target.isUserFile)
      return { ok: false as const, error: "That file cannot be renamed." };
    const detected = languageForPath(trimmed);
    if (!detected)
      return {
        ok: false as const,
        error: "Only .html, .css and .js files are supported.",
      };
    if (detected !== target.language)
      return {
        ok: false as const,
        error: `Keep the ${ALLOWED_EXTENSIONS[target.language]} extension.`,
      };
    if (
      existing.some(
        (f) => f.id !== fileId && f.path.toLowerCase() === trimmed.toLowerCase()
      )
    )
      return { ok: false as const, error: "A file with that name exists." };

    const next: FilesByProject = {
      ...filesByProject,
      [projectId]: existing.map((f) =>
        f.id === fileId ? { ...f, path: trimmed } : f
      ),
    };
    persist(next);
    set({ filesByProject: next });
    return { ok: true as const };
  },

  resetWorkspace: (projectId) =>
    set((state) => {
      const next: FilesByProject = { ...state.filesByProject };
      delete next[projectId];
      persist(next);
      return { filesByProject: next };
    }),
}));
