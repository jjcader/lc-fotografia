# CLAUDE.md — handover for LC Fotografia website

Read this first. It records what has been decided so far and why, so you don't re-litigate settled choices.

## The project

- Website for **LC**, the user's father, a professional photographer in Poland.
- Focus: **corporate photography and portraits** (business portraits, personal-branding sessions, team photos, executive portraits, workplace photos) **plus private portrait sessions for ordinary people** ("Sesja portretowa", added 2026-11-11 at user's request). **Not** large-scale events.
- **All site copy is in Polish.** Talk to the user in English unless they switch; write site text in natural Polish.
- Style brief from the user: minimalist, few flashy effects, but clean and professional, not dated. Photos are the hero.
- The user (the photographer's son) builds and iterates on it; expect many small rounds of changes. Current state: **v0.1, structure and design done, real content missing.**

## Decisions already made (keep unless the user changes them)

| Topic | Decision | Why |
|---|---|---|
| Homepage structure | "Option B: service paths": hero with booking button → client logos → "Oferta" (3 paths: Portret biznesowy / Sesja portretowa (private) / Zespoły i zarządy) → portfolio → 4-step process → reviews ("Opinie") → about teaser → FAQ → contact form | Pattern from corporate headshot studios (e.g. Organic Headshots, Chicago): speaks to company buyers, best for SEO, clearest path to booking |
| Desktop look | "Version 1 — Jasna": white background, one sans-serif (Instrument Sans), black square buttons, split hero (headline left, portrait right), 3 photo cards for services | Chosen by user from 3 styled variants (Light / Graphite-dark / Editorial-serif) |
| Mobile look | **Deliberately different, denser layout** (user request): headline + both buttons first, then a swipeable strip of 3 smaller portraits; services as rows with thumbnails; 2–3 photos per gallery row; reviews swipe sideways; small about photo next to name; sticky "Zarezerwuj sesję" + call bar at bottom that hides when the form is visible | User wants more content per phone screen |
| Gallery | Justified rows (equal-height rows, no cropping), not masonry | Tidier for portraits; masonry looks cluttered |
| Prices | "od [cena] zł" for individuals, "Wycena indywidualna" for companies | **Subject to change** (user said so) |
| Booking | Separate **Rezerwacja** page (`rezerwacja.html`). "Termin" = choice **Konkretny / Elastyczny** on one line, field below on the next: native date picker (konkretny) or free text (elastyczny); only the chosen field is shown and sent (both named `termin`). No "Pora dnia". Kontakt page = details + Google map. Online calendar/deposit **later** | User asked for separate pages (2026-11-11) |
| Copy length | Headings, labels, buttons and links: 1–2 words wherever a sentence can be replaced ("Opinie", "Pytania", "Przebieg sesji"). Every page and section has a plain title (h1 on subpages, h2 in sections, e.g. "O mnie"), no eyebrow label; only the homepage hero keeps one. Meta titles/descriptions stay descriptive for SEO | User request (2026-11-11): succinctness, matching titles |
| Spacing | Tight vertical rhythm: `--section` max 4.5rem, hero/page-head top max 3.5rem | User: less dead space above section headings |
| Map | Google Maps iframe on Kontakt (`maps_embed_url`, no API key, normal colors; user rejected grayscale). Address is currently a **dummy: Rynek, Wrocław** | User request; privacy policy point 7 mentions it |
| Client galleries | External tool (e.g. Pixieset) linked from footer "Strefa klienta" | Don't build proofing/downloads ourselves |
| Portfolio categories | Placeholder set: biznesowe, wizerunkowe, prywatne, zespoly, zarzad, w-pracy | User will decide real ones later |
| Dark mode | None, by choice | Single approved light look |

## How the code works

Dependency-free static site, built with one Python script (Python 3 stdlib only).

```
site.json          business data, inserted as {{key}} (phone, email, city, city_in (Polish locative, e.g. "we Wrocławiu"), NIP, URLs, maps_url, maps_embed_url, form_endpoint, allow_indexing)
build.py           renders src/ → dist/, copies public/ → dist/, writes sitemap.xml + robots.txt
publish.sh         builds, then publishes dist/ to the gh-pages branch (see Hosting)
src/layout.html    shared <head>, header, footer; {{content}} = page body
src/partials/*.html  {{> name}} includes: header, footer, mobilebar, lightbox, form_short, form_full, cta, logos, arrow, fonts
src/pages/*.html   one file per page; first thing in the file is an HTML comment holding JSON page meta
public/            css/style.css, js/main.js, img/, favicon.svg (copied as-is)
dist/              GENERATED. Never edit by hand. Gitignored.
```

Page meta keys (JSON in the leading comment): `title`, `description` (both may contain `{{vars}}`), `nav` (`portfolio` | `oferta` | `omnie` | `kontakt` | `rezerwacja`, marks the active menu item / booking button), `book_href` (default `rezerwacja.html`; home uses `#kontakt`), `lightbox` (true → include photo viewer), `mobile_bar` (false → no sticky bar), `noindex`.

Template rules: `{{var}}` names are `\w+` only (no hyphens). Unknown var → build fails with a Polish error message. Includes resolve before vars; vars resolve up to 3 levels deep.

Pages: `index`, `portfolio`, `oferta`, `o-mnie`, `kontakt`, `rezerwacja`, `strefa-klienta`, `polityka-prywatnosci`, `404`.

### CSS (`public/css/style.css`)
- Design tokens at the top of `:root` (colors, type scale with `clamp()`, `--gutter`, `--section`, `--header-h`). Use tokens, not literal colors.
- Breakpoints: 960px (tablet), 860px (hamburger menu), 720px (phone). **All phone-specific layout lives in the last `@media (max-width: 720px)` block.**
- Square corners everywhere (no border-radius except round icon buttons in the lightbox). Black primary buttons, outlined secondary.
- Justified gallery = flexbox with `flex-grow: var(--r)` and `flex-basis: calc(var(--r) * var(--base))`; `--r` = width/height. `.gallery--fill::after` stops the last row from stretching (always on for phone).
- Safe-area insets are respected (sticky header, mobile bar, lightbox).
- A self-hosted `@font-face` block is commented out at the top, ready for when font files are added.

### JS (`public/js/main.js`, vanilla, no build step)
Mobile menu (`[data-nav-toggle]`, `[data-mobile-menu]`), sticky bar hiding (`[data-mobile-bar]` + IntersectionObserver on `#kontakt`/`#formularz`), `--r` from image natural size, portfolio filter (`[data-filters]`, `[data-filter]`, `.g-item[data-cat]` space-separated, `[data-cat-intro]`, hash `#zespoly`), lightbox (`<dialog data-lightbox-dialog>`, photo fills the screen with `object-fit: contain`, buttons float over it; arrows/keys/swipe, swipe down or click beside the photo closes), termin switch (`[data-termin]` radios show/enable one `[data-termin-field]`), date fields (`input[type=date][data-min-today]` get `min` = today), forms (`[data-form]` POSTs FormData to `data-endpoint`; empty endpoint → shows "call or email" message; honeypot field `website`).

## Conventions

- Polish copy: plain, concrete, direct. Avoid em-dash asides and marketing fluff. Use "Ty/Twój" for individuals, "Wy/Wasz" when addressing companies.
- Placeholder images are plain gray boxes (no silhouettes, user request).
- Placeholders use `[square brackets]`. Don't invent facts about the photographer (years, clients, awards, prices). Leave or add a placeholder instead.
- Photos: always set real `width`/`height`, meaningful Polish `alt`, `loading="lazy"` except the hero. Gallery items need `href` (large version), `data-caption`, `data-cat`, `style="--r:…"`.
- Keep it dependency-free unless the user asks otherwise. No frameworks, no npm.
- Accessibility basics: real buttons/links, labels on inputs, visible focus, 44px tap targets, `prefers-reduced-motion` respected.
- After every change: `python3 build.py`, then check `dist/` in a browser at desktop width **and** ~390px phone width.
- Local preview: `python3 -m http.server 8000 -d dist` → http://localhost:8000

## Hosting (test phase)

- `site.json` → `"allow_indexing": false` makes every page `noindex` and robots.txt `Disallow: /`. **Flip to true only at real launch.**
- **Live:** https://jjcader.github.io/lc-fotografia/ (repo `jjcader/lc-fotografia`, public). All links are relative, so it works under the `/lc-fotografia/` subpath.
- **How it deploys:** Pages serves the **`gh-pages` branch** ("Deploy from a branch", `/ (root)`). `sh publish.sh` builds and commits a fresh `dist/` (+ `.nojekyll`) onto `gh-pages` through a temporary worktree, and does nothing if the build hasn't changed. The user's "push" means: commit + `git push` on `main`, then `sh publish.sh`.
- **Why not Actions:** since Nov 2026 the user's GitHub account is "locked due to a billing issue" (free account, nothing owed, no payments ever). Custom workflow jobs don't start, but GitHub's built-in `pages-build-deployment` still runs. `.github/workflows/deploy.yml` is kept but only runs manually. To switch back once it's fixed: restore its `push` trigger and run `gh api -X PUT repos/jjcader/lc-fotografia/pages -f build_type=workflow`.
- Alternative: Netlify connected to the repo (works with private repos); `netlify.toml` already sets build command and publish dir.
- If an Actions step warns about a deprecated action version, bump it.

## Backlog / open items

Content (needs the user or the photographer):
- [ ] Real photos (20–30 to start), logos, reviews, prices, bio, studio description, real categories
- [ ] Fill `site.json` (name, phone, email, address, NIP, REGON, domain, social URLs, `city_in`). The address and both map URLs currently point to a dummy (Rynek, Wrocław). For the real pin: Google Maps → Udostępnij → Umieść mapę, copy the `src` into `maps_embed_url`
- [ ] Review draft texts: offer page, FAQ answers, "Jak pracuję" principles, client zone steps

Technical:
- [ ] Form endpoint (Formspree or an EU alternative / Netlify Forms) → `site.json` `form_endpoint`; update privacy policy with the provider
- [ ] Self-host Instrument Sans (latin + latin-ext woff2) in `public/fonts/`, enable the `@font-face` block, remove Google links in `src/partials/fonts.html` (RODO)
- [ ] Image pipeline: optional Pillow step in build.py generating WebP + `srcset` sizes (would be the first dependency, ask first)
- [ ] `og:image` (1200×630) once real photos exist
- [ ] 404 page uses relative links; fine at the site root, breaks on nested paths
- [ ] Later: online booking (e.g. Cal.com/Calendly embed or a booking system with deposits), privacy-friendly analytics (affects privacy policy), maybe separate URLs per portfolio category for SEO
- [ ] Privacy policy is a template; it should be checked by a lawyer before launch
- [ ] Map loads Google directly (IP + possible cookies). Stricter RODO option: click-to-load map placeholder

## Reference (created in claude.ai, private to the user's account)

- Design canvas with the 4 layout options, 3 style versions and the phone comparison: https://claude.ai/artifact/GpQcCe3UiNrDgvG9SKB9es
- Clickable preview of v0.1: https://claude.ai/artifact/QTajZzzzU2gQMtjDwU2dg3
