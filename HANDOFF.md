# HANDOFF — Saleem & Co. website

## Task completed (latest)
**Team member profile overlay**: clicking (or Enter/Space on) any Lead Counsel card opens a full-screen themed profile, modeled on the ARX-Care reference video: the card's frame **flies from wherever it currently is** (FLIP: measure card rect → measure photo-slot rect → animate one transform) into a large photo slot; specialty chips + a two-tone name (script-gold first name, Marcellus last name) fade in above; a **smoked dark-glass panel** (per the user's reference image: deep-brown rounded pane tucked 16px behind the photo frame, warm radial sheen, faint gold rim + inset top highlight, backdrop blur; bio set in letter-spaced Marcellus SC small caps, stats without a divider line) with bio and two stat figures **opens out of the photo card like a drawer** — clip-path reveal left→right + translateX, delayed .45s so it emerges as the flying frame lands (mobile: opens downward; clip insets go `calc(100% + 0px)` → `calc(0% - 140px)` because plain %↔px insets don't interpolate, and the negative end-insets keep the drop shadow unclipped). The chips carry the **Contact-Us hover recipe** (lift, gold border, gradient wash, sweeping sheen). Escape / × / clicking empty space closes with a **reverse flight back to the card**. Per-member content lives in `data-tags` / `data-bio` / `data-stats="num|label;num|label"` on each `.t-card` (**all bios/stats are placeholder copy awaiting real content**). Implementation notes: the overlay (`#member`) sits at body level (fixed positioning can't live inside the transformed smooth-scroll shell); scroll is locked via `html.mem-lock{overflow:hidden}` so the card can't move while open (also keeps the return target stable); the flying clone's monogram/est-line font sizes and the frame's inner-border inset (`--fin` var, added to `.t-frame::after`) are scaled by the size ratio `k` so the tile grows as one piece; the veil is tied to the `.in` class (not `.show`) so it fades during the return flight; cards got `role="button"`, tabindex, aria-labels and a hover "↗" glass badge (`.t-view`, injected by JS); `.mem-head` is a `div` because the site's global `header{position:fixed}` selector would hijack a `<header>` here. Reduced motion: no flights, instant show/hide. Small screens use a single-column scrollable layout. (A circular "Book a Consultation" seal CTA existed briefly and was removed at the user's request.)

**Stats side lighting**: two candlelight washes (`.stats-glow.sg-l/.sg-r`, same color stops as `.rv-glow`, `mix-blend-mode:screen`, light theme: multiply at .55) flank the statistics strip and reach ~halfway down the About section (`top:-12vh; height:calc(100% + 90vh)` on a `position:relative` `.stats`). Nothing clips them, so the radial falloff blends on all sides — no masks needed.

**Book Appointment hover polish**: the three contact-info icon frames (email / phone / hours) and the **Request Appointment** button now hover like the navbar **Contact Us** button — lift (`scale` + `translateY(-3px)`), gold border + glow shadow, gold gradient wash fading in, light sheen sweeping across. Icon frames are hover-only (not clickable); the submit button keeps its submit role and gains an `:active` press. CSS-only, scoped via `.book-meta i` and `.form-submit .btn-royal` (the success-modal Close button keeps the original gold-fill hover).

**FAQ polish**: the open item's `+`/`×` frame now wears the Contact Us button's *idle* glass look (gold-tint `rgba(230,196,117,.16)` fill, `--glass-edge` border, backdrop blur, `--glass-shine` shadow, gold bars) instead of the solid gold fill; and the whole question row gets a slight hover — gold text, a faint left-to-right gold wash, a 12px indent, and a brightened icon border. CSS-only (`.faq-q`, `.faq-x` rules).

**Replayable scroll animations**: the practice-areas tree lines and the stat counters (Years of Counsel / Clients Served / Filings Completed / Matters Resolved) now **re-animate every time their section scrolls back into view** (previously one-shot per page load). Both observers use thresholds `[0, play-threshold]`: fully leaving the viewport re-arms the effect (tree: `resetTree()` redraws the SVG, discarding old `fill:forwards` animations; stats: a per-element run id cancels any in-flight count and text resets to 0); partial visibility neither replays nor resets, so boundary wiggle can't retrigger. `prefers-reduced-motion` keeps the old behavior (static draw / instant final numbers, no replay). The `.reveal` fade-ins remain one-shot by design.

**Custom Service-Required dropdown**: the native `<select>` popup (unstylable) is replaced by a themed dropdown that **slides open smoothly** (max-height + fade, options cascade in with a 45ms stagger, caret rotates). Built by `script.js` as a progressive enhancement: the native select stays in the DOM as the form's source of truth (hidden via `.has-custom`; no JS = native select still works). Panel = opaque `--panel-solid` with a faint gold sheen, `--glass-edge` border; options get the house gold-wash hover; the selected one is gold with a dot marker. Full keyboard support (Enter/Space, Arrow keys, Escape, focus returns to trigger), ARIA listbox roles, outside-click closes. The submit validation flash now targets the visible trigger, and `resetServiceUI()` clears it after a successful submit.

**Reviews interaction polish**: the auto-advance now pauses **only while the cursor is over the quote text** (`#rv-text` mouseenter/leave — the whole-stage listeners are gone), and the text brightens slightly on hover (`color-mix` toward `--ink`, plain `--ink` fallback). The arc stroke is **dash-carved** (`stroke-dasharray` computed in `alignArc()` from the same path bisection) so the line is never visible behind the avatar tiles — needed because side tiles sit at 40% opacity, so no opaque background could hide it. Gaps cover each tile ±10px and recompute on resize.

## Previous task — team section
Added an **Our Lead Counsel** team section (between *About the Firm* and *Client Reviews*).
- A 260vh scroll scene: the title pins center-screen while seven member cards (S & Co. monogram frame + name/role caption) stream upward in two side lanes (4 left / 3 right, alternating), scrubbed to scroll, with velocity-based motion blur. Cards never cross the centered headline.
- Timing: uniform `data-travel="390"`, starts staggered 34vh apart (180…384) so the stream is continuous and the **pin releases exactly as the last card starts exiting** (384/390 ≈ 98.5% of the pin) — no dead title-only stretch at the end.
- Members: Sohail Saleem (CEO - Lead Advocate), Sadaan Sohail (Lawyer), Safwaan Sohail (Lawyer) are real; **Hamza Farooq, Maryam Khalid, Usman Tariq, Zara Ahmed are placeholders** (edit names/roles in the `.t-card` figcaptions).
- Screens ≤900px and reduced-motion get a static stacked layout (`team-static` class, applied by `setTeamMode()` in `script.js`).
- **Implementation**: `#team` markup in `index.html` (cards carry `--x` slot + `data-start`/`data-travel` in vh units); **TEAM** CSS block in `style.css`; `teamScroll()` in `script.js`, called from `onScroll()`. Under the smooth-scroll shell the pin is a manual `translate3d` on `.team-stage` (sticky can't work inside the transformed fixed container); native-scroll devices use `position:sticky` via `body:not(.js-smooth)`.
- Cards use the monogram as a placeholder visual per the reference design; swap in portraits by giving `.t-frame` a background image. No "Team" nav link added (same 4-item pill constraint as Reviews).
- The headline renders **above** the cards (`.team-center` z-index 3, `pointer-events:none`) and the center card is timed (`data-start="200"`) to enter only after the pin, so the title is never hidden when the section arrives.
- Cards are **interactive** like the About frame: pointer tilt (`perspective + rotateX/Y`, TEAM CARD TILT block in `script.js`) and a gold `.shine` sweep on hover.

## Previous task — client reviews
Added a **Client Reviews** carousel section (between *About the Firm* and *FAQ*).
- Vertical 3-position carousel: the **current** review is centered and enlarged, the **coming-up** review peeks smaller/dimmer at the top, the **previous** review shrinks away at the bottom — looping continuously.
- **Auto-advances every 1.5s**; **pauses while the cursor is over the quote text**; **click a peeking avatar to jump** to it. The right-side quote **crossfades** on change.
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
- **JS** (`script.js`, `reviews()` IIFE module): `place()` recomputes positions each step. The element crossing directly between top (`next`) and bottom (`prev`) gets a one-frame `.rv-noanim` so it **jumps** instead of animating back through the middle. `setInterval(…,1500)` drives auto-advance, guarded by `inView` (IntersectionObserver), `hovered`, `document.hidden` (visibilitychange), and `reduceMotion` (no auto-advance). Clicking a peeker steps forward (`next`) or backward (`prev`) and resets the dwell timer. Adapts to any N ≥ 1 reviews.
- **Arc**: SVG path `M42 24 C 156 180, 156 440, 42 596` (bulges **right**) with a vertical gold gradient stroke; `.rv-arc{left:-5%;width:min(320px,72%)}`. **Avatar centres ride the arc**: `alignArc()` in `reviews()` bisects the path for each slot's y (the SVG stretches, so it maps rail px ↔ viewBox units) and writes `--rv-ox-a`/`--rv-ox-s` onto the stage; the `--ox` slot values fall back to constants when the arc is hidden (≤560px). Re-runs on resize.
- **Blended lighting** (`.rv-glow`): a single wide, low-alpha radial wash (170% × 160%, centred) that fades across the whole section width — `mix-blend-mode:screen` in dark / `multiply` (opacity .55) in light. It sits at `z-index:0` while `#reviews .container` is `z-index:1`; `#reviews{overflow:hidden}` clips it. Because the wash extends above the section, a vertical `mask-image` fades it to zero at the clip line so the top edge blends as softly as the bottom (no seam).
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
