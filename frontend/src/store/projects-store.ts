import { create } from "zustand";
import { nanoid } from "nanoid";
import { Commit, CommitHash } from "../components/commits/types";
import { Stack } from "../lib/stacks";
import { useProjectStore } from "./project-store";
import { useAppStore } from "./app-store";
import { AppState } from "../types";
import { useWorkspaceStore, WorkspaceFile } from "./workspace-store";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  stack: Stack;
  designSystemId: string | null;
}

interface ProjectSnapshot {
  commits: Record<string, Commit>;
  head: CommitHash | null;
  latestCommitHash: CommitHash | null;
  inputMode: "image" | "video" | "text";
  initialPrompt: string;
  workspaceFiles: WorkspaceFile[];
}

const PROJECTS_KEY = "screngpt-projects";
const ACTIVE_KEY = "screngpt-active-project";
const DATA_PREFIX = "screngpt-project-data:";

// Result of a snapshot write so the UI can show accurate save status.
export type SaveResult = "saved" | "quota" | "none";

interface ProjectsStore {
  projects: Project[];
  activeProjectId: string | null;
  createProject: (name: string) => Project;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  setActiveProject: (id: string) => void;
  updateActiveMeta: (patch: Partial<Pick<Project, "stack" | "designSystemId">>) => void;
  snapshotActive: () => SaveResult;
  touchActive: () => void;
  // Number of saved versions for a project (live for the active project).
  getVersionCount: (id: string) => number;
}

function loadProjects(): Project[] {
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function persistProjects(projects: Project[]) {
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function readActiveId(): string | null {
  return window.localStorage.getItem(ACTIVE_KEY);
}

function writeActiveId(id: string | null) {
  if (id) window.localStorage.setItem(ACTIVE_KEY, id);
  else window.localStorage.removeItem(ACTIVE_KEY);
}

// Commits carry Date instances that JSON.stringify turns into ISO strings;
// revive the ones the app reads as dates so rendering and sorting stay correct.
function reviveCommitDates(commits: Record<string, Commit>): Record<string, Commit> {
  const revived: Record<string, Commit> = {};
  for (const [hash, commit] of Object.entries(commits)) {
    revived[hash] = {
      ...commit,
      dateCreated: new Date(commit.dateCreated as unknown as string),
    };
  }
  return revived;
}

function captureSnapshot(projectId: string): ProjectSnapshot {
  const ps = useProjectStore.getState();
  const ws = useWorkspaceStore.getState();
  return {
    commits: ps.commits,
    head: ps.head,
    latestCommitHash: ps.latestCommitHash,
    inputMode: ps.inputMode,
    initialPrompt: ps.initialPrompt,
    workspaceFiles: ws.filesByProject[projectId] ?? [],
  };
}

function writeSnapshot(projectId: string, snapshot: ProjectSnapshot): boolean {
  try {
    window.localStorage.setItem(
      `${DATA_PREFIX}${projectId}`,
      JSON.stringify(snapshot)
    );
    return true;
  } catch {
    // Quota exceeded (large images): keep the project metadata, skip the body.
    return false;
  }
}

function readSnapshot(projectId: string): ProjectSnapshot | null {
  try {
    const raw = window.localStorage.getItem(`${DATA_PREFIX}${projectId}`);
    return raw ? (JSON.parse(raw) as ProjectSnapshot) : null;
  } catch {
    return null;
  }
}

function clearSnapshot(projectId: string) {
  window.localStorage.removeItem(`${DATA_PREFIX}${projectId}`);
}

function applySnapshotToStores(snapshot: ProjectSnapshot) {
  const ps = useProjectStore.getState();
  const app = useAppStore.getState();

  const commits = reviveCommitDates(snapshot.commits);
  ps.hydrateCommits(commits, snapshot.head, snapshot.latestCommitHash);
  ps.setInputMode(snapshot.inputMode);
  ps.setInitialPrompt(snapshot.initialPrompt);
  ps.resetPromptAssets();
  ps.resetExecutionConsoles();

  app.setUpdateInstruction("");
  app.setUpdateImages([]);
  app.disableInSelectAndEditMode();
  app.setAppState(
    Object.keys(commits).length > 0 && snapshot.head ? AppState.CODE_READY : AppState.INITIAL
  );
}

export const useProjectsStore = create<ProjectsStore>((set, get) => {
  // Bootstrap: reuse stored list or seed a first "Untitled project".
  let projects = loadProjects();
  let activeProjectId = readActiveId();
  if (projects.length === 0) {
    const first: Project = {
      id: nanoid(),
      name: "Untitled project",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stack: Stack.HTML_TAILWIND,
      designSystemId: null,
    };
    projects = [first];
    activeProjectId = first.id;
    persistProjects(projects);
    writeActiveId(activeProjectId);
  } else if (!activeProjectId || !projects.some((p) => p.id === activeProjectId)) {
    activeProjectId = projects[0].id;
    writeActiveId(activeProjectId);
  }

  return {
    projects,
    activeProjectId,

    createProject: (name) => {
      const trimmed = name.trim() || "Untitled project";
      const project: Project = {
        id: nanoid(),
        name: trimmed,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stack: Stack.HTML_TAILWIND,
        designSystemId: null,
      };
      // Persist the outgoing project's work before switching away.
      const currentActive = get().activeProjectId;
      if (currentActive) {
        writeSnapshot(currentActive, captureSnapshot(currentActive));
      }
      const nextProjects = [project, ...get().projects];
      persistProjects(nextProjects);
      set({ projects: nextProjects, activeProjectId: project.id });
      writeActiveId(project.id);

      // Reset the working stores to a clean slate for the new project.
      const ps = useProjectStore.getState();
      const app = useAppStore.getState();
      ps.resetCommits();
      ps.resetHead();
      ps.resetPromptAssets();
      ps.resetExecutionConsoles();
      ps.setInputMode("image");
      ps.setInitialPrompt("");
      app.setAppState(AppState.INITIAL);
      app.setUpdateInstruction("");
      app.setUpdateImages([]);
      app.disableInSelectAndEditMode();
      return project;
    },

    renameProject: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const nextProjects = get().projects.map((p) =>
        p.id === id ? { ...p, name: trimmed, updatedAt: Date.now() } : p
      );
      persistProjects(nextProjects);
      set({ projects: nextProjects });
    },

    deleteProject: (id) => {
      const { projects, activeProjectId } = get();
      if (projects.length <= 1) return; // Always keep at least one project.
      const remaining = projects.filter((p) => p.id !== id);
      clearSnapshot(id);
      useWorkspaceStore.getState().resetWorkspace(id);
      persistProjects(remaining);
      set({ projects: remaining });

      if (activeProjectId === id) {
        const fallback = remaining[0];
        set({ activeProjectId: fallback.id });
        writeActiveId(fallback.id);
        const snapshot = readSnapshot(fallback.id);
        if (snapshot) applySnapshotToStores(snapshot);
      }
    },

    duplicateProject: (id) => {
      const source = get().projects.find((p) => p.id === id);
      if (!source) return null;
      const clone: Project = {
        ...source,
        id: nanoid(),
        name: `${source.name} (copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const snapshot = readSnapshot(id);
      if (snapshot) {
        writeSnapshot(clone.id, { ...snapshot });
      }
      const nextProjects = [clone, ...get().projects];
      persistProjects(nextProjects);
      set({ projects: nextProjects });
      return clone;
    },

    setActiveProject: (id) => {
      const { activeProjectId } = get();
      if (id === activeProjectId) return;
      // Save current before leaving.
      if (activeProjectId) {
        writeSnapshot(activeProjectId, captureSnapshot(activeProjectId));
      }
      set({ activeProjectId: id });
      writeActiveId(id);
      const snapshot = readSnapshot(id);
      if (snapshot) {
        applySnapshotToStores(snapshot);
        useWorkspaceStore.getState().ensureSeed(id, seedHtmlFromSnapshot(snapshot));
      } else {
        // Empty project: clear the working session.
        const ps = useProjectStore.getState();
        const app = useAppStore.getState();
        ps.resetCommits();
        ps.resetHead();
        ps.setInputMode("image");
        ps.setInitialPrompt("");
        app.setAppState(AppState.INITIAL);
      }
    },

    updateActiveMeta: (patch) => {
      const { activeProjectId } = get();
      if (!activeProjectId) return;
      const nextProjects = get().projects.map((p) =>
        p.id === activeProjectId ? { ...p, ...patch } : p
      );
      persistProjects(nextProjects);
      set({ projects: nextProjects });
    },

    touchActive: () => {
      const { activeProjectId } = get();
      if (!activeProjectId) return;
      const nextProjects = get().projects.map((p) =>
        p.id === activeProjectId ? { ...p, updatedAt: Date.now() } : p
      );
      persistProjects(nextProjects);
      set({ projects: nextProjects });
    },

    snapshotActive: () => {
      const { activeProjectId } = get();
      if (!activeProjectId) return "none";
      const snapshot = captureSnapshot(activeProjectId);
      // Mirror the current head code into the workspace seed so the editor's
      // index.html and the persisted snapshot stay in sync with the latest run.
      const headCode = seedHtmlFromSnapshot(snapshot);
      if (headCode) {
        useWorkspaceStore.getState().setSeedHtml(activeProjectId, headCode);
      }
      const ok = writeSnapshot(activeProjectId, snapshot);
      get().touchActive();
      return ok ? "saved" : "quota";
    },

    getVersionCount: (id) => {
      if (id === get().activeProjectId) {
        return Object.keys(useProjectStore.getState().commits).length;
      }
      const snapshot = readSnapshot(id);
      return snapshot ? Object.keys(snapshot.commits).length : 0;
    },
  };
});

// The workspace seed html comes from the head commit's selected variant code.
function seedHtmlFromSnapshot(snapshot: ProjectSnapshot): string {
  if (!snapshot.head) return "";
  const commit = snapshot.commits[snapshot.head];
  if (!commit) return "";
  return commit.variants[commit.selectedVariantIndex]?.code ?? "";
}
