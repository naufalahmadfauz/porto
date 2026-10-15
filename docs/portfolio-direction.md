# Portfolio direction

Approved first-version brief from the design conversation. The user confirmed the shared understanding, and the static implementation is now present in this repository.

## Purpose

- Primary goal: attract freelance clients.
- Lead with freelance website work.
- Present photography as a personal creative showcase.

## Reference

[yivani.dev](https://yivani.dev/) is the reference for typography, spacious editorial layouts, animation style, and an atmospheric journey through the portfolio.

## Agreed direction

- A recognizable tree connects the experience.
- Visitors begin at the roots at the bottom of the page and physically scroll upward toward the treetop.
- The atmosphere progresses from earthy, shaded roots through rich forest greens to a softly sunlit canopy.
- The reference's typography, layout, and motion language provide the design baseline.

## Opening and navigation

- The opening view is the Roots introduction at the actual bottom of the document.
- On ordinary entry, the page is already positioned at the bottom; the browser's scrollbar thumb reflects that position wherever it is displayed.
- Visitors scroll upward to climb toward the treetop using ordinary scrolling gestures.
- Use a continuous ascent, with each section introducing itself at its lower entry edge and its content arranged above it.
- Individual text blocks and project cards retain ordinary reading order. Their arrangement adapts the reference's spacious composition to discovery from below.

## Stages in ascent order

| Stage | Content |
| --- | --- |
| Roots | Opening introduction |
| Trunk | About the owner, skills, and website services |
| Branches | Programming projects |
| Canopy | Photography showcase |
| Treetop | Contact |

## Contact

- Offer both email and WhatsApp for prospective clients.
- Make contact shortcuts available throughout the climb, as well as at the Treetop destination.
- Actual contact details can be replaced alongside the other placeholder content.

## Provisional art direction

A detailed, gently stylized botanical illustration, with textured bark, layered leaves, dappled light, and subtle depth through movement. The user explicitly considers this choice open to later revision.

The accepted composition places the trunk along the right side, with branches framing the content. Roots spread across the opening, and foliage gradually fills the upper sections. Large typography and project layouts retain clear space beside the tree.

The October 14 refinement uses fluid side gutters on wide monitors, scaling the typography and tree with the available space. The palette remains forest green with slightly brighter shadows and foliage highlights.

## Mobile composition

- Preserve the bottom-first opening and upward climb on phones.
- Stack content into a readable narrow-screen layout.
- Keep a slimmer tree along the right edge, giving text and photographs most of the screen.
- Use inline project previews and full-color photographs for touch interaction, as specified below.

## Motion

- Gentle leaf movement, drifting pollen, dappled light, and subtle scroll reveals create the forest atmosphere.
- Implement lightweight effects with CSS and JavaScript; the leaf breeze uses self-hosted Anime.js 4.3.0.
- Retain native scrolling.
- Reduce decorative movement in response to the visitor's reduced-motion preference.

## Initial content

- Replaceable placeholder images.
- Sample names and copy, including lorem ipsum where useful.
- Project screenshots and final personal content will be supplied or replaced later.
- Samples are draft portfolio content, not established facts about the owner or completed client work.

## First-version scope

### Projects

- Six placeholder projects presented on the main page.
- Each entry has a preview image, name, short description, technology tags, and demo/source-link slots.
- Desktop uses a changing shared preview alongside the project entries, following the reference.
- Mobile places the relevant preview image within each project entry.

### Photography

- Twelve placeholder photographs with editable categories.
- Category filtering and a full-screen photo viewer.
- Grayscale images reveal color on desktop hover; touchscreen images appear in color.

### Profile

- A replaceable portrait and concise biography.
- A website-services introduction and skills list.
- A GitHub profile link.

## Technical direction and editing

- Plain HTML, CSS, and JavaScript, with a simple static-file deployment.
- Content is edited in clearly organized project files; images are replaced in an asset folder.
- The user prefers this file-based workflow over an editing dashboard and wants to keep the project simple.

## Hosting

- Target GitHub Pages, GitHub's static website hosting service.
- The existing repository is `naufalahmadfauz/porto`; its conventional project-site address would be `https://naufalahmadfauz.github.io/porto/` once published with default settings.
- Asset references must work under the `/porto/` project-site path.

Source: [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

GitHub-side publishing settings have not been checked or changed; nothing has been published during this planning session.

## Confirmation status

The design discussion is complete and the first version has been implemented. The botanical art direction and placeholder content remain intentionally replaceable.

## Implementation map

- `index.html`: the five-stage document, navigation/dialog structure, and inline tree SVG with independently animated leaf clusters.
- `styles.css`: responsive composition, forest atmosphere, and motion preferences.
- `content.js`: editable identity, contact details, services, skills, projects, and photography.
- `script.js`: upward entry, section navigation, history-position restoration, project selection, filters, photo viewing, and visibility-aware leaf motion.
- `assets/`: self-hosted fonts, Anime.js, placeholder illustrations, project previews, and credited sample photography.
- `tests/browser.cjs`: optional browser-level checks for the unusual navigation and interactive features.
- `README.md`: local preview, content replacement, and GitHub Pages publishing instructions.

## Verification

- Automated navigation, project-preview, gallery, contact, and history checks passed in Playwright Chromium, Firefox, and WebKit.
- Responsive layouts were checked from 320px to 3840px wide, including the reported 3440px ultrawide composition; the native upward touch gesture was exercised in Chromium mobile emulation.
- Leaf movement, offscreen pausing, and changes to reduced-motion preferences are covered by the browser checks. Direct-file animation and navigation without the animation library were also checked in Chromium.
- The site was checked under the `/porto/` project-hosting path and by opening `index.html` directly.
- Local asset references, SVG markup, and JavaScript syntax checks passed.

## Supporting notes

- [Glossary](../GLOSSARY.md)
- [Upward-navigation feasibility](research/upward-navigation.md)
