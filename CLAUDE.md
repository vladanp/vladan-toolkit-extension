# Vladan Toolkit: project guide

A personal Chrome extension (Manifest V3) that grows one feature at a time.
**Every feature must be switchable on/off in the extension's settings.**
The repo is **public**: never commit secrets, tokens, `.env` files, or personal data.

## Stack

- **WXT** (Vite based extension framework): manifest generated from `wxt.config.ts` + `src/entrypoints/`
- **React 19** + **TypeScript 7** + **Tailwind CSS v4** (CSS first config, `@import "tailwindcss"`)
- **Biome** (lint + format), **Vitest** (unit; WXT fake `browser`; optional `happy-dom`), **Playwright** (e2e in real Chromium)
- **pnpm 12**, **lefthook** git hooks, **commitlint** (conventional commits), **release-please**
- **Node 26**, pinned in `package.json` `devEngines.runtime` (pnpm downloads it for scripts; CI reads it too).
  Dependency versions are pinned exactly (`saveExact` in `pnpm-workspace.yaml`): no `^` ranges.

## Commands

| Command                         | What it does                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm dev`                      | Opens Chrome with the extension loaded + hot reload (persistent profile in `.chrome-dev-profile/`)  |
| `pnpm verify`                   | Everything: typecheck, Biome, unit tests, build, e2e. Must be green before pushing                  |
| `pnpm check`                    | Typecheck (regenerates WXT types first) + Biome (CI mode)                                           |
| `pnpm lint:fix`                 | Autofix formatting/lint                                                                             |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests (`src/**/*.test.ts(x)`, `scripts/**/*.test.ts`)                                   |
| `pnpm e2e`                      | Playwright e2e (`e2e/*.spec.ts`); global setup installs Chromium if missing and builds + zips first |
| `pnpm build` / `pnpm zip`       | Production build to `.output/chrome-mv3` / zip for the Web Store                                    |

## Git hooks (automatic)

- `pre-commit` (fast): Biome autofixes staged files, typecheck.
- `commit-msg`: must be a conventional commit: `feat: ...`, `fix: ...`, `chore: ...`, `refactor: ...`, `docs: ...`, `test: ...`, `ci: ...`, `build: ...`.
  Only `feat`/`fix` (and breaking changes) trigger a release.
- `pre-push` (`scripts/check-push.ts`): refuses uncommitted/untracked files, pushing a branch that isn't
  checked out, and local `.env*` files WXT would bake into the build; then runs `pnpm verify`.
  Tag only pushes and deletions skip verify. Never bypass with `--no-verify`; fix the failure instead.

## Layout

```
src/
  entrypoints/        # WXT entrypoints → each becomes part of the manifest
    background.ts     # service worker
    popup/            # toolbar popup: feature switches + "All settings"
    options/          # settings page (opens in a tab): feature switches
    <feature>.content.ts  # content scripts, one per feature
  features/
    registry.ts       # THE list of features (drives the switches)
    rulesets.ts       # network rule features (declarativeNetRequest), read by wxt.config.ts
    <feature-id>/     # one folder per feature: index.ts = definition only; logic, CSS, tests next to it
  components/         # shared React UI (FeatureToggles)
  lib/features.ts     # Feature type + groups, featureEnabled(), featureChoice(), whileEnabled(), pausedSites
  lib/style.ts        # injectStyle(): switchable <style> for a page or a shadow root (in a cascade layer)
  lib/main-world.ts   # mainWorldSwitch(): a feature's switch inside the page's own JS world
  lib/page-switch.ts  # shareSwitchWithPage(): isolated world side of that
  lib/rulesets.ts     # Rule/Ruleset types, syncRuleset() (background)
  lib/youtube.ts      # watchPageVideoId()
  assets/global.css   # Tailwind entry for extension pages
e2e/                  # Playwright tests; e2e/fixtures/ = offline models of real sites
scripts/              # repo tooling (guard run before every push)
public/icon/          # extension icons
```

## Adding a feature (the recipe)

1. **Define it** in `src/features/<feature-id>/index.ts`:

   ```ts
   export const myFeature = {
     id: 'my-feature',            // kebab case, never rename (it's the storage key)
     name: 'My feature',          // shown next to the switch
     description: 'What it does, in one sentence.',
     group: 'YouTube',            // settings section: one of featureGroups in lib/features.ts (add one if needed)
     enabledByDefault: true,
   } satisfies Feature;
   ```

   Keep `index.ts` to the definition: the popup imports every one. Heavy logic goes in other files.
   A setting beyond on/off: add `choice: { label, options: { value: 'Label', … }, default }`; the popup shows a
   dropdown next to the switch, and `featureChoice(myFeature)` is its storage item (see `default-youtube-quality`).
2. **Register it** in `src/features/registry.ts`. The popup and settings page then show its switch automatically.
3. **Gate all behavior on the switch** (it must apply live, without reloading pages). `whileEnabled` and
   `shareSwitchWithPage` also turn the feature off on sites paused from the popup ("Pause on this site"), and the
   background exempts paused sites from every network ruleset; code reading `featureEnabled` directly doesn't:
   - Content script: `src/entrypoints/<feature-id>.content.ts` with
     `const stop = await whileEnabled(myFeature, () => { start(); return undo; }); ctx.onInvalidated(stop);`
     For page CSS: `whileEnabled(myFeature, () => injectStyle(css, myFeature.id))`, importing the CSS file with
     `?inline` (see `hide-youtube-shorts`). Don't use manifest injected CSS: it can't be switched off. Elements
     inside a shadow root need `injectStyle(css, id, host.shadowRoot)` (see `clean-reddit/cleaner.ts`).
     `injectStyle` puts the rules in a cascade layer, so write every declaration with `!important`: then they beat
     the page's own `!important` rules whatever their specificity. To hide elements found by script, set a
     `data-vladan-toolkit-*` attribute and style that (see `hide-newsletter-popups/detector.ts`); remove it in `undo`.
   - Overriding page APIs (e.g. `Notification.requestPermission`): a `world: 'MAIN'` content script, run at
     `document_start`, that reads the switch with `mainWorldSwitch(feature.id)`, plus an isolated content script
     calling `shareSwitchWithPage(feature)` (see `block-notification-prompts`). Page world code can't import
     extension APIs or `#imports`, and must keep working when the switch is off (call the original API).
     Calling page APIs with a setting (e.g. YouTube's player): the isolated script puts the value in a
     `data-vladan-toolkit-*` attribute on `<html>` while the switch is on, and the page world script reads and
     watches it (see `default-youtube-quality`).
   - Background: check `await featureEnabled(myFeature).getValue()` before acting, and use
     `featureEnabled(myFeature).watch(...)` to add/remove listeners, context menus, alarms, etc.
     Content script ↔ background: a request object tagged with the feature id, answered via `sendResponse`
     (see `reject-cookie-banners/protocol.ts` and `entrypoints/background.ts`).
   - Network rules (redirects, removing URL parameters, blocking): write the declarativeNetRequest rules in
     `src/features/<feature-id>/rules.ts` as `{ id: '<feature-id>', rules }` and add it to
     `src/features/rulesets.ts`. The build writes `rules/<id>.json` + the manifest entry, and the background
     switches the ruleset with the feature. Test with a real local server (see `e2e/remove-tracking-params.spec.ts`).
   - Calls to outside services: prefer ones with CORS so the content script can call them without new
     permissions, send as little as possible (see SponsorBlock's hash prefix), and add them to `PRIVACY.md`.
4. **Other places it can run**:
   - Content script UI → `<feature-id>.content/index.tsx` with `createShadowRootUi`. Caution: Tailwind v4 utilities
     that rely on `@property` (shadows, gradients, transforms) may not render inside a shadow root.
   - Side panel → `src/entrypoints/sidepanel/` (WXT adds the `sidePanel` permission itself). Because the toolbar
     icon opens the popup, open the panel with `browser.sidePanel.open()` from a click (e.g. a popup button).
5. **Permissions**: add only what the feature needs to `manifest.permissions` / `host_permissions` in
   `wxt.config.ts` (content script `matches` already grant access to those sites), with a comment saying which
   feature needs it. Already on: `storage`, `scripting`, `declarativeNetRequestWithHostAccess`, and host access to
   all websites (`*://*/*`, for cookie banners and tracking parameters). Adding a permission makes Chrome disable
   the extension for store users until they accept it, so avoid new ones where possible.
6. **Tests**:
   - Unit tests next to the code (`*.test.ts`; `vitest.setup.ts` resets the fake `browser` before each test).
     Tests needing a DOM start with `// @vitest-environment happy-dom`.
   - E2E: add a spec covering the feature **on and off** (toggle with `setFeature(...)` from `e2e/fixtures.ts`,
     which uses the popup's switch). For site features, serve an offline model of the site with
     `context.route(..., route => route.fulfill(servePage('<file>.html')))` (see `e2e/hide-youtube-shorts.spec.ts`);
     include lookalike elements that must NOT be affected. Stub outside services the same way.
   - For site features, also check once against the live site before shipping (sites change markup). Headless
     Chromium gets bot walls on some sites (e.g. Reddit): give it a regular Chrome `userAgent`.
7. **Store listing**: add the feature to `store/LISTING.md` (description; permission justifications if
   permissions/sites changed), `PRIVACY.md` (if it touches new sites or data) and README's feature table.
   Run `pnpm store-assets` if the popup changed. The user pastes listing changes into the dashboard.
8. **Verify**: `pnpm verify`, then commit with `feat: <what it does>` (drives the version bump + changelog).

## Rules

- MV3 only; no remotely hosted code, no `eval`/`new Function` (Chrome Web Store policy). Code run in a page's
  main world (`browser.scripting.executeScript({ world: 'MAIN', func })`) must be a bundled function.
- `browser.*` (WXT's global) instead of `chrome.*`.
- Settings/state via WXT storage (`import { storage } from '#imports'`), never `localStorage`.
- Tailwind utility classes for extension pages; no extra CSS frameworks.
- Keep the popup fast: no heavy work on open; defer to background where possible.
- Claude desktop app on Windows: it's a packaged app that redirects `%LOCALAPPDATA%` writes, which breaks
  Playwright's default browser cache. `.claude/settings.local.json` (gitignored) sets
  `PLAYWRIGHT_BROWSERS_PATH=D:\.cache\ms-playwright` for the agent only; other environments use the default.

## Releasing

- Every push to `main` updates a **Release PR** (release-please). Merge it to release: it tags `vX.Y.Z`
  (first release: `v0.2.0`), writes `CHANGELOG.md` and creates the GitHub Release; then full CI runs on that tag,
  and only if green is the tested zip attached to the release and published to the Chrome Web Store.
- Web Store publishing is **opt in**: only when the repo variable `CWS_PUBLISH` is `true`
  (`gh variable set CWS_PUBLISH --body true`). Currently off: the user installs locally (unpacked).
- Web Store credentials: secret `CHROME_SUBMIT_ENV` (the whole `.env.submit` from `pnpm wxt submit init`,
  CWS API v2 service account) in the GitHub **environment** `chrome-web-store`, usable only from `main`.
- Failed publish or credential check: Actions → **Release** → Run workflow (tag to republish; "dry run" = check only).
- Version comes from `package.json` (WXT copies it into the manifest). Don't bump it by hand.
  The Chrome Web Store rejects all zero versions, so the project started at `0.1.0` (never released itself).
