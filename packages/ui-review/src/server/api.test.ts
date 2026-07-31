import { describe, expect, it } from "vitest";
import { stripBasePath } from "./api.js";

describe("stripBasePath", () => {
  it("drops a leading base path so reserved routes match", () => {
    expect(stripBasePath("/codeeditor/default/ports/4317/__ui_review/events", "/codeeditor/default/ports/4317"))
      .toBe("/__ui_review/events");
  });

  it("leaves the pathname unchanged when the proxy already stripped the base path", () => {
    expect(stripBasePath("/__ui_review/events", "/codeeditor/default/ports/4317")).toBe("/__ui_review/events");
  });

  it("is a no-op when no base path is configured", () => {
    expect(stripBasePath("/__ui_review/health", "")).toBe("/__ui_review/health");
  });

  it("does not strip a base path that is only a string prefix of a different segment", () => {
    expect(stripBasePath("/ports/43170/__ui_review/health", "/ports/4317")).toBe("/ports/43170/__ui_review/health");
  });
});
