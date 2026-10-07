# OpenNext → vinext migration check

Checked 28 September 2026 against PR #52 (`26923a4`). The OpenNext comparison checkout was local `main` (`92134bb`); the PR and `main` share base `20a941b`. No production deployment was made.

## Conclusion

No breaking application behavior was reproduced in the local paths exercised. The vinext Worker builds, previews, and passes a Wrangler deployment dry run; its HTTP, email, queue, and scheduled entrypoints work locally. **One new tooling regression should be fixed before merging:** the locked dependency set makes `tsc --noEmit` stop while parsing a dependency declaration, before it can check Mailflare source.

## Finding: TypeScript checking stops in a new dependency (P2)

`npx tsc --noEmit --incremental false` exits with three parse errors at `node_modules/@vitejs/plugin-react/dist/index.d.ts:62` (`TS1003`, `TS1005`, `TS1128`). The declaration exports `viteReactForCjs as "module.exports"`, which the locked TypeScript 5.9.3 parser rejects. PR #52 adds `@vitejs/plugin-react: ^6.0.0`; its lockfile installs 6.1.1, while `typescript: ^5.7.4` resolves to 5.9.3. `skipLibCheck` does not suppress declaration *syntax* errors. The OpenNext `main` checkout reaches application diagnostics instead of failing at this declaration, although that branch also has existing type errors.

Impact: the project cannot use its normal type-check command to find migration or application type errors. Align and pin a compatible TypeScript/plugin version pair, regenerate the lockfile, then rerun `tsc --noEmit`. See [package.json](../package.json) and [tsconfig.json](../tsconfig.json).

## Checks performed

| Check | Result |
| --- | --- |
| `npm run build` (vinext) | Passed; generated `dist/server/wrangler.json` and client assets. Geist font files were emitted locally under `dist/client/_next/static/_vinext_fonts`. |
| `vite preview` of that build | `/`, `/login`, `/api/setup/status`, `/api/branding/icon`, and a local font returned 200. Unauthenticated `/api/auth/me` and `/api/messages` returned 401. JMAP discovery redirected to `/jmap/session`, which returned 401 without credentials. `/mcp` returned 401. The realtime endpoint returned 426 without an upgrade and logged 401 for an unauthenticated upgrade. Security headers appeared on page and API responses. |
| `wrangler deploy --dry-run` | Passed using the generated Wrangler config. Output included the custom Worker, 219 static assets, and the expected D1, R2, Queues, Durable Object, AI, Email, Assets, and rate-limit bindings. No upload occurred. |
| `wrangler dev --local` with isolated persistence | Passed. All 44 D1 migrations applied. A test Email Routing event returned `outcome: ok`, stored a 265-byte raw MIME object in R2, and dispatched one inbound queue message (`1/1`). The message had no configured recipient, so this did **not** prove inbox delivery. A `*/5 * * * *` scheduled invocation returned `outcome: ok`. `/` and `/api/setup/status` returned 200; `/api/realtime` returned 426 without an upgrade. |
| `npm run build:node` and isolated Node runtime | Passed. The Node server applied 44 migrations in a temporary data directory. `/`, `/api/setup/status`, and `/api/branding/icon` returned 200; `/api/auth/me` returned 401 without credentials. |
| `node --test tests/*.test.mjs` | PR: 27 passed, 3 failed. OpenNext `main`, using Node 24: the same 27 passed and the same 3 failed (agent email-tools assertion and two bootstrap-schema assertions). These are not migration regressions. |
| ESLint on changed code files | 0 errors, 1 unused `ctx` warning in `worker.ts`. Repository-wide `npm run lint` failed amid unrelated local `.agents` and `mailflare-landing`/generated files, so it is not a useful migration comparison in this checkout. |

The separate OpenNext `main` production build was attempted in an isolated worktree but did not finish: its fresh npm installation could not load the optional native `@tailwindcss/oxide-darwin-arm64` binding from Turbopack, even after a local dependency repair attempt. That environment failure does not establish an OpenNext/vinext behavior difference.

## Coverage still needed before a production switch

- Test an authenticated WebSocket connection and notification through `RealtimeHub`; the local checks covered only the unauthenticated paths.
- Test Email Routing into an actual mailbox and outbound Email Sending on a disposable Cloudflare deployment. The local email check proved handler → R2 → queue dispatch, not delivery.
- Exercise authenticated inbox, message actions, JMAP/MCP clients, and Workers AI on that deployment. These paths were not covered by the smoke checks here. The PR description reports broader local browser testing, but this report did not independently repeat it.
- Inspect Cloudflare build/deploy settings for installations that still invoke OpenNext. The PR changes `npm run build` and `npm run deploy` to vinext; an account-specific command can bypass them.

The generated-config deployment path used here matches [Cloudflare's Vite plugin deployment guide](https://developers.cloudflare.com/workers/vite-plugin/tutorial/). All runtime writes made for the Worker event checks used `/tmp/mailflare-pr52-cf-audit`; the Node check used `/tmp/mailflare-pr52-node-audit`. Existing local app data and the user's `.gitignore` and `.wrangler.dev.json` were left untouched.
