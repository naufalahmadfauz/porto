# Roots — a portfolio that grows upward

A plain HTML, CSS, and JavaScript portfolio. Visitors arrive at the roots, at the bottom of the page, and scroll upward through a developer’s work and photography toward the treetop.

## Preview locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. There is no build step or application dependency installation. Anime.js 4.3.0 is bundled locally in `assets/vendor/` for the leaf animation.

## Make it yours

- **`content.js`** — name, introduction, biography, services, skills, projects, photographs, and contact details.
- **`assets/images/`** — replace the sample photographs with your own.
- **`assets/projects/`** — replace the six illustrated website previews with your screenshots.
- **`assets/portrait.svg`** — replace the portrait, then update `portrait` and `portraitAlt` in `content.js`.
- **`index.html`** — section titles, supporting copy, page description, document structure, and the inline tree illustration. Each `data-sway` value sets a leaf cluster’s maximum rotation in degrees.
- **`styles.css`** — colors, typography, layout, responsive behavior, and atmosphere.
- **`script.js`** — navigation, project previews, photo filters, lightbox, contact links, and the Anime.js leaf breeze. Offscreen foliage pauses; reduced-motion preferences disable the breeze immediately.

Set `email` to your email address, `whatsapp` to your international phone number using digits only, and `github` to your profile URL. Empty values show a local placeholder explanation rather than sending visitors to a made-up account. Project `live` and `code` links work when filled in.

Photo categories and counts come from `photos` automatically. Use `shape: "portrait"` or `shape: "landscape"` to select the gallery crop, and write a useful `alt` description for every image. Project and photograph paths are relative to `index.html`.

All example names, projects, and photographs are **placeholder content**. Update the sample-content captions in `index.html` and `script.js` when replacing them with your own work.

## Publish on GitHub Pages

1. Push the site files to the repository’s `master` branch.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select **master** and **/ (root)**, then save.

With this repository’s default name, the site address is `https://naufalahmadfauz.github.io/porto/`. All asset URLs are relative, so the `/porto/` project path works. `.nojekyll` lets Pages serve the static files directly. GitHub-side publishing has not been enabled by this implementation.

## The upward journey

- The source/keyboard reading sequence is Roots → Trunk → Branches → Canopy → Treetop.
- Sections are arranged upward visually, with introductions at their lower entry edges. Text inside each block reads normally.
- A fresh visit without a fragment starts at the roots. Section links enter through their introductions. Each history entry records the reading position and photo filter so refresh and Back restore the same view.
- Native scrolling, touch gestures, keyboard navigation, and reduced-motion preferences are respected.
- The gallery and menu use native dialogs with Escape and focus restoration.

Design notes: [`docs/portfolio-direction.md`](docs/portfolio-direction.md). Terminology: [`GLOSSARY.md`](GLOSSARY.md).

## Optional browser checks

The checks in `tests/browser.cjs` start their own local server and cover upward entry, section links, history restoration, gallery interactions, responsive layouts from 320px to 3840px, connected foliage throughout its sway range, leaf motion and live reduced-motion changes, and the `/porto/` hosting path. The website does not need these tools to run.

Install Playwright outside the project, then run a browser check:

```sh
npm install --prefix /tmp/opencode/porto-checks playwright
/tmp/opencode/porto-checks/node_modules/.bin/playwright install --with-deps chromium
PLAYWRIGHT_PATH=/tmp/opencode/porto-checks/node_modules/playwright node tests/browser.cjs chromium
```

The same check accepts `firefox` or `webkit` after installing that engine. Set `CHECK` to part of a check's name to run it alone.

## Credits and license

Visual inspiration: [yivani.dev](https://yivani.dev/). Tree illustration, portrait placeholder, and project-preview illustrations were created for this portfolio. Sample photographs are from Unsplash; see [`assets/CREDITS.md`](assets/CREDITS.md). Fonts are self-hosted with their SIL Open Font License files.

Project source follows the existing [AGPL-3.0 license](LICENSE). Third-party assets retain their own licenses.
