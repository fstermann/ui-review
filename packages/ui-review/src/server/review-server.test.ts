import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { startReviewServer, type RunningReviewServer } from "./review-server.js";

const temporaryDirectories: string[] = [];
const runningServers: RunningReviewServer[] = [];

afterEach(async () => {
  await Promise.all(runningServers.splice(0).map((server) => server.close()));
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { force: true, recursive: true })));
});

async function startStaticServer(basePath: string): Promise<RunningReviewServer> {
  const directory = await mkdtemp(join(tmpdir(), "ui-review-server-"));
  temporaryDirectories.push(directory);
  await writeFile(join(directory, "index.html"), "<!doctype html><body><main>App</main></body>");
  const server = await startReviewServer({ basePath, port: 0, projectRoot: directory, target: directory });
  runningServers.push(server);
  return server;
}

describe("startReviewServer with a base path", () => {
  it("redirects the base path without a trailing slash to the canonical form", async () => {
    const server = await startStaticServer("/codeeditor/default/ports/4317");
    const response = await fetch(`${server.url}/codeeditor/default/ports/4317?x=1`, { redirect: "manual" });

    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("/codeeditor/default/ports/4317/?x=1");
  });

  it("injects the overlay script with the base path prefix", async () => {
    const server = await startStaticServer("/codeeditor/default/ports/4317");
    const response = await fetch(`${server.url}/codeeditor/default/ports/4317/`);
    const html = await response.text();

    expect(html).toContain('src="/codeeditor/default/ports/4317/__ui_review/browser.js"');
    expect(html).toContain('data-ui-review-base-path="/codeeditor/default/ports/4317"');
  });

  it("serves the annotation API under the prefixed path", async () => {
    const server = await startStaticServer("/codeeditor/default/ports/4317");
    const response = await fetch(`${server.url}/codeeditor/default/ports/4317/__ui_review/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("does not redirect when served at the origin root", async () => {
    const server = await startStaticServer("");
    const response = await fetch(`${server.url}/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('src="/__ui_review/browser.js"');
  });
});
