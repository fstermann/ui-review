export type ReviewClientInjection = {
  readonly appId: string;
  readonly basePath?: string;
  readonly includeHash: boolean;
  readonly nonce?: string;
};

/** Inject the isolated browser client into an HTML document once. */
export function injectReviewClient(html: string, injection: ReviewClientInjection): string {
  if (html.includes("/__ui_review/browser.js")) {
    return html;
  }

  const basePath = injection.basePath ?? "";
  const nonceAttribute = injection.nonce === undefined ? "" : ` nonce="${escapeAttribute(injection.nonce)}"`;
  // Carry the base path in a data attribute so the browser client can prefix its own API/asset
  // URLs to match the reverse-proxy sub-path (omitted when serving at the origin root).
  const basePathAttribute = basePath === "" ? "" : ` data-ui-review-base-path="${escapeAttribute(basePath)}"`;
  const browserScript = `<script type="module" src="${basePath}/__ui_review/browser.js" data-ui-review-app="${escapeAttribute(injection.appId)}" data-ui-review-include-hash="${String(injection.includeHash)}"${basePathAttribute}${nonceAttribute}></script>`;
  const bodyClose = html.toLowerCase().lastIndexOf("</body>");
  if (bodyClose >= 0) {
    return `${html.slice(0, bodyClose)}${browserScript}${html.slice(bodyClose)}`;
  }

  return `${html}${browserScript}`;
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
