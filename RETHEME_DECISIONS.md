# Matsuya-Fluid re-theme — decisions & review notes

Branch `matsuya-fluid-retheme`. Built and deployed to NEXT for review. This logs
every judgment call made while running autonomously, plus the things that need a
human before PROD.

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
