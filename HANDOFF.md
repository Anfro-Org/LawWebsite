# HANDOFF — Saleem & Co. website

## Task completed
Front-end work on the single-page law-firm site:
1. Added a subtle, theme-aware **candlelight cursor halo** (later softened to be more ambient).
2. Matched the **hero + navbar** to the Figma design: embedded the **Forelle** font, applied spec sizing/glass to the nav pill, active tab, theme toggle, and Contact button, and scaled up the hero title.
3. Made the **navbar full-width** (brand at far-left edge, toggle + Contact at far-right; pill stays centered) and **removed the faint line under the navbar**.
4. **Split the single HTML file into three files** (`index.html`, `style.css`, `script.js`).

## Current branch
`claude/candlelight-cursor-halo-n535xm` (pushed to origin)

Commits (newest first):
- `5c312bf` Split single-file site into index.html, style.css, script.js
- `eb59434` Full-width nav (brand left, CTA right) + remove under-nav line
- `d32067b` Match hero + navbar to design: embed Forelle, spec nav/buttons
- `86376ec` Soften candlelight halo for a more ambient blend
- `0d17bd1` Add subtle candlelight halo that follows the cursor

No PR opened yet.

## Important implementation decisions
- **Candlelight halo** (`#cursor-halo`): radial gradient driven by per-theme CSS vars (`--halo`, `--halo-blend`, `--halo-opacity`, `--halo-size`); `screen` blend in dark / `multiply` in light. Follows the cursor with eased lag via the existing rAF loop, has a candle-flicker keyframe, grows on interactive hover. z-index 4 (above content, below nav/cursor/modals). Hidden on touch (`pointer:coarse`) and under `prefers-reduced-motion`.
- **Forelle font**: embedded as base64 `@font-face` (Regular = 400, Medium = 500) inside the CSS; `.script` uses weight **500**. Fallback chain kept: `'Forelle','Great Vibes',cursive`.
- **Nav pill**: fixed **574×55**, radius 10. Background baked to `rgba(181,139,70,.075)` = Figma's `0.16` fill × `0.47` layer opacity (baked so link text isn't dimmed).
- **Active tab / toggle / Contact**: flat gold glass `rgba(230,196,117,.16)`. Toggle **55×55**. Contact button keeps its `.btn-fancy` hover interactiveness (sheen/glow/lift) but its **resting state was simplified** to a clean "Contact Us" (**193×55**, gold glass, gold-hi text) — icon, "Book a consultation" subtitle and arrow were removed.
- **Hero title size**: set to `clamp(5rem,15vw,15rem)` — a **visual estimate** to match the reference (no Dev Mode CSS was provided for the title).
- **Full-width nav**: `.nav` set to `width:100%; padding-inline:clamp(20px,3vw,44px)`. Centered pill is `position:absolute; left:50%` relative to the fixed `header`, so it is unaffected.
- **Under-nav line**: it was `.mobile-menu`'s `border-bottom` (menu sits at `top:var(--nav-h)`, full width, collapsed on desktop). Border moved to the `body.menu-open` state only.
- **File split**: inline `<style>` → `style.css` (linked in `<head>`), inline `<script>` → `script.js` (loaded before `</body>`). Embedded fonts/images travel inside `style.css`. **The three files must stay in the same folder** (relative paths).

## Files changed
- `index.html` — markup only now (~33 KB, was ~384 KB).
- `style.css` — **new**; all CSS + embedded Forelle fonts + background/seal image data URIs (~455 lines, ~337 KB).
- `script.js` — **new**; all JavaScript (~298 lines).

## Unresolved issues
- **Background image not swapped** — the user pasted it inline, but it was never saved as a file, so it couldn't be embedded. Current background is the existing law-office scene.
- **Hero title / eyebrow / description sizing is estimated** — no Figma Dev Mode CSS was provided for these; the title size is a visual approximation.
- **Toggle icon** is a plain crescent; the reference shows a moon **+ small star** (not yet added).
- **Nav pill is a fixed 574px** — slight crowding is possible between ~1020–1200px viewport width (pre-existing; fine on large screens; the pill is hidden ≤1020px where the hamburger takes over).
- **`style.css` is large / has very long lines** because fonts and images are base64-embedded (kept to satisfy the "three files" request).

## Exact next steps
1. **Swap background**: get the image as an **attached file**, then replace the `.hero-bg` `background:url("data:...")` data URI in `style.css` (or move it to an `assets/` file and reference it).
2. **Exact hero typography**: get Figma **Dev Mode CSS** for `.hero-title`, `.hero-eyebrow`, `.hero-desc`; apply exact `font-size` / `line-height` / `letter-spacing` / color.
3. *(Optional)* Add the **moon + star** to the toggle SVG (`.icon-moon` in `index.html`).
4. *(Optional)* Externalize embedded fonts/images from `style.css` into an `assets/` folder for a shorter, fully human-readable stylesheet (this exceeds "three files").
5. **Open a PR** from `claude/candlelight-cursor-halo-n535xm` when ready to merge.

## Verifying changes
Render locally with Chromium/Playwright (scripts used during development live in the session scratchpad, not the repo):
`chromium` at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; load `file:///home/user/LawWebsite/index.html`, wait for `document.fonts.ready`, screenshot dark + light. Check: Forelle title renders, nav dimensions (pill 574×55, contact 193×55, toggle 55×55), no line under the nav, and the halo follows the cursor after a mouse move.
