import {
  LuClock,
  LuCode,
  LuSettings,
  LuPlus,
  LuLogOut,
  LuMessageSquare,
  LuFolderTree,
  LuPalette,
  LuSun,
  LuMoon,
  LuPanelLeftClose,
  LuPanelLeftOpen,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Logo from "../core/Logo";
import { useAuth } from "../../store/auth-context";

// Single source of truth for which left-panel / main-area view is active.
export type PanelId =
  | "chat"
  | "versions"
  | "design"
  | "editor"
  | "projects"
  | "settings";

interface IconStripProps {
  activePanel: PanelId;
  showVersions: boolean;
  showEditor: boolean;
  canEdit: boolean;
  isDark: boolean;
  expanded: boolean;
  onSelectPanel: (panel: PanelId) => void;
  onLogoClick: () => void;
  onNewProject: () => void;
  onToggleTheme: () => void;
  onToggleExpanded: () => void;
}

interface NavItem {
  id: PanelId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  // Accent used for the active pill: text + rail gradient.
  text: string;
  rail: string;
  tint: string;
  tooltip: string;
}

function IconStrip({
  activePanel,
  showVersions,
  showEditor,
  canEdit,
  isDark,
  expanded,
  onSelectPanel,
  onLogoClick,
  onNewProject,
  onToggleTheme,
  onToggleExpanded,
}: IconStripProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // Ignore backend failures; we still clear the client session below.
    }
    toast.success("Signed out");
    navigate("/login");
  };

  // Row geometry: collapsed = stacked icon + tiny label; expanded = full row.
  const rowCls = expanded
    ? "lg:w-full lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3.5 lg:py-2"
    : "lg:flex-col lg:gap-1 lg:px-2 lg:py-1.5";
  const labelCls = expanded
    ? "hidden text-xs font-medium leading-none lg:block"
    : "hidden text-[10px] leading-none lg:block";

  const navItems: NavItem[] = [
    {
      id: "chat",
      label: "Chat",
      Icon: LuMessageSquare,
      text: "text-indigo-600 dark:text-indigo-300",
      rail: "from-indigo-500 to-indigo-400",
      tint: "bg-indigo-50 dark:bg-indigo-500/15",
      tooltip: "Chat",
    },
    {
      id: "versions",
      label: "Versions",
      Icon: LuClock,
      text: "text-violet-600 dark:text-violet-300",
      rail: "from-violet-500 to-purple-400",
      tint: "bg-violet-50 dark:bg-violet-500/15",
      tooltip: "Versions",
    },
    {
      id: "design",
      label: "Design",
      Icon: LuPalette,
      text: "text-fuchsia-600 dark:text-fuchsia-300",
      rail: "from-fuchsia-500 to-pink-400",
      tint: "bg-fuchsia-50 dark:bg-fuchsia-500/15",
      tooltip: "Custom prompt & design system",
    },
    {
      id: "editor",
      label: "Editor",
      Icon: LuCode,
      text: "text-sky-600 dark:text-sky-300",
      rail: "from-sky-500 to-cyan-400",
      tint: "bg-sky-50 dark:bg-sky-500/15",
      tooltip: "Editor",
    },
    {
      id: "projects",
      label: "Projects",
      Icon: LuFolderTree,
      text: "text-emerald-600 dark:text-emerald-300",
      rail: "from-emerald-500 to-teal-400",
      tint: "bg-emerald-50 dark:bg-emerald-500/15",
      tooltip: "Projects",
    },
    {
      id: "settings",
      label: "Settings",
      Icon: LuSettings,
      text: "text-slate-600 dark:text-slate-300",
      rail: "from-slate-500 to-slate-400",
      tint: "bg-slate-100 dark:bg-slate-500/15",
      tooltip: "Settings",
    },
  ];

  const renderNavItem = (item: NavItem) => {
    const disabled =
      (item.id === "versions" && !showVersions) ||
      (item.id === "editor" && !showEditor) ||
      (item.id === "editor" && !canEdit);
    const isActive = activePanel === item.id;
    const { Icon } = item;

    if (disabled) {
      return (
        <button
          key={item.id}
          type="button"
          disabled
          title={item.tooltip}
          className={`flex cursor-not-allowed items-center justify-center rounded-lg p-2 text-gray-300 opacity-50 dark:text-zinc-700 ${rowCls}`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          <span className={labelCls}>{item.label}</span>
        </button>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectPanel(item.id)}
        title={item.tooltip}
        className={`relative flex items-center justify-center rounded-lg p-2 transition-all ${rowCls} ${
          isActive
            ? `${item.tint} ${item.text}`
            : "text-gray-400 hover:bg-gray-200/60 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-zinc-800/70 dark:hover:text-gray-300"
        }`}
      >
        {/* Left accent rail on the active pill */}
        <span
          className={`absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-gradient-to-b transition-opacity ${
            isActive ? `opacity-100 ${item.rail}` : "opacity-0"
          }`}
        />
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className={labelCls}>{item.label}</span>
      </button>
    );
  };

  // Section captions only make sense in the expanded sidebar.
  const sectionLabel = (text: string) => (
    <div className="hidden w-full px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 lg:block">
      {text}
    </div>
  );

  const separator = (
    <div
      className={`my-1 hidden h-px self-center bg-gray-200 dark:bg-zinc-800 lg:block ${
        expanded ? "w-[calc(100%-1.75rem)] mx-3.5" : "w-8"
      }`}
    />
  );

  const primary = navItems.filter(
    (i) =>
      i.id === "chat" ||
      i.id === "versions" ||
      i.id === "design" ||
      i.id === "editor"
  );
  const secondary = navItems.filter((i) => i.id === "projects");
  const settingsItem = navItems.find((i) => i.id === "settings")!;

  return (
    <div className="flex w-full items-center justify-between border-b border-gray-200 bg-gray-50 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900 lg:h-full lg:flex-col lg:items-stretch lg:gap-y-1 lg:border-b-0 lg:border-r lg:px-2 lg:py-4">
      {/* Logo + expand / collapse toggle */}
      <div
        className={`flex items-center gap-1 ${
          expanded ? "lg:w-full lg:justify-between" : "lg:flex-col lg:justify-center lg:mb-2"
        }`}
      >
        <button
          onClick={onLogoClick}
          className={`rounded-lg transition-colors hover:bg-gray-200/70 dark:hover:bg-zinc-800 ${
            expanded ? "lg:flex lg:items-center lg:gap-2 lg:px-2 lg:py-1.5" : "lg:p-1"
          }`}
          title="ScreGPT home"
        >
          <Logo showWordmark={false} size="sm" />
          {expanded && (
            <span className="hidden text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100 lg:block">
              Scre<span className="text-indigo-500">GPT</span>
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onToggleExpanded}
          title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 lg:flex"
        >
          {expanded ? (
            <LuPanelLeftClose className="h-[18px] w-[18px]" />
          ) : (
            <LuPanelLeftOpen className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-1 lg:flex-col lg:gap-1 lg:contents">
        {expanded && sectionLabel("Workspace")}
        {primary.map(renderNavItem)}

        <button
          onClick={onNewProject}
          className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 p-2 text-white shadow-soft transition-all hover:from-indigo-600 hover:to-violet-600 ${rowCls}`}
          title="Start a new project"
        >
          <LuPlus className="h-[18px] w-[18px] shrink-0" />
          <span className={`${labelCls} font-medium`}>
            {expanded ? "New project" : "New"}
          </span>
        </button>

        {expanded && sectionLabel("Library")}
        {separator}
        {secondary.map(renderNavItem)}
      </div>

      {/* Spacer pushes account section to bottom */}
      <div className="hidden flex-1 lg:block" />

      {/* Light / dark mode toggle */}
      <button
        type="button"
        onClick={onToggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`flex items-center justify-center rounded-lg p-2 transition-all hover:bg-gray-200/70 dark:hover:bg-zinc-800 ${rowCls} ${
          isDark
            ? "text-amber-400 hover:text-amber-300"
            : "text-slate-500 hover:text-indigo-600 dark:text-slate-400"
        }`}
      >
        <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
          {isDark ? (
            <LuSun className="h-[18px] w-[18px] pop-in" />
          ) : (
            <LuMoon className="h-[18px] w-[18px] pop-in" />
          )}
        </span>
        <span className={labelCls}>{isDark ? "Light mode" : "Dark mode"}</span>
      </button>

      {expanded && sectionLabel("Account")}
      {separator}
      {renderNavItem(settingsItem)}

      {/* User chip + sign-out */}
      <div
        className={`flex items-center gap-1 ${
          expanded ? "lg:w-full lg:flex-col lg:items-stretch lg:gap-1" : "lg:flex-col lg:gap-2"
        }`}
      >
        {user &&
          (expanded ? (
            <div
              title={user.email}
              className="hidden lg:flex lg:w-full lg:items-center lg:gap-2.5 lg:px-3.5 lg:py-1.5"
            >
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-[11px] font-semibold uppercase text-white shadow-soft ring-1 ring-white/40">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-70"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 60%)",
                  }}
                />
                <span className="relative">
                  {(user.name || user.email).slice(0, 1)}
                </span>
              </div>
              <span className="min-w-0 flex-1 truncate text-left text-xs font-medium text-gray-600 dark:text-zinc-300">
                {user.name || user.email}
              </span>
            </div>
          ) : (
            <div
              title={user.email}
              className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-[11px] font-semibold uppercase text-white shadow-soft ring-1 ring-white/40"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), transparent 60%)",
                }}
              />
              <span className="relative">
                {(user.name || user.email).slice(0, 1)}
              </span>
            </div>
          ))}
        <button
          onClick={handleSignOut}
          className={`flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-zinc-800 dark:hover:text-gray-300 ${rowCls}`}
          title="Sign out"
        >
          <LuLogOut className="h-[18px] w-[18px] shrink-0" />
          <span className={labelCls}>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export default IconStrip;
