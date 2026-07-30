# Cloudtopia — Website

The official single-page presentation site for **Cloudtopia Entertainment Limited**,
the company behind the eco-themed children's app *Cloudtopia* (for ages 2–6).

Built as static **HTML + CSS + vanilla JS** — no frameworks, no build step.

---

## Open it locally

Just double-click **`index.html`**, or open it in any modern browser.
Everything (fonts, images, scripts) loads with no server required.

> Tip: for the cleanest experience you can also serve the folder, e.g.
> `python -m http.server` then visit `http://localhost:8000`.

---

## Deploy it

The site is fully static, so it hosts anywhere:

- **GitHub Pages** — push this folder to a repo, enable Pages on the branch root.
- **Netlify / Vercel** — drag-and-drop the folder, or point it at the repo. No build command; publish directory is the project root.
- **Own domain / any web host** — upload the files; `index.html` is the entry point.

No environment variables, no backend, nothing to configure.

---

## Project structure

```
Cloudtopia website claude/
├── index.html              ← the single-page site (v3)
├── css/styles.css          ← all styling (palette via CSS custom properties)
├── js/main.js              ← nav, reveals, lightbox, parallax, sundrop hunt, map zoom
├── assets/img/             ← optimized web images (WebP) used by the site
├── backup-old-site/        ← complete copy of v1 (local only, not in git) — open its index.html directly
├── backup-site-v2/         ← complete copy of v2 (local only, not in git)
├── Presentation Package/   ← original source art (kept, untouched)
├── optimize_assets.py      ← regenerates assets/img from Presentation Package
├── PROJECT_GUIDE.md        ← the design/content guide this site was built from
└── README.md               ← this file
```

---

## Regenerating images

All web images in `assets/img/` are produced from the originals in
`Presentation Package/` by the optimizer script (requires Python + Pillow):

```
python optimize_assets.py
```

What it does:
- **Masks the red "CHEATS" debug banner** off every in-app screenshot
  (12 mini-game shots + 3 room shots) by painting the clean scene/sky over it.
- Resizes + compresses everything to lightweight **WebP**
  (map ≈ 186 KB, gallery shots 28–73 KB, character cut-outs < 70 KB).
- Auto-trims the transparent border around character art.

Originals are never modified — rerun any time.

---

## Editing content

- **Copy & sections** live directly in `index.html` (clearly commented by section).
- **Colours, spacing, fonts** are CSS custom properties at the top of
  `css/styles.css` (`:root { --sky: …; --pink: …; --navy: …; }`) — change once, applies everywhere.
- **Contact email** (`henrik@cloudtopiaentertainment.com`) appears in the
  *Partner with us* button and the footer — a placeholder until the final address is confirmed.

---

## SEO & search engines

Live at **https://cloudtopiaentertainment.com** (GitHub Pages, `CNAME` in repo root;
`www.` 301-redirects to the apex domain).

- **`sitemap.xml`** — lists all 3 pages (`/`, `/partners/`, `/privacy-policy/`).
  Update `<lastmod>` when a page changes. Referenced from **`robots.txt`**.
- **Google Search Console** — property `https://cloudtopiaentertainment.com/`
  (URL-prefix), verified 2026-07-30 automatically via the domain provider on the
  company Google account. Sitemap registered; both content pages indexed.
  Search performance (impressions/clicks) lives here.
- **Bing Webmaster Tools** — site added and verified on the same account;
  sitemap submitted 2026-07-26 (status Success, 3 URLs).
- **IndexNow** — the key file `15723659dd7848e7c5647f38e07bbdc1.txt` in the repo
  root must stay deployed. After publishing content changes, ping Bing & friends:

  ```
  curl -X POST "https://api.indexnow.org/indexnow" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d '{"host":"cloudtopiaentertainment.com",
         "key":"15723659dd7848e7c5647f38e07bbdc1",
         "keyLocation":"https://cloudtopiaentertainment.com/15723659dd7848e7c5647f38e07bbdc1.txt",
         "urlList":["https://cloudtopiaentertainment.com/"]}'
  ```

- **No analytics by design** — the privacy policy promises "no analytics or
  tracking", so the site must stay script-free of trackers. Visitor-adjacent
  numbers come from Search Console / Bing Webmaster search-performance reports
  only. Adding real analytics requires updating `privacy-policy/index.html` first.
- On-page SEO (titles, descriptions, canonicals, Open Graph/Twitter cards,
  schema.org structured data) is maintained directly in each page's `<head>`;
  `404.html` is deliberately `noindex`.

---

## Notes / status

- The app is presented as **“Coming soon.”** App Store / Google Play badges are
  visual placeholders — swap them for real store links when the app launches.
- The animated series, kids' world and merchandise are framed as **future vision**,
  not existing products (per the project guide's positioning rule).
- Accessibility: semantic landmarks, alt text, keyboard-navigable lightbox with
  focus trap, skip link, visible focus states, and full `prefers-reduced-motion` support.
- Responsive from ~360 px phones up to large desktops.
- **Naming:** the **app is "Cloudlings"** (named after the four little heroes); the
  **company and wider IP/world are still "Cloudtopia"** (Cloudtopia Entertainment Limited).
  The hero shows the real Cloudlings logo (`assets/img/logo_cloudlings.webp`); "Cloudtopia"
  remains the world, company and footer brand throughout.
- **Social sharing:** `assets/img/og_cover.jpg` (1200×630) is a branded preview card —
  it's what shows as the thumbnail when the link is pasted into Messenger, WhatsApp, etc.
- **v2 (2026-06-12):** full redesign pass — real logo, sundrop hunt mini-game,
  tap-to-transform cloudlings, pointer parallax hero with sun rays, rainbow scroll
  trail, zoomable world map, character speech bubbles, real mini-game names, roadmap
  path, shooting star, structured data (SEO), image `width/height` for layout stability.
  The previous version is preserved untouched in `backup-old-site/`.
- **v3 (2026-07-14):** visual redesign to match the Cloudlings app pitch deck —
  Sniglet ExtraBold bubble headlines, Quicksand body (web stand-in for the deck's
  Linotte), Chewy badges, sky-blue palette, white cloud cards with puffy bumps,
  pink page-number chips, and the title-slide hero (world map + white cloud title
  bar). All v2 interactions kept. The v2 design is preserved in `backup-site-v2/`
  (local only, per the backup-first convention).

---

© Cloudtopia Entertainment Limited.
