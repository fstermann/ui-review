import { describe, expect, it } from "vitest";
import { injectReviewClient } from "./inject.js";

describe("injectReviewClient", () => {
  it("injects the browser module before the closing body", () => {
    const output = injectReviewClient("<!doctype html><body><main>Hello</main></body>", {
      appId: "dashboard",
      includeHash: false,
    });

    expect(output).toBe(
      '<!doctype html><body><main>Hello</main><script type="module" src="/__ui_review/browser.js" data-ui-review-app="dashboard" data-ui-review-include-hash="false"></script></body>',
    );
  });

  it("escapes the application identity", () => {
    const output = injectReviewClient("<body></body>", {
      appId: 'team & "site"',
      includeHash: true,
      nonce: 'safe&"nonce',
    });

    expect(output).toContain('data-ui-review-app="team &amp; &quot;site&quot;"');
    expect(output).toContain('data-ui-review-include-hash="true"');
    expect(output).toContain('nonce="safe&amp;&quot;nonce"');
  });

  it("does not inject the browser module twice", () => {
    const once = injectReviewClient("<html></html>", { appId: "first", includeHash: false });

    expect(injectReviewClient(once, { appId: "second", includeHash: false })).toBe(once);
  });

  it("prefixes the script src and records the base path when hosted under a sub-path", () => {
    const output = injectReviewClient("<body></body>", {
      appId: "dashboard",
      basePath: "/codeeditor/default/ports/4317",
      includeHash: false,
    });

    expect(output).toContain('src="/codeeditor/default/ports/4317/__ui_review/browser.js"');
    expect(output).toContain('data-ui-review-base-path="/codeeditor/default/ports/4317"');
  });

  it("omits the base-path attribute at the origin root", () => {
    const output = injectReviewClient("<body></body>", { appId: "dashboard", basePath: "", includeHash: false });

    expect(output).toContain('src="/__ui_review/browser.js"');
    expect(output).not.toContain("data-ui-review-base-path");
  });
});
