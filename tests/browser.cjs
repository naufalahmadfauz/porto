// Optional browser checks; the website's runtime assets are all self-hosted.
// PLAYWRIGHT_PATH may point to a Playwright installation outside this repository.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const playwright = require(process.env.PLAYWRIGHT_PATH || "playwright");

const engine = process.argv[2] || "chromium";
const root = path.resolve(__dirname, "..");
const failures = [];
let passed = 0;

const ready = async page => {
  await page.waitForSelector('html[data-ready="true"]');
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".ascent")).opacity === "1");
};
const position = page => page.evaluate(() => ({ y: scrollY, max: document.scrollingElement.scrollHeight - innerHeight }));
const near = (actual, expected, tolerance = 3) => assert.ok(Math.abs(actual - expected) < tolerance, `Expected ${actual} to be within ${tolerance} of ${expected}`);
const jump = async (page, id) => {
  await page.locator(`.height-rail a[href="#${id}"]`).click();
  await page.waitForFunction(id => id === "roots"
    ? Math.abs(scrollY - document.scrollingElement.scrollHeight + innerHeight) < 3
    : Math.abs(document.getElementById(id).getBoundingClientRect().bottom - innerHeight + 48) < 3, id);
  await page.waitForTimeout(200);
};

(async () => {
  const server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname).replace(/^\/porto(?=\/)/, "");
    const filename = path.join(root, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    try {
      const data = await fs.readFile(filename);
      const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".md": "text/plain" };
      response.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream" });
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await playwright[engine].launch(engine === "chromium" ? { args: ["--no-sandbox"] } : {});
    console.log(`${engine} ${browser.version()}`);

    async function check(name, action, options = {}) {
      if (process.env.CHECK && !name.includes(process.env.CHECK)) return;
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
      const page = await context.newPage();
      page.setDefaultTimeout(7000);
      page.setDefaultNavigationTimeout(10000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("response", response => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      try {
        await page.goto(origin, { waitUntil: "load" });
        await ready(page);
        await action(page);
        assert.deepEqual(errors, [], "Console or resource errors");
        console.log(`PASS ${name}`);
        passed++;
      } catch (error) {
        failures.push({ name, message: error.message });
        console.error(`FAIL ${name}: ${error.message}`);
      } finally {
        await context.close();
      }
    }

    await check("Bottom-first entry, source order, and sample content", async page => {
      const { y, max } = await position(page);
      near(y, max);
      assert.equal(await page.locator(".project").count(), 6);
      assert.equal(await page.locator(".photo-card").count(), 12);
      assert.equal(await page.locator("#height-value").textContent(), "00");
      assert.deepEqual(await page.locator("[data-stage]").evaluateAll(nodes => nodes.map(node => node.dataset.stage)), ["roots", "trunk", "branches", "canopy", "treetop"]);
    });

    await check("Native upward wheel and keyboard scrolling", async page => {
      const before = await position(page);
      await page.mouse.move(500, 500);
      await page.mouse.wheel(0, -500);
      await page.waitForFunction(y => scrollY < y - 400, before.y);
      await page.waitForTimeout(300);
      const middle = await position(page);
      await page.keyboard.press("PageUp");
      await page.waitForFunction(y => scrollY < y - 200, middle.y);
    });

    await check("Fresh section navigation excludes animated reveal offsets", async page => {
      for (const [id, height] of [["trunk", "06"], ["branches", "14"], ["canopy", "23"], ["treetop", "30"], ["roots", "00"]]) {
        await jump(page, id);
        assert.equal(await page.locator("#height-value").textContent(), height);
        assert.equal(await page.evaluate(() => document.activeElement.id), id);
      }
    });

    await check("Menu focus containment, Escape, and section selection", async page => {
      await page.locator("#open-menu").click();
      assert.equal(await page.locator("#navigation").evaluate(node => node.open), true);
      for (let index = 0; index < 9; index++) {
        await page.keyboard.press("Tab");
        // Native dialogs may move focus to browser chrome at the end of a cycle.
        assert.equal(await page.evaluate(() => !document.hasFocus() || Boolean(document.activeElement.closest("#navigation"))), true);
      }
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(() => document.activeElement.id), "open-menu");
      await page.locator("#open-menu").click();
      await page.locator('#navigation a[href="#branches"]').click();
      assert.equal(await page.locator("#navigation").evaluate(node => node.open), false);
      await page.waitForFunction(() => Math.abs(document.querySelector("#branches").getBoundingClientRect().bottom - innerHeight + 48) < 3);
    });

    await check("Project previews follow pointer and keyboard selection", async page => {
      for (const index of [2, 0, 5]) {
        await page.locator(`[data-project="${index}"]`).hover();
        await page.waitForTimeout(350);
        assert.equal(await page.locator("#project-preview-image").getAttribute("src"), await page.evaluate(index => window.portfolioContent.projects[index].image, index));
      }
      await page.mouse.move(5, 500);
      for (const index of [0, 5, 2]) {
        await page.locator(`[data-project="${index}"]`).focus();
        await page.waitForTimeout(400);
        assert.equal(await page.locator(".project.is-active").getAttribute("data-project"), String(index));
      }
    });

    await check("Gallery filters preserve position and calculate category counts", async page => {
      await jump(page, "canopy");
      for (const [category, count] of [["Nature", 6], ["Street", 6], ["All", 12]]) {
        const before = await page.locator("#photo-filters").boundingBox();
        await page.locator(`[data-category="${category}"]`).click();
        await page.waitForTimeout(400);
        const after = await page.locator("#photo-filters").boundingBox();
        near(after.y, before.y);
        assert.equal(await page.locator(".photo-card").count(), count);
      }
      await page.locator('[data-category="Nature"]').click();
      const filtered = await position(page);
      await page.reload({ waitUntil: "load" });
      await ready(page);
      assert.equal(await page.locator(".photo-card").count(), 6);
      assert.equal(await page.locator('[data-category="Nature"]').getAttribute("aria-pressed"), "true");
      near((await position(page)).y, filtered.y);
    });

    await check("Filtered lightbox navigation, wraparound, and focus restoration", async page => {
      await jump(page, "canopy");
      await page.locator('[data-category="Nature"]').click();
      await page.locator('[data-photo="0"]').click();
      assert.equal(await page.locator("#lightbox-count").textContent(), "01 / 06");
      await page.keyboard.press("ArrowLeft");
      assert.equal(await page.locator("#lightbox-count").textContent(), "06 / 06");
      await page.locator("#photo-next").click();
      assert.equal(await page.locator("#lightbox-count").textContent(), "01 / 06");
      await page.keyboard.press("ArrowRight");
      assert.equal(await page.locator("#lightbox-count").textContent(), "02 / 06");
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#lightbox").evaluate(node => node.open), false);
      assert.equal(await page.evaluate(() => document.activeElement.dataset.photo), "0");
    });

    await check("Empty contacts have an editable placeholder state", async page => {
      for (const channel of ["email", "whatsapp"]) {
        await page.locator(`.quick-contact [data-contact="${channel}"]`).click();
        assert.equal(await page.locator("#placeholder-dialog").evaluate(node => node.open), true);
        assert.match(await page.locator("#placeholder-message").textContent(), /content.js/);
        await page.keyboard.press("Escape");
      }
    });

    await check("Reload and history retain a position away from the URL fragment", async page => {
      await jump(page, "branches");
      const beforeWheel = await position(page);
      await page.mouse.move(10, 400);
      await page.mouse.wheel(0, -400);
      await page.waitForFunction(y => Math.abs(scrollY - y + 400) < 3, beforeWheel.y);
      const before = await position(page);
      await page.reload({ waitUntil: "networkidle" });
      await ready(page);
      near((await position(page)).y, before.y);
      await page.goto(`${origin}/README.md`);
      await page.goBack({ waitUntil: "networkidle" });
      await ready(page);
      near((await position(page)).y, before.y);
      await jump(page, "trunk");
      const trunk = await position(page);
      await jump(page, "canopy");
      await page.goBack();
      await page.waitForTimeout(450);
      near((await position(page)).y, trunk.y);
    });

    await check("Direct fragments and explicit top fragments", async page => {
      for (const id of ["branches", "roots", "", "unknown"]) {
        const fresh = await page.context().newPage();
        fresh.setDefaultTimeout(7000);
        fresh.setDefaultNavigationTimeout(10000);
        try {
          await fresh.goto(`${origin}/#${id}`, { waitUntil: "load" });
          await ready(fresh);
          if (id === "roots") { const { y, max } = await position(fresh); near(y, max); }
          else if (!id || id === "unknown") near((await position(fresh)).y, 0);
          else await fresh.waitForFunction(id => Math.abs(document.getElementById(id).getBoundingClientRect().bottom - innerHeight + 48) < 3, id);
        } finally { await fresh.close(); }
      }
    });

    await check("Configured email, WhatsApp, and GitHub links", async page => {
      await page.route("**/content.js", async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: `${await response.text()}\nObject.assign(window.portfolioContent,{email:'hello@example.com',whatsapp:'+62 812 3456 7890',github:'https://github.com/example'});` });
      });
      await page.reload({ waitUntil: "networkidle" });
      await ready(page);
      assert.equal(await page.locator('.quick-contact [data-contact="email"]').getAttribute("href"), "mailto:hello@example.com");
      assert.match(await page.locator('.quick-contact [data-contact="whatsapp"]').getAttribute("href"), /^https:\/\/wa.me\/6281234567890\?text=/);
      assert.equal(await page.locator("#github-link").getAttribute("href"), "https://github.com/example");
      const box = await page.locator('.quick-contact [data-contact="email"]').boundingBox();
      assert.ok(box.width >= 34 && box.height >= 34);
    });

    await check("GitHub Pages project subpath", async page => {
      await page.goto(`${origin}/porto/`, { waitUntil: "networkidle" });
      await ready(page);
      const { y, max } = await position(page);
      near(y, max);
      assert.equal(await page.locator(".tree").evaluate(node => node.getBBox().height > 0 && node.querySelector("[data-sway] use").getBBox().width > 0), true);
      assert.equal(await page.locator(".project").count(), 6);
      await page.locator("#open-menu").click();
      assert.equal(await page.locator("#navigation").evaluate(node => node.open), true);
    });

    await check("Responsive opening, image aspect ratios, and horizontal fit", async page => {
      for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1024, 768], [1440, 900], [1920, 1080], [2560, 1080], [3440, 1300], [3840, 1600]]) {
        await page.setViewportSize({ width, height });
        await page.goto(`${origin}/?width=${width}`, { waitUntil: "networkidle" });
        await ready(page);
        const layout = await page.evaluate(() => {
          const cue = document.querySelector(".root-footer a").getBoundingClientRect();
          const contact = document.querySelector(".quick-contact").getBoundingClientRect();
          const preview = document.querySelector(".project-mobile-image").getBoundingClientRect();
          const heading = document.querySelector("#roots-title").getBoundingClientRect();
          const footer = document.querySelector(".root-footer").getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            headingTop: heading.top,
            headingLeft: heading.left,
            contentWidth: footer.width,
            heroBottom: document.querySelector(".hero-bottom").getBoundingClientRect().bottom,
            footerTop: footer.top,
            overlap: cue.left < contact.right && cue.right > contact.left && cue.top < contact.bottom && cue.bottom > contact.top,
            ratio: preview.width / preview.height,
            hasPreview: getComputedStyle(document.querySelector(".project-mobile-image")).display !== "none",
          };
        });
        assert.equal(layout.overflow, false, `${width}px overflow`);
        assert.ok(layout.headingTop >= 70, `${width}px heading starts at ${layout.headingTop}`);
        assert.equal(layout.overlap, false, `${width}px cue overlaps fixed contacts`);
        if (layout.hasPreview) near(layout.ratio, 4 / 3, .01);
        if (width >= 1920) {
          assert.ok(layout.headingLeft < width * .08, `${width}px content is trapped in a centered column`);
          assert.ok(layout.contentWidth > width * .75, `${width}px content does not use the available width`);
          assert.ok(layout.heroBottom < layout.footerTop, `${width}px hero overlaps the footer`);
        }
      }
    });

    await check("Tree trunk reaches its crown forks and tapers at the tip", async page => {
      const geometry = await page.locator(".tree").evaluate(tree => {
        const trunk = tree.querySelector(':scope > path[fill="url(#bark)"]');
        const forks = tree.querySelector(':scope > g[stroke="url(#branch)"] > path:last-child');
        const junctions = [...forks.getAttribute("d").matchAll(/M([\d.]+)\s+([\d.]+)/g)].map(([, x, y]) => ({ x: Number(x), y: Number(y) }));
        const box = trunk.getBBox();
        const widthAt = y => {
          let width = 0;
          for (let x = box.x; x < box.x + box.width; x += .25) {
            if (trunk.isPointInFill(new DOMPoint(x, y))) width += .25;
          }
          return width;
        };
        return {
          junctions: junctions.map(point => ({ ...point, connected: trunk.isPointInFill(new DOMPoint(point.x, point.y)) })),
          tipWidth: widthAt(box.y + 3),
          widthBelowTip: widthAt(box.y + 60),
        };
      });
      assert.ok(geometry.junctions.length >= 2, "The crown should fork in both directions");
      for (const point of geometry.junctions) {
        assert.ok(point.connected, `Crown fork at (${point.x}, ${point.y}) is detached from the trunk`);
      }
      assert.ok(geometry.widthBelowTip > 0, "The upper trunk should remain continuous");
      assert.ok(geometry.tipWidth < geometry.widthBelowTip * .3, `Trunk tip is ${geometry.tipWidth} units wide: a flat cutoff instead of a taper`);
    }, { reducedMotion: "reduce" });

    await check("Foliage joins stay connected at rest and through the full sway range", async page => {
      for (const width of [390, 1440, 3440]) {
        await page.setViewportSize({ width, height: 1000 });
        const result = await page.locator(".tree").evaluate(tree => {
          const failures = [];
          const baseOf = use => tree.querySelector(use.getAttribute("href")).querySelector("path").getPointAtLength(0);
          let templateJoints = 0;
          for (const id of ["sprig", "bough"]) {
            const template = tree.querySelector(`#${id}`);
            const stem = template.querySelector(":scope > path");
            [...template.querySelectorAll(":scope > use")].forEach((use, index) => {
              templateJoints++;
              const base = baseOf(use).matrixTransform(use.transform.baseVal.consolidate().matrix);
              if (!stem.isPointInStroke(base)) failures.push(`${id} joint ${index + 1} misses its stem`);
            });
          }
          const trunk = tree.querySelector(':scope > path[fill="url(#bark)"]');
          const branches = [...tree.querySelectorAll(':scope > g[stroke="url(#branch)"] > path, :scope > g:has(> path[stroke="url(#bark)"]) > path')];
          const clusters = [...tree.querySelectorAll("use")].filter(use => !use.closest("defs"));
          const movingGroups = [...tree.querySelectorAll("[data-sway]")];
          // Test deterministic extremes as well as rest; Anime.js animates this same rotation.
          for (const phase of [0, -1, 1]) {
            movingGroups.forEach(group => { group.style.transform = `rotate(${phase * Number(group.dataset.sway)}deg)`; });
            const toTree = tree.getScreenCTM().inverse();
            clusters.forEach((use, index) => {
              const base = baseOf(use).matrixTransform(toTree.multiply(use.getScreenCTM()));
              if (!trunk.isPointInFill(base) && !branches.some(branch => branch.isPointInStroke(base))) {
                failures.push(`Cluster ${index + 1} misses its branch at sway ${phase}`);
              }
            });
          }
          movingGroups.forEach(group => group.style.removeProperty("transform"));
          return { failures, templateJoints, clusters: clusters.length };
        });
        assert.ok(result.templateJoints > 0 && result.clusters > 0, "The tree must contain both template and placed foliage joints");
        assert.equal(result.failures.length, 0, `${width}px: ${result.failures.slice(0, 8).join("; ")}`);
      }
    }, { reducedMotion: "reduce" });

    await check("Leaf breeze moves visible foliage and responds to preference changes", async page => {
      const leaves = page.locator(".tree [data-sway]");
      const offscreen = await leaves.first().evaluate(node => node.style.transform);
      const initial = await leaves.last().evaluate(node => node.style.transform);
      await page.waitForFunction(initial => {
        const leaf = [...document.querySelectorAll(".tree [data-sway]")].at(-1);
        return leaf.style.transform !== initial;
      }, initial);
      assert.equal(await leaves.first().evaluate(node => node.style.transform), offscreen, "Offscreen foliage should pause");

      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForFunction(() => [...document.querySelectorAll(".tree [data-sway]")].every(node => getComputedStyle(node).transform === "none"));
      await page.waitForTimeout(200);
      assert.equal(await leaves.evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transform === "none")), true);

      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForFunction(() => [...document.querySelectorAll(".tree [data-sway]")].at(-1).style.transform !== "");
      const resumed = await leaves.last().evaluate(node => node.style.transform);
      await page.waitForFunction(previous => [...document.querySelectorAll(".tree [data-sway]")].at(-1).style.transform !== previous, resumed);
    });

    await check("Reduced-motion preferences", async page => {
      assert.equal(await page.locator(".pollen").evaluate(node => getComputedStyle(node).display), "none");
      assert.equal(await page.locator(".sunlight").evaluate(node => getComputedStyle(node).animationName), "none");
      assert.equal(await page.locator(".tree [data-sway]").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transform === "none")), true);
    }, { reducedMotion: "reduce" });

    if (engine !== "firefox") {
      await check(engine === "chromium" ? "Touch layout and native upward gesture" : "Emulated touch layout", async page => {
        assert.equal(await page.locator(".photo-card img").first().evaluate(node => getComputedStyle(node).filter), "none");
        if (engine === "chromium") {
          const before = await position(page);
          const cdp = await page.context().newCDPSession(page);
          await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 180, y: 280 }] });
          for (let y = 310; y <= 660; y += 50) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 180, y }] });
          await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
          await page.waitForFunction(y => scrollY < y - 100, before.y);
        }
      }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    }
    console.log(`\n${passed} passed; ${failures.length} failed.`);
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
