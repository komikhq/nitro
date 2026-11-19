This is a [Nitro](https://nitro.build) v3 server project (built on H3 v2). Nitro v3 differs a lot from v2 and your knowledge is likely outdated: read https://nitro.build/llms.txt (index of Markdown docs), especially `docs/utils.md` (imports) and `docs/migration.md` (v2 differences).

- `server/` is the server directory (`serverDir`); create subdirectories as needed: `routes/`, `middleware/`, `plugins/` and `assets/` (server assets). File paths map to URLs: `server/routes/users/[id]/index.get.ts` is `GET /users/:id`.
- `public/` (project root) holds static files.
- No auto-imports: import `defineHandler`, `HTTPError`, ... from `"nitro"`, H3 utilities (`getQuery`, `readBody`, ...) from `"nitro/h3"`, and your own helpers (e.g. `server/utils/`) with relative imports or `@/` alias.
- Handlers receive an H3 v2 event (`event.req` is a web `Request`, `event.url` a `URL`) and return JSON, a string or a `Response`.
- Scripts: `dev`, `build` (bundles into `.output/`; run with `node .output/server/index.mjs`), `preview`.
- Testing: `npx nitro fetch /hello` sends one request to the server sources (or to the running dev server) and prints the response, no build needed (curl-like options: `-X`, `-H`, `--json`, `-i`). `npx nitro serve` starts the server from the sources.

## Migration & Routing Guidelines

### 1. No `/v1` and No `/api` Prefix Policy
- **Do NOT use the `/v1` prefix** and **do NOT use the `/api` prefix** anywhere in route definitions.
- The service is served directly on the `api.*` subdomain (e.g., `api.komikhq.dpdns.org`), so all endpoints are placed directly at the root under `server/routes/`.
- **Do NOT place application routes inside `server/api/`** (since Nitro automatically prefixes `server/api/` files with `/api`). Always place all handlers in `server/routes/`.
- Examples:
  - Ported auth: `/auth/*` -> `server/routes/auth/[...all].ts`
  - Ported comics: `/comics` -> `server/routes/comics/index.get.ts`
  - Ported user profile: `/user/me` -> `server/routes/user/me/index.get.ts`
  - Ported health: `/health` -> `server/routes/health/index.get.ts`

### 2. File Route Naming: Directory + `index` Pattern
- **Every route file MUST use the `index.<method>.ts` (or `index.ts`) pattern inside its own folder**, rather than naming the file directly after the route segment.
  - ✅ **DO**: `server/routes/health/index.get.ts` (resolves to `/health`)
  - ❌ **DON'T**: `server/routes/health.get.ts`
  - ✅ **DO**: `server/routes/comics/[slug]/index.get.ts` (resolves to `/comics/:slug`)
  - ❌ **DON'T**: `server/routes/comics/[slug].get.ts`
  - ✅ **DO**: `server/routes/user/me/index.get.ts` (resolves to `/user/me`)
  - ❌ **DON'T**: `server/routes/user/me.get.ts`
- **EXCEPTION: Better Auth**:
  - Better Auth requires catch-all wildcard handling with its own special behavior (`[...all].ts` / `[...slug].ts`).
  - Use `server/routes/auth/[...all].ts` to let Better Auth handle internal auth subpaths (`/auth/sign-in/email`, `/auth/get-session`, `/auth/callback/*`, etc.).

### 3. Path Aliases
- Use `@/*` or `~/*` (pointing to project root) for clear, non-relative imports across the project (e.g., `@/server/utils/...`, `@/worker-configuration`).

### 4. Cloudflare & Node Compatibility
- Keep `cloudflare.nodeCompat: true` and `nodejs_compat` compatibility flags active for seamless execution of Node.js APIs (`Buffer`, `crypto`, Neon serverless, Better Auth) on Cloudflare Workers.
