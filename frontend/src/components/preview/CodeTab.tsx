import { FaCopy } from "react-icons/fa";
import CodeMirror from "./CodeMirror";
import { Button } from "../ui/button";
import { Settings } from "../../types";
import copy from "copy-to-clipboard";
import { useCallback } from "react";
import toast from "react-hot-toast";

interface Props {
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  settings: Settings;
}

function CodeTab({ code, setCode, settings }: Props) {
  const copyCode = useCallback(() => {
    copy(code);
    toast.success("Copied to clipboard");
  }, [code]);

  const doOpenInCodepenio = useCallback(async () => {
    // TODO: Update CSS and JS external links depending on the framework being used
    const data = {
      html: code,
      editors: "100", // 1: Open HTML, 0: Close CSS, 0: Close JS
      layout: "left",
      css_external:
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" +
        (code.includes("<ion-")
          ? ",https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css"
          : ""),
      js_external:
        "https://cdn.tailwindcss.com " +
        (code.includes("<ion-")
          ? ",https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js,https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js"
          : ""),
    };

    // Create a hidden form and submit it to open the code in CodePen
    // Can't use fetch API directly because we want to open the URL in a new tab
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", "data");
    input.setAttribute("value", JSON.stringify(data));

    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", "https://codepen.io/pen/define");
    form.setAttribute("target", "_blank");
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  }, [code]);

  return (
    <div className="relative">
      <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 border-b border-slate-200/70 bg-white/85 px-4 py-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
        <button
          type="button"
          title="Copy Code"
          onClick={copyCode}
          data-testid="copy-code"
          className="pop-in inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-medium text-white shadow-card transition-all hover:from-indigo-500 hover:to-violet-500 hover:brightness-110 active:scale-[0.97]"
        >
          <FaCopy className="text-xs" />
          Copy Code
        </button>
        <Button
          onClick={doOpenInCodepenio}
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:border-indigo-200 hover:text-indigo-700 hover:shadow-soft active:scale-[0.97] dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300"
          data-testid="open-codepen"
        >
          Open in
          <img
            src="https://assets.codepen.io/t-1/codepen-logo.svg"
            alt="codepen.io"
            className="h-4"
          />
        </Button>
      </div>
      <CodeMirror
        code={code}
        editorTheme={settings.editorTheme}
        onCodeChange={setCode}
      />
    </div>
  );
}

export default CodeTab;
