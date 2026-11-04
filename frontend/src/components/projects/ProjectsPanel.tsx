import { useState } from "react";
import {
  LuCheck,
  LuPlus,
  LuPencil,
  LuCopy,
  LuTrash2,
  LuX,
  LuLayers,
} from "react-icons/lu";
import toast from "react-hot-toast";
import { useProjectsStore, Project } from "../../store/projects-store";

interface Props {
  onBack: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minute = 60_000;
  if (diff < minute) return "just now";
  const hour = 60 * minute;
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  const day = 24 * hour;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function ProjectsPanel({ onBack }: Props) {
  const projects = useProjectsStore((s) => s.projects);
  const activeProjectId = useProjectsStore((s) => s.activeProjectId);
  const setActiveProject = useProjectsStore((s) => s.setActiveProject);
  const createProject = useProjectsStore((s) => s.createProject);
  const renameProject = useProjectsStore((s) => s.renameProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const duplicateProject = useProjectsStore((s) => s.duplicateProject);
  const getVersionCount = useProjectsStore((s) => s.getVersionCount);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handleCreate = () => {
    const project = createProject(newName || `Untitled ${projects.length + 1}`);
    setNewName("");
    setIsAdding(false);
    toast.success(`Created ${project.name}`);
  };

  const startRename = (project: Project) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const commitRename = () => {
    if (renamingId) renameProject(renamingId, renameValue);
    setRenamingId(null);
  };

  const handleDuplicate = (id: string) => {
    const clone = duplicateProject(id);
    if (clone) toast.success(`Duplicated as ${clone.name}`);
  };

  const confirmDelete = (project: Project) => {
    if (projects.length <= 1) {
      toast.error("You need at least one project.");
      return;
    }
    deleteProject(project.id);
    setPendingDelete(null);
    toast.success(`Deleted ${project.name}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-600/90 dark:text-emerald-400/90">
          Projects
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <LuX className="h-3.5 w-3.5" />
          Close
        </button>
      </div>

      {/* New project field */}
      <div className="px-3 pb-2">
        {isAdding ? (
          <div className="flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50/50 p-1.5 dark:border-emerald-500/40 dark:bg-emerald-500/10">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsAdding(false);
              }}
              placeholder="Project name"
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              onClick={handleCreate}
              className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-xs font-semibold text-white"
            >
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
            >
              <LuX className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-300 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50/60 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
          >
            <LuPlus className="h-4 w-4" />
            New project
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 sidebar-scrollbar-stable">
        <ul className="space-y-1.5">
          {projects.map((project, index) => {
            const isActive = project.id === activeProjectId;
            const versions = getVersionCount(project.id);
            return (
              <li key={project.id}>
                <div
                  className="stagger-row group relative rounded-xl border bg-white p-2.5 transition-colors dark:bg-zinc-900/60"
                  style={{ ["--row-index" as string]: index }}
                >
                  <div
                    className={`rounded-xl border ${
                      isActive
                        ? "border-emerald-400/70 ring-1 ring-emerald-400/30 dark:border-emerald-500/60"
                        : "border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div
                      role={renamingId === project.id ? undefined : "button"}
                      tabIndex={0}
                      onClick={() =>
                        renamingId === project.id ? undefined : setActiveProject(project.id)
                      }
                      onKeyDown={(e) => {
                        if (
                          renamingId !== project.id &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          setActiveProject(project.id);
                        }
                      }}
                      className="flex cursor-pointer items-start gap-2.5 px-1.5 py-1"
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-soft ${
                          isActive
                            ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                            : "bg-gradient-to-br from-slate-400 to-slate-500 dark:from-zinc-600 dark:to-zinc-700"
                        }`}
                      >
                        {isActive ? (
                          <LuCheck className="h-4 w-4" />
                        ) : (
                          <LuLayers className="h-4 w-4" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        {renamingId === project.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename();
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            onBlur={commitRename}
                            className="w-full rounded-md border border-emerald-300 bg-white px-1.5 py-0.5 text-sm outline-none dark:border-emerald-500/40 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        ) : (
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-100">
                            {project.name}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">
                          {versions} {versions === 1 ? "version" : "versions"} ·{" "}
                          {relativeTime(project.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Hover actions */}
                    {renamingId !== project.id && (
                      <div className="flex items-center justify-end gap-0.5 px-1.5 pb-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => startRename(project)}
                          title="Rename"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <LuPencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(project.id)}
                          title="Duplicate"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <LuCopy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setPendingDelete(project.id)}
                          title="Delete"
                          className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        >
                          <LuTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline delete confirm */}
                  {pendingDelete === project.id && (
                    <div className="absolute inset-0 z-10 flex items-center justify-between gap-2 rounded-xl bg-white/95 px-3 dark:bg-zinc-900/95">
                      <span className="truncate text-xs text-slate-600 dark:text-zinc-300">
                        Delete &ldquo;{project.name}&rdquo;?
                      </span>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => confirmDelete(project)}
                          className="rounded-md bg-red-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setPendingDelete(null)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 dark:border-zinc-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default ProjectsPanel;
