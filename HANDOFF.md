# HANDOFF — Saleem & Co. website

## Task completed (latest)
Added an **Our Lead Counsel** team section (between *About the Firm* and *Client Reviews*).
- A 260vh scroll scene: the title pins center-screen while three member cards (S & Co. monogram frame + name/role caption) stream upward past it at individual speeds, scrubbed to scroll, with velocity-based motion blur.
- Members: Sohail Saleem (CEO - Lead Advocate), Sadaan Sohail (Lawyer), Safwaan Sohail (Lawyer).
- Screens ≤900px and reduced-motion get a static stacked layout (`team-static` class, applied by `setTeamMode()` in `script.js`).
- **Implementation**: `#team` markup in `index.html` (cards carry `--x` slot + `data-start`/`data-travel` in vh units); **TEAM** CSS block in `style.css`; `teamScroll()` in `script.js`, called from `onScroll()`. Under the smooth-scroll shell the pin is a manual `translate3d` on `.team-stage` (sticky can't work inside the transformed fixed container); native-scroll devices use `position:sticky` via `body:not(.js-smooth)`.
- Cards use the monogram as a placeholder visual per the reference design; swap in portraits by giving `.t-frame` a background image. No "Team" nav link added (same 4-item pill constraint as Reviews).
- The headline renders **above** the cards (`.team-center` z-index 3, `pointer-events:none`) and the center card is timed (`data-start="200"`) to enter only after the pin, so the title is never hidden when the section arrives.
- Cards are **interactive** like the About frame: pointer tilt (`perspective + rotateX/Y`, TEAM CARD TILT block in `script.js`) and a gold `.shine` sweep on hover.

## Previous task
Added a **Client Reviews** carousel section (between *About the Firm* and *FAQ*).
- Vertical 3-position carousel: the **current** review is centered and enlarged, the **coming-up** review peeks smaller/dimmer at the top, the **previous** review shrinks away at the bottom — looping continuously.
- **Auto-advances every 4s**; **pauses on hover**; **click a peeking avatar to jump** to it. The right-side quote **crossfades** on change.
- Decorative gold **arc** curves around the avatars; large gold **quotation marks**; a warm **candlelight glow** blooms behind the section.
- Theme-aware (dark + light), respects reduced-motion, and pauses when off-screen or the tab is hidden. Placeholder names/quotes + silhouette avatars (editable).

## Current branch
`claude/candlelight-cursor-halo-n535xm` (pushed to origin). No PR opened.

Commits for this task (newest first):
- `8826039` Refine Client Reviews: 4s loop, flip arc, add candlelight glow
- `247ba7e` Add auto-rotating Client Reviews carousel between About and FAQ

(Earlier on this branch: candlelight cursor halo, hero/navbar Figma match with embedded Forelle font, full-width nav, and the split into `index.html` / `style.css` / `script.js`.)

## Important implementation decisions
- **Markup** (`index.html`, `#reviews`): three `.rv-person` buttons, each holding `.rv-inner` → `.rv-ava` (silhouette SVG in gold glass) + `.rv-name`. Quote text lives in a `data-quote` attribute on each button; the active one is copied into `#rv-text`. A `.rv-glow` div and an `.rv-arc` SVG are section decorations.
- **Position system** (CSS): each `.rv-person` gets `is-active` / `is-next` / `is-prev`, which set custom props `--ox/--oy/--s/--op`. The person is `translate`d (vertical slot via `translateY(calc(-50% + var(--oy)))`, no scale — so `-50%` centering stays exact); `.rv-inner` is `scale()`d with `transform-origin:left center`, so the avatar **and** name scale as one unit and the name always hugs the avatar.
- **JS** (`script.js`, `reviews()` IIFE module): `place()` recomputes positions each step. The element crossing directly between top (`next`) and bottom (`prev`) gets a one-frame `.rv-noanim` so it **jumps** instead of animating back through the middle. `setInterval(…,4000)` drives auto-advance, guarded by `inView` (IntersectionObserver), `hovered`, `document.hidden` (visibilitychange), and `reduceMotion` (no auto-advance). Clicking a peeker steps forward (`next`) or backward (`prev`) and resets the dwell timer. Adapts to any N ≥ 1 reviews.
- **Arc**: SVG path `M42 24 C 156 180, 156 440, 42 596` (bulges **right**, toward the avatars) with a vertical gold gradient stroke; `.rv-arc{left:-5%}`.
- **Blended lighting** (`.rv-glow`): a warm radial gradient, `mix-blend-mode:screen` in dark / `multiply` (opacity .6) in light. It sits at `z-index:0` while `#reviews .container` is `z-index:1`, so content stays crisp above it; `#reviews{overflow:hidden}` clips it to the section.
- Reuses the existing token system (`--gold-hi`, `--gold`, `--glass-edge`, `--glass-fill`, `Marcellus SC` names, `.sec-eyebrow`, `.reveal`) so light + dark both stay correct.

## Files changed
- `index.html` — added the `#reviews` section (glow div, arc SVG, 3 review buttons, quote figure).
- `style.css` — new **CLIENT REVIEWS** block + responsive rules (stacks ≤980px; smaller avatars/offsets ≤560px).
- `script.js` — new `reviews()` carousel module (inside the existing IIFE).

## Unresolved issues
- **Placeholder content**: names/quotes are samples (in `.rv-name` + `data-quote`); avatars are silhouette SVGs — awaiting real copy/photos.
- **No "Reviews" nav link**: the nav pill is a fixed 574px with 4 items; adding a 5th would crowd it (would need widening the pill).
- **Fonts in sandbox**: `Marcellus` / `Marcellus SC` load via the Google Fonts `<link>`; that CDN is blocked in the render sandbox (`ERR_CONNECTION_RESET`), so headless shots fall back to a system serif. Renders correctly in a real browser.
- Carried over from earlier branch work: hero **background image** not swapped; hero **title/eyebrow/description sizing** is a visual estimate (no Figma Dev Mode CSS); `style.css` is large due to base64-embedded fonts/images.

## Exact next steps
1. **Real reviews**: edit the three `.rv-person` blocks in `index.html` — change `.rv-name` text and each `data-quote="…"`. Add/remove a `.rv-person` to change the count.
2. **Photo avatars**: replace the `<svg>` inside each `.rv-ava` with `<img …>`; add `.rv-ava img{width:100%;height:100%;object-fit:cover;border-radius:inherit}` to `style.css`.
3. *(Optional)* Tune the glow (`.rv-glow` intensity/position) or arc curvature; add a **"Reviews"** nav link and widen the pill.
4. **Open a PR** from `claude/candlelight-cursor-halo-n535xm` when ready to merge.

## Previewing
The site is three files that must sit in the same folder (`index.html` + `style.css` + `script.js`); open `index.html`. For a single openable file, inline `style.css` into a `<style>` and `script.js` into a `<script>` in a copy of `index.html`. Headless verification used Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (scripts live in the session scratchpad, not the repo).
