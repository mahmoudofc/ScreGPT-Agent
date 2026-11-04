import { useRef, useEffect, useMemo } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  ViewUpdate,
} from "@codemirror/view";
import { espresso, cobalt } from "thememirror";
import {
  defaultKeymap,
  history,
  indentWithTab,
  redo,
  undo,
} from "@codemirror/commands";
import {
  bracketMatching,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  acceptCompletion,
} from "@codemirror/autocomplete";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { EditorTheme } from "@/types";

export type CodeLanguage = "html" | "css" | "js";

export interface CursorPosition {
  line: number;
  col: number;
  selected: number;
}

interface Props {
  code: string;
  editorTheme: EditorTheme;
  onCodeChange: (code: string) => void;
  language?: CodeLanguage;
  // Report selection/cursor changes (used by the editor status bar).
  onCursor?: (pos: CursorPosition) => void;
  // Fired for Ctrl/Cmd+S pressed while the editor has focus.
  onSaveKey?: () => void;
  // Fill the parent height (scroller inside the editor) instead of growing.
  fullHeight?: boolean;
  // Override the wrapper classes (e.g. inside the editor pane).
  className?: string;
}

function languageExtension(language: CodeLanguage) {
  switch (language) {
    case "css":
      return css();
    case "js":
      return javascript();
    case "html":
    default:
      return html();
  }
}

// Two-space indentation everywhere — matches generated web code.
const twoSpace = indentUnit.of("  ");

const editorFont = EditorView.theme({
  "&": { fontSize: "13px" },
  ".cm-content": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  ".cm-gutters": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
});

const fullHeightTheme = EditorView.theme({
  "&": { height: "100%" },
  ".cm-scroller": { overflow: "auto" },
});

function CodeMirror({
  code,
  editorTheme,
  onCodeChange,
  language = "html",
  onCursor,
  onSaveKey,
  fullHeight = false,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  // Keep the latest callbacks in refs so the memoized EditorState does not
  // depend on them (avoids recreating the editor on every render).
  const onCodeChangeRef = useRef(onCodeChange);
  const onCursorRef = useRef(onCursor);
  const onSaveKeyRef = useRef(onSaveKey);
  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);
  useEffect(() => {
    onCursorRef.current = onCursor;
  }, [onCursor]);
  useEffect(() => {
    onSaveKeyRef.current = onSaveKey;
  }, [onSaveKey]);

  const editorState = useMemo(
    () =>
      EditorState.create({
        doc: code,
        extensions: [
          history(),
          keymap.of([
            { key: "Mod-s", run: () => onSaveKeyRef.current?.() ?? false },
            { key: "Tab", run: acceptCompletion },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...completionKeymap,
            indentWithTab,
            { key: "Mod-z", run: undo, preventDefault: true },
            { key: "Mod-Shift-z", run: redo, preventDefault: true },
          ]),
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          bracketMatching(),
          closeBrackets(),
          autocompletion(),
          indentOnInput(),
          twoSpace,
          highlightSelectionMatches(),
          // Fallback highlighting for tokens the language packages miss.
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          languageExtension(language),
          editorTheme === EditorTheme.ESPRESSO ? espresso : cobalt,
          editorFont,
          EditorView.lineWrapping,
          ...(fullHeight ? [fullHeightTheme] : []),
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) {
              onCodeChangeRef.current(update.state.doc.toString());
            }
            if (
              (update.selectionSet || update.docChanged) &&
              onCursorRef.current
            ) {
              const { state } = update;
              const range = state.selection.main;
              const line = state.doc.lineAt(range.head);
              onCursorRef.current({
                line: line.number,
                col: range.head - line.from + 1,
                selected: Math.abs(range.to - range.from),
              });
            }
          }),
        ],
      }),
    // Recreate the state when the language or theme changes; `code` is only the
    // initial document and is synced separately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorTheme, language, fullHeight]
  );

  useEffect(() => {
    view.current = new EditorView({
      state: editorState,
      parent: ref.current as Element,
    });

    return () => {
      if (view.current) {
        view.current.destroy();
        view.current = null;
      }
    };
  }, [editorState]);

  useEffect(() => {
    if (view.current && view.current.state.doc.toString() !== code) {
      view.current.dispatch({
        changes: { from: 0, to: view.current.state.doc.length, insert: code },
      });
    }
  }, [code]);

  return (
    <div
      className={
        className ??
        "overflow-x-scroll overflow-y-scroll mx-2 border-[4px] border-black rounded-[20px]"
      }
      ref={ref}
    />
  );
}

export default CodeMirror;
