import React, { useEffect, useState } from "react";
import { BsCheckCircleFill, BsExclamationTriangleFill } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import {
  LuPalette,
  LuKey,
  LuImage,
  LuCamera,
  LuLink,
  LuHome,
  LuInfo,
  LuMail,
  LuGithub,
  LuUser,
  LuLogOut,
  LuShieldCheck,
  LuPlus,
  LuX,
} from "react-icons/lu";
import { AppTheme, EditorTheme, Settings } from "../../types";
import { capitalize } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { HTTP_BACKEND_URL, IS_RUNNING_ON_CLOUD } from "../../config";
import { REPO_URL } from "../marketing/MarketingLayout";
import { useAuth } from "../../store/auth-context";

interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}

// Consistent icon + title header shared by every settings card.
function SectionHeader({ icon: Icon, title, hint }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3 dark:border-zinc-700">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {hint && (
          <p className="text-[11px] text-gray-500 dark:text-zinc-400">{hint}</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  appTheme: AppTheme;
  setAppTheme: React.Dispatch<React.SetStateAction<AppTheme>>;
}

function SettingsTab({ settings, setSettings, appTheme, setAppTheme }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // Ignore backend failures; the client session is cleared regardless.
    }
    navigate("/login");
  };

  // null = not yet known (loading / unreachable); otherwise the backend's answer.
  const [screenshotPreviewAvailable, setScreenshotPreviewAvailable] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${HTTP_BACKEND_URL}/api/capabilities`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.screenshot_preview === "boolean") {
          setScreenshotPreviewAvailable(data.screenshot_preview);
        }
      })
      .catch(() => {
        /* leave as null — don't show a false alarm if the backend is unreachable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleThemeChange = (theme: EditorTheme) => {
    setSettings((s) => ({
      ...s,
      editorTheme: theme,
    }));
  };

  // Gemini keys are rotated across concurrent variants; the legacy single-key
  // field always mirrors the first entry so old call sites keep working.
  const geminiKeys = settings.geminiApiKeys ?? [];
  const commitGeminiKeys = (keys: string[]) => {
    setSettings((s) => ({
      ...s,
      geminiApiKeys: keys,
      geminiApiKey: keys[0] ?? null,
    }));
  };

  const handleGeminiKeyChange = (index: number, value: string) => {
    commitGeminiKeys(geminiKeys.map((key, i) => (i === index ? value : key)));
  };

  const addGeminiKey = () => {
    commitGeminiKeys([...geminiKeys, ""]);
  };

  const removeGeminiKey = (index: number) => {
    commitGeminiKeys(geminiKeys.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-4 lg:px-6 lg:py-6">
        {/* Header */}
        <div className="rise-in mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-soft">
            <LuPalette className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Tune appearance, connect API keys and manage capabilities.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-6">
          {/* Profile */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "80ms" }}
          >
            <SectionHeader
              icon={LuUser}
              title="Profile"
              hint="Your account & session"
            />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-xl font-semibold uppercase text-white shadow-soft">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 opacity-70"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 60%)",
                    }}
                  />
                  <span className="relative">
                    {(user?.name || user?.email || "U").slice(0, 1)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name || "Anonymous user"}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-zinc-400">
                    {user?.email || "Not signed in"}
                  </p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <LuShieldCheck className="h-3 w-3" /> Signed in
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-rose-700/60 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              >
                <LuLogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>

          {/* Theme */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "160ms" }}
          >
            <SectionHeader icon={LuPalette} title="Theme" />
            <div className="divide-y divide-gray-100 dark:divide-zinc-700">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm text-gray-700 dark:text-zinc-300">
                    App Theme
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                    System default, with optional light/dark override
                  </p>
                </div>
                <Select
                  name="app-theme"
                  value={appTheme}
                  onValueChange={(value) => setAppTheme(value as AppTheme)}
                >
                  <SelectTrigger className="w-[140px]">
                    {capitalize(appTheme)}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppTheme.SYSTEM}>System</SelectItem>
                    <SelectItem value={AppTheme.LIGHT}>Light</SelectItem>
                    <SelectItem value={AppTheme.DARK}>Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm text-gray-700 dark:text-zinc-300">
                    Code Editor Theme
                  </span>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                    Requires page refresh to update
                  </p>
                </div>
                <Select
                  name="editor-theme"
                  value={settings.editorTheme}
                  onValueChange={(value) =>
                    handleThemeChange(value as EditorTheme)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <span className="notranslate" translate="no">
                      {capitalize(settings.editorTheme)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cobalt">
                      <span className="notranslate" translate="no">Cobalt</span>
                    </SelectItem>
                    <SelectItem value="espresso">
                      <span className="notranslate" translate="no">Espresso</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "240ms" }}
          >
            <SectionHeader icon={LuKey} title="API Keys" hint="Stored only in your browser" />
            <div className="space-y-4 p-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  OpenAI API key
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  Only stored in your browser. Never stored on servers. Overrides
                  your .env config.
                </p>
                <Input
                  id="openai-api-key"
                  className="mt-2"
                  placeholder="OpenAI API key"
                  value={settings.openAiApiKey || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      openAiApiKey: e.target.value,
                    }))
                  }
                />
              </div>

              {!IS_RUNNING_ON_CLOUD && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    OpenAI Base URL (optional)
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    Replace with a proxy URL if you don't want to use the
                    default.
                  </p>
                  <Input
                    id="openai-base-url"
                    className="mt-2"
                    placeholder="OpenAI Base URL"
                    value={settings.openAiBaseURL || ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        openAiBaseURL: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Anthropic API key
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  Only stored in your browser. Never stored on servers. Overrides
                  your .env config.
                </p>
                <Input
                  id="anthropic-api-key"
                  className="mt-2"
                  placeholder="Anthropic API key"
                  value={settings.anthropicApiKey || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      anthropicApiKey: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Gemini API keys
                  {geminiKeys.filter((key) => key.trim()).length > 1 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                      {geminiKeys.filter((key) => key.trim()).length} keys
                      rotation
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                  Only stored in your browser. Never stored on servers. Overrides
                  your .env config. Add multiple keys and they are rotated across
                  concurrent variants.
                </p>
                <div className="mt-2 space-y-2">
                  {geminiKeys.length === 0 && (
                    <Input
                      id="gemini-api-key"
                      placeholder="Gemini API key"
                      value=""
                      onChange={(e) => commitGeminiKeys([e.target.value])}
                    />
                  )}
                  {geminiKeys.map((key, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        id={index === 0 ? "gemini-api-key" : `gemini-api-key-${index + 1}`}
                        placeholder={`Gemini API key ${index + 1}`}
                        value={key}
                        onChange={(e) => handleGeminiKeyChange(index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeGeminiKey(index)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        aria-label={`Remove Gemini API key ${index + 1}`}
                        title={`Remove key ${index + 1}`}
                      >
                        <LuX className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addGeminiKey}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
                  >
                    <LuPlus className="h-3.5 w-3.5" />
                    Add key
                  </button>
                </div>
              </div>

              {!IS_RUNNING_ON_CLOUD && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Replicate API key
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    Only stored in your browser. Never stored on servers. Overrides
                    your .env config for image generation and editing.
                  </p>
                  <Input
                    id="replicate-api-key"
                    className="mt-2"
                    placeholder="Replicate API key"
                    value={settings.replicateApiKey || ""}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        replicateApiKey: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Image Generation */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "320ms" }}
          >
            <SectionHeader icon={LuImage} title="Image Generation" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">
                    Placeholder Images
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                    More fun with it but if you want to save money, turn it off.
                  </p>
                </div>
                <Switch
                  id="image-generation"
                  checked={settings.isImageGenerationEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({
                      ...s,
                      isImageGenerationEnabled: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Screenshot Preview (agent self-verification) */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "400ms" }}
          >
            <SectionHeader icon={LuCamera} title="Screenshot Preview" />
            <div className="p-4">
              {screenshotPreviewAvailable === false ? (
                <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700/60 dark:bg-amber-900/20">
                  <BsExclamationTriangleFill className="mt-0.5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Screenshot preview is unavailable
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Headless Chromium isn't installed on the backend, so the
                      agent can't render and visually verify its own output.
                      Install it with{" "}
                      <code className="rounded bg-amber-100 px-1 py-0.5 font-mono dark:bg-amber-900/40">
                        playwright install chromium
                      </code>{" "}
                      and restart the backend.
                    </p>
                  </div>
                </div>
              ) : screenshotPreviewAvailable === true ? (
                <div className="flex items-start gap-2.5">
                  <BsCheckCircleFill className="mt-0.5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-zinc-300">
                      Available
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                      The agent renders your generated page in a headless browser
                      to visually check its work and fix layout issues.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Checking backend capabilities…
                </p>
              )}
            </div>
          </div>

          {/* Screenshot by URL */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "480ms" }}
          >
            <SectionHeader icon={LuLink} title="Screenshot by URL" />
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                If you want to use URLs directly instead of taking the screenshot
                yourself, add a ScreenshotOne API key.{" "}
                <a
                  href="https://screenshotone.com?via=screngpt"
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  target="_blank"
                >
                  Get 100 screenshots/mo for free.
                </a>
              </p>
              <Input
                id="screenshot-one-api-key"
                className="mt-3"
                placeholder="ScreenshotOne API key"
                value={settings.screenshotOneApiKey || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    screenshotOneApiKey: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Resources & about */}
          <div
            className="rise-in rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ animationDelay: "560ms" }}
          >
            <SectionHeader
              icon={LuInfo}
              title="Resources"
              hint="Explore the public site and get in touch"
            />
            <div className="p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/10"
                >
                  <LuHome className="h-4 w-4 text-indigo-500" /> Home
                </Link>
                <Link
                  to="/about"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/10"
                >
                  <LuInfo className="h-4 w-4 text-indigo-500" /> About
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/10"
                >
                  <LuMail className="h-4 w-4 text-indigo-500" /> Contact
                </Link>
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-indigo-600 dark:hover:bg-indigo-500/10"
                >
                  <LuGithub className="h-4 w-4 text-indigo-500" /> GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
