# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                # pnpm is the package manager (pnpm-lock.yaml, packageManager field)
pnpm test                   # node --test --experimental-strip-types src/**/*.test.ts
pnpm test:watch
pnpm build                  # tsc -> dist/ (also runs via prepublishOnly)

# single test file / single test
node --test --experimental-strip-types src/index.test.ts
node --test --experimental-strip-types --test-name-pattern="uses console.warn by default" src/index.test.ts
```

Tests use the built-in `node:test` runner with native TypeScript stripping, so they need **Node >= 22.6** and no build step. Nothing in the test suite imports `envalid`, so tests run even with `node_modules` absent.

## Architecture

Single-module library: `src/index.ts` exports `warnUnused()` plus the two default ignore lists. `src/index.test.ts` is the whole test suite (18 tests). No build tooling beyond `tsc`.

Key design points that aren't obvious from the signature:

- `warnUnused(cleanedEnv)` does **not** receive the raw environment — it reads `process.env` itself at call time and diffs its keys against `Object.keys(cleanedEnv)`. That's why the tests replace `process.env` wholesale in `beforeEach` and restore it in `afterEach`.
- Filtering is two-tier: exact-name matches (`DEFAULT_IGNORE_VARIABLES`) and prefix matches (`DEFAULT_IGNORE_PREFIXES`). Both lists are grouped by origin (shell/OS, systemd, Node/package managers, GitHub Actions runner, preinstalled toolchains, browser drivers) — keep new entries in the matching group, and prefer a prefix when the runner emits a family of names.
- Passing `ignorePrefixes` or `ignoreVariables` **replaces** the corresponding default list rather than extending it. Callers who want both must spread (`[...DEFAULT_IGNORE_PREFIXES, 'MY_']`). Tests pass `ignorePrefixes: []` / `ignoreVariables: []` to isolate one tier at a time.
- Invariant enforced by tests: every entry in `DEFAULT_IGNORE_PREFIXES` ends with `_`, and no entry in `DEFAULT_IGNORE_VARIABLES` does (except the literal `_`). Respect this when adding entries — a prefix in the wrong list silently stops matching.
- `envalid` is a peer dependency only and is never imported by the library; the coupling is purely "the shape returned by `cleanEnv`" (`T extends object`).
- `tsconfig.json` excludes `**/*.test.ts` from the build, and `package.json` ships only `dist`.

## Known issue

- `.github/workflows/npm-publish.yml` runs `npm ci` on Node 20. There is no `package-lock.json` (pnpm repo), and Node 20 lacks `--experimental-strip-types`, so both CI jobs fail as written. Publishing is triggered by a GitHub release.
