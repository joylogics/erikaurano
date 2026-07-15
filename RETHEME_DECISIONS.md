# Matsuya-Fluid re-theme — decisions & review notes

Branch `matsuya-fluid-retheme`. Built and deployed to NEXT for review. This logs
every judgment call made while running autonomously, plus the things that need a
human before PROD.

## Feedback round 5 (applied, redeployed to NEXT)

- **Intro card centred in the viewport + parallax** — the card now sits in the
  middle of the window (not near the top) and, on scroll, moves at half the mosaic's
  speed (`SPEED = 0.5` in the `index.html` script — 1 = moves with the page, 0 =
  pinned). Reduced-motion users get a static card near the top instead.
- **Evened out the mosaic columns** — pure CSS `column-count` can't balance columns
  when image heights vary this much (that was the trailing-whitespace complaint), so a
  small script now distributes tiles into flex columns using the LPT heuristic (assign
  tallest-first into the shortest column), then renders each column in original order.
  Column bottoms now land within ~75px of each other (was 250px+). No-JS fallback is
  still the CSS-column masonry. This is *not* the round-3 vertical justification —
  images keep natural spacing; only which column they land in changed. Trade-off:
  strict top-to-bottom reading order gives way to balance-driven placement.

## Feedback round 4 (applied, redeployed to NEXT)

- **Reverted the home mosaic to plain CSS-column masonry** — dropped the JS
  vertical-justification layout from round 3 and went back to the original
  `column-count` masonry (4 cols desktop / 3 @1024 / 2 @768 / 1 @460), the same
  mechanism as the Art grid. Removed the whole positioning `<script>` from
  `index.html` and the absolute-position / `is-laid-out` CSS. Trade-off Erika
  accepted: the last column can end short (inherent to CSS columns), same as Art.
- **Intro text is now a floating glass card, not a mosaic cell** — pulled the
  "I'm Erika Urano..." block out of the image flow into a `.mosaic-intro` overlay:
  absolutely positioned, horizontally centred, anchored near the top so it floats
  over the first rows and scrolls with the page. Frosted look via
  `background: rgba(250,249,247,0.78)` + `backdrop-filter: blur(12px)`, rounded,
  subtle border + shadow. Blur/opacity tuned so the ink text stays fully legible
  over any image behind it.

## Feedback round 3 (applied, redeployed to NEXT)

- **Films sub-nav sat lower than other pages** — caused by dead films-page critical CSS
  in `baseof.html` (`#body-content { padding: 2rem 0 }`, an ID selector overriding
  `.section-page` only on films). Removed the whole legacy films critical-CSS block and
  the dead `films-filter.js` loader.
- **Dropped the About page** — removed from nav + deleted `content/about/`. (Orphan
  static images under `static/about/images/` remain in the asset bucket; harmless.)
- **Home masonry now vertically justifies** — images are assigned to columns
  shortest-first, then each column's images are spread to fill to the same bottom line
  (like text justification, but vertical), so the tiles read as evenly spread instead of
  pooling whitespace at the bottom. Also applied Erika's reorder (images 3 & 4 moved
  after image 6). **Note:** gap size depends on column balance — if one column gets the
  tallest images its neighbours stretch more; can auto-balance (assign tallest to
  shortest column) for tighter even gaps if she prefers over hand-tuning the order.

## Feedback round 2 (applied, redeployed to NEXT)

- **Fonts** now match the Matsuya example: **Abel** (light narrow sans) for the name +
  page headings, **Source Code Pro** (mono) for nav / sub-nav / body. Both self-hosted
  (`themes/.../static/fonts/abel`, `.../source-code-pro`), matching the existing
  self-hosted pattern. Erika guessed "Celdum thin" — the actual example font is Abel.
  **Flag for review:** the whole body is now monospace (incl. the About bio), which is
  faithful to the template but a strong look; easy to keep mono only for nav/labels and
  use a softer face for long-form if she prefers.
- **Sub-nav** (second-level menu): centre-aligned, larger (1.05rem), and the current
  item gets a pill/circle outline instead of an underline. Primary nav still underlines.
- **Home:** added 4 images (cat-butterfly, all-eyes-pose, apple-and-pear,
  ton-poertefeuille) → 15 total; tightened the masonry gap (24→18 desktop, 16→12 mobile)
  to reduce whitespace.
- **Films page** now uses the Production Design layout (single-column, near-full-width
  tiles) instead of the masonry grid.

## Feedback round 1 (applied, redeployed to NEXT)

- **Home intro** is a fixed 2-column-wide box with photos flowing around it on all
  sides, via a small custom JS masonry (no third-party dependency; items absolutely
  positioned, images carry inline `aspect-ratio` so heights are known before load).
  Responsive column counts 4/3/2; on 2-col mobile the intro is full width with photos
  above/below. (Iterated here: CSS columns couldn't flank the box and CSS-Grid masonry
  left gaps, so a JS masonry was the right call — Shinichi confirmed.)
- **Production Design** reverted to near-full-width single-column tiles (max-width
  1100, centered) with L/R margin, instead of the 3-col grid.
- **About** added back to the primary nav (Video / Art / About / Contact).

## Needs action before PROD

1. **Contact form backend not wired.** `config.toml` has
   `formspree = "https://formspree.io/f/REPLACE_WITH_FORM_ID"`. Someone must
   create a free Formspree form pointed at `hello@erikaurano.com`, confirm the
   address once, and paste the real form id. Until then the form renders but
   submissions go nowhere. Email + LinkedIn on the contact page work now.
2. **5 production-design credits now appear nowhere.** Erika's rule moved PD-only
   films off the Films page, but these 5 have **no production-design photos** in
   the repo, so they can't be shown as image tiles: `almost-twenty`, `cupbap`,
   `elevator-pitch`, `feast`, `wip-commercials`. They were previously listed on
   Films as PD credits and are now dropped. Options for Erika: send stills, or
   decide to list them text-only somewhere. Flagging, not guessing.

## Decisions on the open questions (went with recommendations)

- **Q1 Video/Art nav:** default to the first sub-section (Video → Films,
  Art → Paintings). No separate "Sections: …" landing pages. Left sub-nav does
  the routing, matching her deck.
- **Q2 Willow crop:** cropped the frame/mat out for the **home mosaic only**.
  The Paintings page still shows the original framed scan. Review: want the
  cropped version on the Paintings page too? Right now it looks slightly
  different from the borderless works around it.
- **Q3 Tinto reel order:** `DaVHhvhxh1p` → "World Cup Match 2" (Colombia flag
  cover); `DaEIJbow9ES` → "World Cup Match 3" (games / flash tattoos / pregame).
  One-line swap in the two `content/social-video-editing/world-cup-*.md` files if
  reversed.
- **Q4 About gallery:** kept the existing photo gallery + playful captions
  ("set gremlin," etc.) as-is. Review: keep, or make it more buttoned-up for the
  hire-me positioning?

## Content changes

- **Films = wrote or directed only** (5): The Room without Walls, Ton
  Portefeuille, Nowhere to Hide, You Loved to Dance, Happy Go Lucky. Deleted the
  12 other `content/films/*.md`.
- **Civil Art** dropped from Films entirely (editing-only; she already has Civil
  Art posts under Social Media).
- **Dual-role dedupe:** The Room without Walls, You Loved to Dance, Happy Go Lucky
  removed from Production Design (they live on Films). PD now shows 6 PD-only
  entries; added a director credit line to each for the click-through bio.
- **Social Media:** tiles link straight to the Instagram post (no inline embeds —
  this also kills the blank-embed issue). Added the two new Tinto reels with
  covers pulled from Instagram and credit "Shot and edited by Erika Urano".
- **About bio** replaced with the approved rewrite. LinkedIn URL taken from the
  existing about layout: `linkedin.com/in/erikaurano/`.
- Site meta description updated to the new positioning.

## Theme / build

- New nav: name left; Video / Art / Contact + a LinkedIn icon (replacing the
  template's Instagram icon) right. Left sub-nav per bucket, current item
  underlined.
- Home is a CSS-masonry mosaic of the 11 approved stills with the intro copy as
  one cell among them. The old full-screen background-reel home was removed
  (`films/reel.mp4` no longer used; `config.toml` `params.films` is now unused but
  left in place — harmless).
- All new styling is in `themes/erikaurano-theme/static/css/retheme.css`, loaded
  after `style.css`. Had to override several headings that the old theme
  hardcoded white for its dark backgrounds (home title, film/art/PD single
  titles, gallery headings, About body/links/LinkedIn button) — they were
  invisible on the new off-white pages.
- Animation split to its own page at `/art/animation/` via `type: "animation"` +
  `layouts/animation/list.html`. Existing content URLs
  (`/art/drawings/*`, `/art/animation/*`, kept film singles) are unchanged.

## Verification done

- `hugo --gc --minify` clean. Generated-HTML assertions pass (film set, no social
  iframes, nav active states, sub-nav, mosaic count, PD bio, contact form, new
  bio, no old student framing).
- Visually screenshotted (headless Chrome, desktop + mobile): home, films, art,
  social, contact, PD single (bio confirmed), film single, about. All read
  correctly. Hover-reveal captions are hover-only so not visible in static
  screenshots, but the markup is verified.
