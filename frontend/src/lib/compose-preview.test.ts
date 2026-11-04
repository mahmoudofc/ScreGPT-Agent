import { composePreviewHtml } from "./compose-preview";

describe("composePreviewHtml", () => {
  const base = "<html><head><title>t</title></head><body><p>hi</p></body></html>";

  it("returns the base unchanged when there are no user files", () => {
    expect(composePreviewHtml(base, [], [])).toBe(base);
  });

  it("injects css as <style> before </head> and js as <script> before </body>", () => {
    const out = composePreviewHtml(
      base,
      [{ path: "style.css", content: "body{color:red}" }],
      [{ path: "app.js", content: "console.log(1)" }]
    );

    const styleIdx = out.indexOf("<style");
    const headCloseIdx = out.indexOf("</head>");
    const scriptIdx = out.indexOf("<script");
    const bodyCloseIdx = out.indexOf("</body>");

    expect(styleIdx).toBeGreaterThan(-1);
    expect(styleIdx).toBeLessThan(headCloseIdx);
    expect(scriptIdx).toBeGreaterThan(-1);
    expect(scriptIdx).toBeLessThan(bodyCloseIdx);
    expect(out).toContain("body{color:red}");
    expect(out).toContain("console.log(1)");
  });

  it("preserves css/js injection order across multiple files", () => {
    const out = composePreviewHtml(
      base,
      [
        { path: "a.css", content: "a{}" },
        { path: "b.css", content: "b{}" },
      ],
      []
    );
    expect(out.indexOf("a{}")).toBeLessThan(out.indexOf("b{}"));
  });

  it("appends and re-adds the close tag when the base lacks </head>", () => {
    const partial = "<html><body><p>hi</p></body></html>";
    const out = composePreviewHtml(partial, [{ path: "s.css", content: "x{}" }], []);
    // No </head> existed, so the style block plus a </head> are appended.
    expect(out).toContain("<style");
    expect(out).toContain("</head>");
  });
});
