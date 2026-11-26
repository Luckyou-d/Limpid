# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed
- Top-bar tabs no longer wrap onto two lines on narrower desktops, and the top actions stay visible beside the copilot panel.

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
