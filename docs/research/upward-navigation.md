# Upward-navigation feasibility

Original report: 2026-10-07. Independent source verification: 2026-10-07.

## Conclusion

Starting at the document bottom and using ordinary upward scrolling is feasible. The earlier temporary Chromium experiment demonstrated the basic behavior, including touch emulation. The main composition constraint is that upward traversal through conventional sections reveals their endings first.

This supports the botanical roots-to-sunlit-treetop journey in [the working brief](../portfolio-direction.md). Following this research, the user selected a continuous ascent adapted for entry from below: section introductions at the lower edge, with normally readable content blocks arranged above. The subsequent implementation and its browser findings are recorded at the end of this report. The reference's typography, spaciousness, and motion are design inspiration; the initial findings below concern navigation feasibility.

## Independent verification scope

This retry checked the existing report against current MDN documentation through Context7 (`/mdn/content`) and directly retrieved MDN, WHATWG, CSS Working Group, and W3C sources. Source facts, recommendations, and the earlier experiment's observations are distinguished below.

The original scratch script, `/tmp/opencode/upward-navigation-check.cjs`, and its Playwright dependency, `/tmp/opencode/reference-browser/node_modules/playwright`, were both absent during this verification. Consequently, the exact earlier implementation could not be independently inspected or replayed from those artifacts. The measurements below are retained as previously recorded observations, not new measurements. The original report does not record a browser version or raw trace.

No new browser experiment was necessary to re-establish the basic mechanism or the tall-section geometry. The remaining runtime questions concern restoration paths, eventual content/layout, other browsers, and assistive technology; repeating the same controlled Chromium checks would not establish those results.

## Platform evidence

### Bottom-first entry and normal scrolling

**Source facts.** `window.scrollTo()` accepts document coordinates and an `instant` behavior. In a normal downward-overflow viewport, CSSOM View clamps the requested vertical coordinate to the available scroll range. Requesting the current document height therefore reaches its current bottom. In standards mode, `document.scrollingElement` identifies the root element that scrolls the document. [MDN: scrollTo parameters](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo#parameters), [CSSOM View: Window.scroll](https://drafts.csswg.org/cssom-view/#dom-window-scroll), [MDN: scrollingElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollingElement)

Native scrolling can be driven by wheel/trackpad, keyboard, and scrollbar interaction. A wheel event does not necessarily scroll, and its deltas are not a reliable substitute for measuring actual scroll-position changes. Browsers handle touch panning and pinching by default; moving toward the document top uses a downward finger drag, as MDN explicitly explains for `pan-up`. [MDN: wheel event](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event), [MDN: touch-action values](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action#values)

**Recommendation.** Use ordinary document scrolling as the baseline candidate: positioning at the roots changes the starting location, without needing to invert input gestures. The recorded experiment covers an upward wheel movement, Page Up, and an emulated downward finger swipe. Tab navigation is a separate focus-order question, not an equivalent scrolling command.

### Reversed wrapper versus reversed scroll container

**Reported arrangement.** The experiment used a normal document scroller and a separate, non-scrolling flex wrapper that visually stacked sections in reverse order. Its source sequence was roots, about, projects, photos, treetop; its visual top-to-bottom sequence was treetop, photos, projects, about, roots. Content inside each section retained ordinary heading-first order. This is a candidate arrangement, not the selected section sequence or architecture.

**Source distinction.** `flex-direction: column-reverse` controls the direction of item layout. The Flexbox specification separately notes that reversal can change initial scroll position when the flex container **is also a scroll container**, depending on alignment. An upward-overflowing reversed flex scroller can have `scrollTop = 0` at its bottom and increasingly negative values toward its top. MDN also documents Safari overscroll values outside the usual range. These are not the coordinate assumptions of the tested normal document scroller, whose positive `scrollY` decreased during ascent. [CSS Flexbox: flex-direction](https://drafts.csswg.org/css-flexbox-1/#flex-direction-property), [MDN: scrollTop value](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop#value)

**Implication.** Reversing an inner wrapper does not by itself reverse the document's scroll origin. Making the scrolling element itself a reversed flex container is a different candidate and cannot inherit the experiment's coordinate/restoration findings without testing.

### Initial navigation, reloads, and history

**Source facts.** `PerformanceNavigationTiming.type` distinguishes `navigate`, `reload`, and `back_forward`. Here, `navigate` includes links, typed URLs, form submissions, and certain script navigations; it does **not** identify a visitor's first-ever visit. [MDN: navigation type values](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type#value)

`history.scrollRestoration = "auto"` assigns restoration to the browser; `manual` assigns it to the page. WHATWG describes restoration as an attempt that may be repeated while content loads, normally stopping after user scrolling. It also warns that disabling restoration does not imply any particular initial position. Thus, `auto` is a restoration mechanism, not a cross-browser guarantee of an exact coordinate under changing layout. [MDN: scroll restoration](https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration), [WHATWG: restoring persisted state](https://html.spec.whatwg.org/multipage/browsing-the-web.html#restore-persisted-state), [WHATWG: restoring scroll position data](https://html.spec.whatwg.org/multipage/browsing-the-web.html#restore-scroll-position-data)

`pageshow` fires on ordinary entry and on back/forward-cache restoration. On `pageshow`, `persisted = true` identifies reuse of the retained document; `false` alone does not distinguish a new navigation from a reload or an uncached history return. A navigation-timing check alone is not a complete bfcache guard. The earlier Back observation did not assert which cache path ran. [MDN: pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event), [WHATWG: PageTransitionEvent](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-pagetransitionevent-interface)

### Fragment links

**Source facts.** Native fragment navigation locates the target, scrolls it into view with block-start alignment, runs focusing steps, and moves the sequential-focus navigation starting point. Same-document fragment navigation is its own path and need not reload the document. This is more than assigning a numeric scroll position. [WHATWG: scrolling to a fragment](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-the-fragment-identifier), [WHATWG: fragment navigations](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-fragid)

An empty fragment (`#`) means the document top; `#top` also does when it matches no element. In this layout, that physical top is the treetop. A missing fragment and an empty fragment both produce an empty `location.hash`, so a `!location.hash` check alone cannot distinguish them. [WHATWG: fragment target selection](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-the-fragment-identifier), [WHATWG: Location.hash getter](https://html.spec.whatwg.org/multipage/nav-history-apis.html#dom-location-hash)

**Recommended navigation contract:**

| Entry or action | Intended behavior |
| --- | --- |
| New document navigation with no fragment and no restoration to honor | Position at the current roots/bottom once initial geometry is ready. |
| Explicit incoming fragment or in-page section link | Honor the native target; do not replace it with roots initialization. |
| Reload or history return, including a URL that still contains a fragment | Preserve the visitor's position through browser restoration; avoid unconditionally replaying the fragment or roots initialization. |
| `pageshow` with `persisted = true` | Keep the resumed view rather than reinitializing it. |

This is a proposed behavior contract, not a proven cross-browser initialization algorithm. In particular, the earlier test did not cover scrolling away from a fragment and then reloading/returning. If initialization waits asynchronously for layout, recheck that the visitor has not scrolled, moved focus, or navigated before applying it. Any eventual framework router must integrate with the same contract.

### Stable content dimensions

**Source facts.** Correct image `width` and `height` attributes provide an aspect ratio before loading, allowing space to be reserved. An incorrect ratio can still change when the real image arrives. Web fonts can also cause layout shifts. These affect document height and section positions, which are particularly important for a bottom entry point. [MDN: preventing image-loading jank](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Performance/Multimedia#rendering_strategy_preventing_jank_when_loading_images)

`DOMContentLoaded` does not wait for images; even `window.load` excludes lazily loaded resources. `document.fonts.ready` resolves after the relevant font-loading/layout work completes, but the CSS Font Loading specification explicitly allows further font loads after a given promise fulfills. No single one of these events establishes permanent layout stability. [MDN: DOMContentLoaded](https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event), [MDN: load event](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event), [CSS Font Loading: ready attribute](https://drafts.csswg.org/css-font-loading/#font-face-set-ready)

Scroll anchoring attempts to keep a selected visible node stable across layout changes by adjusting scroll position. It is not a promise to remain at the document bottom. [CSS Scroll Anchoring: description](https://drafts.csswg.org/css-scroll-anchoring/#description)

**Recommendation.** Reserve predictable image/illustration space, account for fallback and final font metrics, and establish the initial geometry before roots positioning. Treat image completion and font readiness as inputs to that decision, rather than repeatedly forcing the visitor back to the bottom. The recorded reserved-image result does not validate late fonts, unreserved content, resizing, or first-paint behavior on a slow connection.

### Reading and focus order

**Source facts.** Flex reversal alone changes visual placement, not source, speech, or default sequential navigation order. This statement assumes normal reading flow and no separate focus-order overrides. CSS now also has a `reading-flow` property specifically intended to change speech and sequential navigation order; MDN marks it experimental. Reversal alone and explicit reading-order overrides are distinct mechanisms. [CSS Flexbox: flex-direction](https://drafts.csswg.org/css-flexbox-1/#flex-direction-property), [CSS Flexbox: reordering and accessibility](https://drafts.csswg.org/css-flexbox-1/#order-accessibility), [MDN: reading-flow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-flow)

WCAG requires a programmatically determinable correct reading sequence where sequence affects meaning, and focus order that preserves meaning and operability. W3C's explanatory guidance allows more than one meaningful sequence and does not require focus to follow visual coordinates in every layout. Consequently, reversal is neither an automatic accessibility failure nor proof of accessibility. [WCAG 2.2: meaningful sequence](https://www.w3.org/TR/WCAG22/#meaningful-sequence), [WCAG 2.2: focus order](https://www.w3.org/TR/WCAG22/#focus-order), [W3C: meaningful-sequence guidance](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html#intent), [W3C: focus-order guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html#intent)

**Recommendation and implication.** A roots-to-treetop source sequence, ordinary heading/paragraph/control order inside each section, and explicit section navigation remain a plausible candidate. This can make focus advance upward between stages but downward within a stage; it needs to make sense to sighted keyboard users as well as screen-reader users. The first-Tab observation only establishes where one focus move landed. Full Tab/Shift+Tab traversal, reading order, section-link focus behavior, and assistive-technology use remain unverified.

## Earlier browser experiment: retained observations

Reported environment: Playwright-managed Chromium; desktop viewport 1280 x 800 and mobile touch emulation at 390 x 844. The test page contained five stages, an intentionally two-screen About section, and a dimension-reserved image. The original temporary tooling is identified in the verification-scope section above.

| Check | Previously recorded result |
| --- | --- |
| Fresh entry at document bottom | `scrollY = 4400`, document height `5200`, viewport height `800` |
| First Tab | Focused the roots link; position remained `4400` |
| Upward wheel movement | `scrollY` decreased from `4400` to `3800` |
| Page Up | Position decreased to `3100` |
| Reload | Restored position `3100` |
| Navigate away, then Back | Restored position `3100`; cache path was not separately asserted |
| Direct `#projects` link | Projects section aligned with viewport top |
| Late-loading image with reserved dimensions | Document height and scroll position stayed unchanged |
| Downward finger swipe, moving toward earlier content | Mobile-emulated `scrollY` decreased from `4415` to `4036` |
| Enter tall About section by scrolling upward | Heading was about `954px` above the viewport; final paragraph was visible at `541px` |

These results cover a controlled Chromium document. Touch emulation is not Safari/Firefox, physical-mobile, or screen-reader validation. Neither bfcache versus uncached restoration, the complete keyboard journey (including Home/End and arrow keys), late-font layout, first-paint flicker, nor framework routing was established by this experiment.

## Design decision exposed by the experiment

A literal upward journey and a long, normally ordered section pull in different reading directions. In the tested two-screen About section, the visitor encountered its final paragraph before its heading. This follows from entering a top-to-bottom section through its bottom edge; changing source order between sections does not solve it. Once at its heading, ordinary reading proceeds downward through that section. The same issue can affect initial roots entry if that stage grows taller than the viewport.

Initial options presented for discussion:

1. **Compact ascent stages with separate detail views.** Each stage introduces its content; longer project details and photography collections open in dedicated views with ordinary reading flow. The earlier report provisionally recommended this. Its tradeoff is a more compact main journey and extra navigation to details; it has not been selected.
2. **Continuous tall sections.** Preserve a spacious, extended composition, but natural upward entry exposes each section's ending first. Heading-aligned navigation helps when explicitly selected; it does not change free-scroll entry, and reading long sections still requires downward movement.
3. **Guided stage transitions.** Move between heading-aligned stages with additional interaction logic. This requires a design for long content, free scrolling, history, focus, keyboard/touch behavior, and motion preferences; ordinary upward scrolling alone does not provide these transitions.

Whatever is selected must accommodate narrow screens, zoom, and larger text; even a nominally compact stage may become taller than the viewport. Clipping essential content to force a fixed height is not a solution. WCAG's reflow and text-resize requirements provide relevant constraints. [WCAG 2.2: reflow](https://www.w3.org/TR/WCAG22/#reflow), [WCAG 2.2: resize text](https://www.w3.org/TR/WCAG22/#resize-text)

The platform evidence alone does not choose among these presentations or establish which best helps a prospective client understand the projects, photographs, and freelance offer. The user's subsequent choice is a continuous ascent with section introductions at the lower entry edge and individual content blocks arranged above them, retaining ordinary reading order inside each block. See the working brief for the agreed direction; actual readability during ascent still needs validation with the designed content and responsive layout.

## Subsequent implementation findings

The implemented site has a repeatable browser check in `tests/browser.cjs`. Two behaviors required more than the initial feasibility experiment:

- Reveal animations translate section headings. Section-link destinations must use their underlying layout positions rather than the animated bounding rectangles; otherwise a first visit lands approximately 16px off target.
- In the tested Playwright WebKit engine, a reload of a fragment URL reapplied the fragment after a programmatic restore, even with manual scroll restoration. The implementation temporarily removes the incoming fragment during initialization, reinstates its URL without triggering native fragment navigation, and applies the selected entry/restored position after initial layout. History entries store the reading position and selected photo category.
- Firefox's reload could capture history state before the departing page's final `pagehide` update. A session-storage snapshot keyed to the individual history entry preserves that final reading position, with history state as the fallback when storage is unavailable.

The original measurements above remain historical observations. The repeatable checks exercise the implemented page and distinguish fresh entry, section links, refresh, history traversal, and filtered-gallery state.
