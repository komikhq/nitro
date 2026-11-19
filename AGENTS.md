This is a [Nitro](https://nitro.build) v3 server project (built on H3 v2). Nitro v3 differs a lot from v2 and your knowledge is likely outdated: read https://nitro.build/llms.txt (index of Markdown docs), especially `docs/utils.md` (imports) and `docs/migration.md` (v2 differences).

- `server/` is the server directory (`serverDir`); create subdirectories as needed: `routes/`, `middleware/`, `plugins/`, `operations/` and `assets/`. File paths map to URLs: `server/routes/users/[id]/index.get.ts` is `GET /users/:id`.
- `public/` (project root) holds static files.
- No auto-imports: import `defineHandler`, `HTTPError`, ... from `"nitro"`, H3 utilities (`getQuery`, `readBody`, ...) from `"nitro/h3"`, and your own helpers (e.g. `server/utils/`, `server/operations/`) with relative imports or `@/` alias.
- Handlers receive an H3 v2 event (`event.req` is a web `Request`, `event.url` a `URL`) and return JSON, a string or a `Response`.
- Scripts: `dev`, `build` (bundles into `.output/`; run with `node .output/server/index.mjs`), `preview`.
- Testing: `npx nitro fetch /hello` sends one request to the server sources (or to the running dev server) and prints the response, no build needed (curl-like options: `-X`, `-H`, `--json`, `-i`). `npx nitro serve` starts the server from the sources.

## Migration & Routing Guidelines

### 1. No `/v1` and No `/api` Prefix Policy
- **Do NOT use the `/v1` prefix** and **do NOT use the `/api` prefix** anywhere in route definitions.
- The service is served directly on the `api.*` subdomain (e.g., `api.komikhq.dpdns.org`), so all endpoints are placed directly at the root under `server/routes/`.
- **Do NOT place application routes inside `server/api/`** (since Nitro automatically prefixes `server/api/` files with `/api`). Always place all handlers in `server/routes/`.
- Examples:
  - Auth handler: `/auth/*` -> `server/routes/auth/[...all].ts`
  - Comics: `/comics` -> `server/routes/comics/index.get.ts`
  - Health: `/health` -> `server/routes/health/index.get.ts`

### 2. Standard Better Auth Endpoints (No Redundant `/user/me`)
- Use **Better Auth's native `/auth/get-session` endpoint** to obtain current user profile & active session on client apps.
- **Do NOT create custom redundant `/user/me` routes** solely for returning the current authenticated user.

### 3. Pure Database Authentication Architecture
- **All auth tables & sessions are stored directly in PostgreSQL (Neon) via Drizzle**.
- **Do NOT store or cache sessions in Cloudflare KV**. Cloudflare KV Free tier imposes a strict 1,000 writes/day quota which can easily be exhausted by session creation/updates.
- Session validation is performed directly against PostgreSQL using Better Auth (`auth.api.getSession`), avoiding KV write/read limits.

### 4. File Route Naming: Directory + `index` Pattern
- **Every route file MUST use the `index.<method>.ts` (or `index.ts`) pattern inside its own folder**, rather than naming the file directly after the route segment.
  - ✅ **DO**: `server/routes/health/index.get.ts` (resolves to `/health`)
  - ❌ **DON'T**: `server/routes/health.get.ts`
  - ✅ **DO**: `server/routes/comics/[slug]/index.get.ts` (resolves to `/comics/:slug`)
  - ❌ **DON'T**: `server/routes/comics/[slug].get.ts`
- **EXCEPTION: Better Auth**:
  - Better Auth requires catch-all wildcard handling with its own special behavior (`[...all].ts`).
  - Use `server/routes/auth/[...all].ts` to handle internal auth subpaths (`/auth/sign-in/email`, `/auth/get-session`, `/auth/callback/*`, etc.).

### 5. Single-Responsibility Functional Operations Architecture
- **NO OOP classes (No Repository or Service classes)**:
  - ❌ **DON'T**: `new ComicService(db, env)`, `new ComicRepository(db)`.
  - ❌ **DON'T**: Monolithic files that cram all CRUD operations of an entity together.
- **Naming Pattern for Operations**:
  - Semua file operasi wajib mengikuti pola terurut alfanumerik: `[aksi]-[entitas]-[spesifikasi].ts`:
    - Kata ke-1: Aksi/verb (`find`, `create`, `update`, `delete`, `record`)
    - Kata ke-2: Entitas singular (`comic`, `chapter`, `genre`, `user`, `comment`)
    - Kata ke-3+: Spesifikasi (`many`, `by-slug`, `trending`, `reader-pages`, dll.)
  - ✅ **Contoh teratur yang mengelompok di file tree**:
    - `find-comic-by-slug.ts`
    - `find-comic-many.ts`
    - `find-comic-trending.ts`
    - `find-chapter-reader-pages.ts`
    - `find-genre-many.ts`
    - `find-search-suggestions.ts`
    - `record-view.ts`
  - ❌ **DILARANG**: `find-trending-comics.ts` (karena huruf 't' merusak urutan alfanumerik entity `comic`).

### 6. Idiomatic Nitro, Drizzle & Better Auth Architecture (The Nitro Way)
- **NO Hono-style manual env passing**:
  - ❌ **DON'T**: Passing `c.env` / `env` as parameter across functions (`getAuth(env)`, `createDbClient(env.DATABASE_URL)`).
  - ✅ **DO**: Use Nitro Server Utils (`server/utils/`) and event context.
- **Database (Drizzle + Neon)**:
  - Create `server/utils/db.ts` with `useDb(event?)` which lazily initializes and reuses the Drizzle client per runtime using Nitro's environment / bindings.
  - In any handler: `const db = useDb(event);`
- **Better Auth Integration**:
  - Centralized `server/utils/auth.ts` exporting `useAuth(event?)` instance configured with Drizzle adapter and Neon client.
  - Mount via catch-all handler: `server/routes/auth/[...all].ts` delegating directly to `auth.handler(event.req)`.

### 7. Path Aliases
- Use `@/*` or `~/*` (pointing to project root) for clear, non-relative imports across the project (e.g., `@/server/utils/...`, `@/server/operations/...`, `@/worker-configuration`).

### 8. Cloudflare & Node Compatibility
- Keep `cloudflare.nodeCompat: true` and `nodejs_compat` compatibility flags active for seamless execution of Node.js APIs (`Buffer`, `crypto`, Neon serverless, Better Auth) on Cloudflare Workers.
