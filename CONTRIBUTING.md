# Contributing

Thanks for your interest in Limpid. This guide covers how to run, check and submit changes.

## Getting started

```bash
git clone https://github.com/Luckyou-d/Limpid.git
cd Limpid
python -m http.server 8788 --directory public
```

Open http://localhost:8788 to view the desktop interface, and http://localhost:8788/mobile.html for the mobile interface.

## Before you submit

Run the smoke checks. CI runs the same script on every pull request.

```bash
node scripts/smoke.mjs
```

Please also:

- Open both the desktop and mobile pages in light and dark themes and check the layout.
- Keep changes focused. One pull request should address one topic.
- Update `CHANGELOG.md` under an `Unreleased` heading for user-visible changes.
- Keep the README in both languages in sync when you change features or setup steps.

## Guidelines

- **No frameworks, no build step, no external CDNs.** The project is plain HTML, CSS and JavaScript.
- **Keep demo data honest.** Do not present sample data as live market data. If a figure is illustrative, say so in the UI or the docs.
- **Do not rename shared identifiers casually.** Global names such as `window.FOLIO_*`, `FolioViews` and `createInitialFolioState` are referenced across files. Rename them only in a dedicated change that updates every reference.
- **Never commit secrets.** API keys, tokens and personal data must not appear in the repository. Use Cloudflare secrets or GitHub secrets instead.
- **Deployment config is shared.** Changes to `wrangler.jsonc` or `vercel.json` affect the live site. Describe them clearly in the pull request.

## Releases

Releases are created from version tags. Tags that contain a hyphen, such as `v0.1.0-beta.1`, are published as pre-releases.

```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

The release workflow runs the smoke checks and creates a GitHub Release with auto-generated notes.
