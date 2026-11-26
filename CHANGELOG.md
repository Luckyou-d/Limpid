# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.0-beta.2] - 2026-11-23

Documentation and preview release. The demo data is unchanged from 0.1.0-beta.1.

### Added
- Eighteen screenshots covering all desktop pages (Today, Discover, Workbench tabs, Portfolio, Compare, Alerts, Research, Thesis, Skills, Evaluation, Events, Profile) plus four mobile views.
- Smoke checks now verify that every image referenced by the README exists, and that research reports quote prices and indicators matching the market snapshot.

### Changed
- README: the core features section is expanded into fourteen detailed subsections; the separate tech-stack section was removed.

## [0.1.0-beta.1] - 2026-11-23

First public beta.

### Added
- Desktop workbench: Today overview, Discover, Workbench (K-line, financials, news), Portfolio, Compare, Alerts, Research, Investment thesis, Skills, Evaluation, Events and Profile.
- Deep research view with a per-capability execution record, labelling success, partial success and unavailable data.
- Investment thesis view that checks saved assumptions against the latest market data.
- Agent copilot panel with view and symbol context. Read-only.
- Command palette (`Ctrl/⌘ + K`), light and dark themes.
- Dedicated mobile interface at `/mobile.html`.
- Cloudflare Workers configuration (`wrangler.jsonc`, `src/worker.js`) and Vercel configuration (`vercel.json`).
- Smoke checks (`scripts/smoke.mjs`), PR check workflow and release workflow.
- MIT License, README in Chinese and English, contributing guide.

### Changed
- Rebranded the project as Limpid (明澈) with a new logo and favicon.
- Switched the accent colour to light blue and tuned button contrast for both themes.
- Persisted demo state now uses the `limpidwork_demo_state_v1` storage key.

### Fixed
- Top-bar tabs no longer wrap onto two lines on narrower desktops, and the top actions stay visible beside the copilot panel.
