// Composes a single HTML document from the base (agent-generated) HTML plus any
// user-authored CSS/JS files, so the live preview, "open in new tab" and export
// all reflect manual edits layered on top of the generated page.

const USER_CSS_SENTINEL = "/* screngpt:user-css */";
const USER_JS_SENTINEL = "// screngpt:user-js";

export interface ComposeInputFile {
  path: string;
  content: string;
}

// Injects each CSS file as a <style> before </head> and each JS file as a
// <script> before </body>. Returns the base unchanged when there are no user
// files (fast path — avoids regex work on the hot streaming render loop).
export function composePreviewHtml(
  baseHtml: string,
  cssFiles: ComposeInputFile[],
  jsFiles: ComposeInputFile[]
): string {
  if (cssFiles.length === 0 && jsFiles.length === 0) {
    return baseHtml;
  }

  let output = baseHtml;

  if (cssFiles.length > 0) {
    const styles = cssFiles
      .map(
        (file) =>
          `<style data-path="${file.path}">\n${USER_CSS_SENTINEL}\n${file.content}\n</style>`
      )
      .join("\n");
    output = insertBeforeClose(output, "</head>", styles);
  }

  if (jsFiles.length > 0) {
    const scripts = jsFiles
      .map(
        (file) =>
          `<script data-path="${file.path}">\n${USER_JS_SENTINEL}\n${file.content}\n</script>`
      )
      .join("\n");
    output = insertBeforeClose(output, "</body>", scripts);
  }

  return output;
}

// Inserts `content` immediately before the last occurrence of `closeTag`.
// Falls back to appending at the end of the document when the tag is absent
// (partial/streaming HTML), and re-adds the close tag so structure is kept.
function insertBeforeClose(html: string, closeTag: string, content: string): string {
  const index = html.toLowerCase().lastIndexOf(closeTag);
  if (index === -1) {
    return `${html}\n${content}\n${closeTag}`;
  }
  return `${html.slice(0, index)}${content}\n${html.slice(index)}`;
}
