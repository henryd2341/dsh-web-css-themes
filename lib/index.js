import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, copyFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * dsh-web-css-themes host plugin.
 *
 * Stores user CSS themes as plain `.css` files under
 * `$DSH_HOME/web-themes` (default `~/.dsh/web-themes`), so users can also
 * manage them by hand. The active theme id lives in
 * `$DSH_HOME/web-themes/active.json`.
 *
 * The plugin registers:
 *  - `GET /dsh-themes/active.css` and `GET /dsh-themes/<id>.css`
 *  - a small JSON API under `/api2/css-themes/*`
 *  - an index tap that injects
 *    `<link rel="stylesheet" href="/dsh-themes/active.css" id="dsh-theme-stylesheet">`
 *    before `</head>` of the served frontend index.html. That is the runtime
 *    equivalent of manually editing
 *    `@deepseek-ai/dsh-web-frontend/dist/index.html`.
 */

/** Stable Cordis plugin name. */
export const name = "css-themes";

/** The webserver service is required before routes/taps can be registered. */
export const inject = ["webServer"];

const THEME_DIR_NAME = "web-themes";
const ACTIVE_FILE_NAME = "active.json";
const CSS_ROUTE_PREFIX = "/dsh-themes";
const API_ROUTE_PREFIX = "/api2/css-themes";
const MAX_BODY_BYTES = 2 * 1024 * 1024;

/** Resolve the harness home directory (`$DSH_HOME`, then `~/.dsh`). */
function dshHome() {
  return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}

/** Absolute path of the theme directory. */
function themesDir() {
  return join(dshHome(), THEME_DIR_NAME);
}

/** Absolute path of the active-theme marker file. */
function activeFile() {
  return join(themesDir(), ACTIVE_FILE_NAME);
}

/**
 * Validate a theme id: filesystem-safe, no slashes, no traversal, not the
 * reserved `active` id (the route `/dsh-themes/active.css` is the live alias
 * of the currently active theme).
 */
function isSafeThemeId(id) {
  return typeof id === "string"
    && /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(id)
    && id !== "active"
    && id !== "."
    && id !== "..";
}

function themePath(id) {
  return join(themesDir(), `${id}.css`);
}

function ensureThemeDir() {
  mkdirSync(themesDir(), { recursive: true });
}

function readActiveThemeId() {
  try {
    const parsed = JSON.parse(readFileSync(activeFile(), "utf8"));
    return typeof parsed?.active === "string" ? parsed.active : null;
  } catch {
    return null;
  }
}

function writeActiveThemeId(id) {
  ensureThemeDir();
  writeFileSync(activeFile(), JSON.stringify({ active: id }, null, 2) + "\n");
}

/** Extract a display name from a leading at-name (`@name`) CSS comment. */
function readThemeName(id) {
  try {
    const css = readFileSync(themePath(id), "utf8");
    const match = /^\s*\/\*\s*@name\s+([^*\r\n]+?)\s*\*\//.exec(css);
    return match ? match[1].trim() : id;
  } catch {
    return id;
  }
}

/** Return one theme row for the client UI. */
function listThemes() {
  ensureThemeDir();
  const active = readActiveThemeId();
  const rows = [];
  for (const file of readdirSync(themesDir())) {
    if (!file.endsWith(".css")) continue;
    const id = file.slice(0, -4);
    if (!isSafeThemeId(id)) continue;
    rows.push({
      id,
      name: readThemeName(id),
      active: id === active,
      href: `${CSS_ROUTE_PREFIX}/${id}.css`
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

/** Copy the bundled example themes when the theme directory is first created. */
function seedExampleThemes() {
  const dir = themesDir();
  if (existsSync(dir)) return;
  ensureThemeDir();
  const examplesDir = fileURLToPath(new URL("../examples/", import.meta.url));
  try {
    for (const file of readdirSync(examplesDir)) {
      if (!file.endsWith(".css")) continue;
      if (!isSafeThemeId(file.slice(0, -4))) continue;
      copyFileSync(join(examplesDir, file), join(dir, file));
    }
  } catch {
    // Examples are a convenience; an empty theme directory is perfectly valid.
  }
}

/** Inject the active-theme stylesheet link before `</head>`. */
function injectThemeLink(html) {
  const active = readActiveThemeId();
  if (!isSafeThemeId(active)) return html;
  const link = `<link rel="stylesheet" href="${CSS_ROUTE_PREFIX}/active.css" id="dsh-theme-stylesheet" data-dsh-css-theme="true">`;
  const headEnd = html.lastIndexOf("</head>");
  if (headEnd !== -1) return `${html.slice(0, headEnd)}${link}${html.slice(headEnd)}`;
  return `${link}${html}`;
}

/** Read a JSON request body with a hard size cap. */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(body);
}

function sendError(res, status, code, message) {
  sendJson(res, status, { ok: false, error: { code, message } });
}

/** Serve `GET/HEAD /dsh-themes/active.css` and `/dsh-themes/<id>.css`. */
async function serveCss(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" });
    res.end();
    return;
  }
  const pathname = new URL(req.url ?? "/", "http://x").pathname;
  let id = null;
  if (pathname === `${CSS_ROUTE_PREFIX}/active.css`) {
    id = readActiveThemeId();
  } else if (pathname.startsWith(`${CSS_ROUTE_PREFIX}/`) && pathname.endsWith(".css")) {
    id = pathname.slice(CSS_ROUTE_PREFIX.length + 1, -4);
  }
  if (!isSafeThemeId(id)) {
    res.writeHead(404);
    res.end();
    return;
  }
  let body;
  try {
    body = readFileSync(themePath(id));
  } catch {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    "content-type": "text/css; charset=utf-8",
    "cache-control": "no-cache"
  });
  res.end(req.method === "HEAD" ? undefined : body);
}

/** API handler for `/api2/css-themes/<op>`. */
async function serveApi(req, res) {
  const pathname = new URL(req.url ?? "/", "http://x").pathname;
  let op = pathname === API_ROUTE_PREFIX ? "" : pathname.startsWith(`${API_ROUTE_PREFIX}/`) ? pathname.slice(API_ROUTE_PREFIX.length + 1) : null;
  if (op === null) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && op === "list") {
      sendJson(res, 200, { ok: true, value: listThemes() });
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405, { allow: "GET, POST" });
      res.end();
      return;
    }

    const body = await readJsonBody(req);

    if (op === "list") {
      sendJson(res, 200, { ok: true, value: listThemes() });
      return;
    }

    if (op === "activate") {
      const id = body?.id;
      if (id === null || id === "") {
        writeActiveThemeId(null);
        sendJson(res, 200, { ok: true, value: { active: null } });
        return;
      }
      if (!isSafeThemeId(id)) {
        sendError(res, 400, "invalid-id", "主题 id 不合法（仅允许字母、数字、点、下划线、连字符，且不能为 active）");
        return;
      }
      if (!existsSync(themePath(id))) {
        sendError(res, 404, "not-found", `主题 ${id} 不存在`);
        return;
      }
      writeActiveThemeId(id);
      sendJson(res, 200, { ok: true, value: { active: id } });
      return;
    }

    if (op === "save") {
      const id = body?.id;
      if (!isSafeThemeId(id)) {
        sendError(res, 400, "invalid-id", "主题 id 不合法（仅允许字母、数字、点、下划线、连字符，且不能为 active）");
        return;
      }
      if (typeof body?.css !== "string") {
        sendError(res, 400, "invalid-css", "css 必须是字符串");
        return;
      }
      const css = body.css;
      const rawName = typeof body?.name === "string" ? body.name.trim() : "";
      const name = rawName.length > 0 ? rawName : id;
      ensureThemeDir();
      writeFileSync(themePath(id), withNameComment(css, name));
      sendJson(res, 200, { ok: true, value: { id, name } });
      return;
    }

    if (op === "delete") {
      const id = body?.id;
      if (!isSafeThemeId(id)) {
        sendError(res, 400, "invalid-id", "主题 id 不合法");
        return;
      }
      const path = themePath(id);
      if (existsSync(path)) rmSync(path);
      if (readActiveThemeId() === id) writeActiveThemeId(null);
      sendJson(res, 200, { ok: true, value: { deleted: id } });
      return;
    }

    res.writeHead(404);
    res.end();
  } catch (error) {
    sendError(res, 400, "bad-request", error instanceof Error ? error.message : String(error));
  }
}

/** Return `css` with the leading at-name (`@name`) CSS comment replaced by `name`. */
function withNameComment(css, name) {
  const safeName = String(name).replace(/\*\//g, "").trim() || "Untitled";
  const header = `/* @name ${safeName} */`;
  const match = /^\s*\/\*\s*@name\s+[^*\r\n]*\*\/\s*(?:\r?\n|$)/.exec(css);
  if (match) return `${header}\n${css.slice(match[0].length)}`;
  return `${header}\n${css}`;
}

/**
 * Mount routes and the index tap. `inject: ["webServer"]` guarantees
 * `ctx.webServer` exists here.
 */
export function apply(ctx) {
  seedExampleThemes();

  ctx.effect(() => {
    const disposers = [
      ctx.webServer.register({ kind: "prefix", path: CSS_ROUTE_PREFIX, handler: serveCss }),
      ctx.webServer.register({ kind: "prefix", path: API_ROUTE_PREFIX, handler: serveApi }),
      ctx.webServer.tapIndex(injectThemeLink)
    ];
    return () => {
      for (const dispose of disposers) dispose();
    };
  }, "dsh-web-css-themes: routes and index tap");
}
