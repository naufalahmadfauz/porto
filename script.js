(() => {
  "use strict";

  const content = window.portfolioContent;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const html = document.documentElement;
  const stages = [...document.querySelectorAll("[data-stage]")];
  const navigationType = performance.getEntriesByType("navigation")[0]?.type || "navigate";
  const newEntryKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  let entryKey = history.state?.portfolio?.key || newEntryKey();
  let savedView = history.state?.portfolio;
  // Firefox can snapshot history.state before pagehide; session storage keeps the final position.
  if (navigationType !== "navigate") {
    try { savedView = JSON.parse(sessionStorage.getItem(`portfolio-view:${entryKey}`)) || savedView; } catch { /* History state remains the fallback. */ }
  }
  let entered = false;
  let saveTimer;
  const escape = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const number = value => String(value).padStart(2, "0");

  document.querySelectorAll("[data-text]").forEach(element => {
    const value = content[element.dataset.text];
    if (typeof value === "string") element.textContent = value;
  });
  document.title = `${content.name} — websites, naturally.`;
  document.querySelector("#year").textContent = new Date().getFullYear();
  document.querySelector("#about-paragraphs").innerHTML = content.about.map(paragraph => `<p>${escape(paragraph)}</p>`).join("");
  const portrait = document.querySelector("#portrait-image");
  portrait.src = content.portrait;
  portrait.alt = content.portraitAlt;
  document.querySelector("#services").innerHTML = content.services.map((service, index) => `<article class="service"><span class="mono">${number(index + 1)}</span><div><h3>${escape(service.title)}</h3><p>${escape(service.description)}</p></div></article>`).join("");
  document.querySelector("#skills").innerHTML = content.skills.map(group => `<dl class="skill-group"><dt class="mono">${escape(group.label)}</dt><dd>${group.items.map(item => `<span>${escape(item)}</span>`).join("")}</dd></dl>`).join("");

  function showPlaceholder(message) {
    document.querySelector("#placeholder-message").textContent = message;
    document.querySelector("#placeholder-dialog").showModal();
  }

  const github = document.querySelector("#github-link");
  if (content.github) {
    github.href = content.github;
    github.target = "_blank";
    github.rel = "noopener noreferrer";
  } else {
    github.addEventListener("click", event => {
      event.preventDefault();
      showPlaceholder("Add your GitHub profile URL to the github field in content.js. Your profile link will then open here.");
    });
  }

  document.querySelectorAll("[data-contact]").forEach(button => {
    const kind = button.dataset.contact;
    const email = content.email.trim();
    const phone = content.whatsapp.replace(/\D/g, "");
    const address = kind === "email" ? (email ? `mailto:${email}` : "") : (phone ? `https://wa.me/${phone}?text=${encodeURIComponent(content.whatsappMessage)}` : "");
    if (address) {
      const link = document.createElement("a");
      [...button.attributes].forEach(attribute => {
        if (attribute.name !== "type") link.setAttribute(attribute.name, attribute.value);
      });
      link.href = address;
      link.innerHTML = button.innerHTML;
      if (kind === "whatsapp") {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      button.replaceWith(link);
    } else {
      button.addEventListener("click", () => showPlaceholder(kind === "email"
        ? "Add your email address to the email field in content.js. This button will open a new message to you."
        : "Add your international phone number to the whatsapp field in content.js. This button will open a WhatsApp conversation with you."));
    }
  });

  // Projects stay in narrative order in the document; CSS places the first at the lower entry edge.
  document.querySelector("#projects").innerHTML = content.projects.map((project, index) => {
    const link = (url, label) => url
      ? `<a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
      : `<span title="Add this project’s ${label.toLowerCase()} URL in content.js">${label} ↗</span>`;
    return `<li class="project" tabindex="0" data-project="${index}" aria-label="${escape(project.name)}, sample project">
      <img class="project-mobile-image" src="${escape(project.image)}" width="1000" height="750" alt="Placeholder website preview for ${escape(project.name)}" loading="lazy">
      <span class="project-number mono">${number(index + 1)}</span><div class="project-category mono">${escape(project.category)} / Sample</div><h3>${escape(project.name)}</h3><p>${escape(project.description)}</p>
      <div class="project-meta"><div class="project-tags mono">${project.tags.map(tag => `<span>${escape(tag)}</span>`).join("")}</div><div class="project-links mono">${link(project.live, "Live")}${link(project.code, "Code")}</div></div></li>`;
  }).join("");

  const projectRows = [...document.querySelectorAll("[data-project]")];
  const preview = document.querySelector("#project-preview-image");
  const previewLabel = document.querySelector("#project-preview-label");
  let activeProject = -1;
  let previewTimer;
  let projectHover = false;
  function selectProject(index, instant = false) {
    if (index === activeProject || !content.projects[index]) return;
    activeProject = index;
    projectRows.forEach((row, rowIndex) => row.classList.toggle("is-active", rowIndex === index));
    window.clearTimeout(previewTimer);
    const update = () => {
      preview.src = content.projects[index].image;
      previewLabel.textContent = `${number(index + 1)} / ${content.projects[index].name}`;
      preview.parentElement.classList.remove("is-changing");
    };
    if (instant || reducedMotion.matches) update();
    else {
      preview.parentElement.classList.add("is-changing");
      previewTimer = window.setTimeout(update, 130);
    }
  }
  selectProject(0, true);
  projectRows.forEach((row, index) => {
    row.addEventListener("mouseenter", () => { projectHover = true; selectProject(index); });
    row.addEventListener("mouseleave", () => { projectHover = false; });
    row.addEventListener("focusin", () => selectProject(index));
  });

  // Gallery dimensions are reserved so arriving at the bottom is stable before images load.
  const filters = document.querySelector("#photo-filters");
  const gallery = document.querySelector("#gallery");
  const categories = ["All", ...new Set(content.photos.map(photo => photo.category))];
  let selectedCategory = navigationType !== "navigate" && categories.includes(savedView?.category) ? savedView.category : "All";
  let visiblePhotos = content.photos;
  let currentPhoto = 0;
  filters.innerHTML = categories.map(category => `<button type="button" data-category="${escape(category)}" aria-pressed="${category === selectedCategory}">${escape(category)}<span>${category === "All" ? content.photos.length : content.photos.filter(photo => photo.category === category).length}</span></button>`).join("");

  function renderGallery() {
    visiblePhotos = content.photos.filter(photo => selectedCategory === "All" || photo.category === selectedCategory);
    gallery.innerHTML = visiblePhotos.map((photo, index) => `<button type="button" class="photo-card ${photo.shape === "landscape" ? "is-landscape" : ""}" data-photo="${index}" aria-label="Open photograph: ${escape(photo.title)}"><img src="${escape(photo.image)}" width="${photo.shape === "landscape" ? 1000 : 750}" height="${photo.shape === "landscape" ? 750 : 1000}" alt="${escape(photo.alt)}" loading="lazy" decoding="async"><span class="photo-open" aria-hidden="true">↗</span><span class="photo-caption"><strong>${escape(photo.title)}</strong><small class="mono">${escape(photo.category)}</small></span></button>`).join("");
    document.querySelector("#gallery-status").textContent = `${visiblePhotos.length} photographs. ${selectedCategory} selected.`;
  }
  renderGallery();
  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button || button.dataset.category === selectedCategory) return;
    const previousTop = filters.getBoundingClientRect().top;
    selectedCategory = button.dataset.category;
    filters.querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderGallery();
    // Keep the control the visitor just used in place when content above changes height.
    window.scrollBy({ top: filters.getBoundingClientRect().top - previousTop, behavior: "instant" });
    saveView();
    scheduleScrollUpdate();
  });

  const lightbox = document.querySelector("#lightbox");
  function displayPhoto(index) {
    currentPhoto = (index + visiblePhotos.length) % visiblePhotos.length;
    const photo = visiblePhotos[currentPhoto];
    const image = document.querySelector("#lightbox-image");
    image.src = photo.image;
    image.alt = photo.alt;
    document.querySelector("#lightbox-title").textContent = photo.title;
    document.querySelector("#lightbox-category").textContent = photo.category;
    document.querySelector("#lightbox-count").textContent = `${number(currentPhoto + 1)} / ${number(visiblePhotos.length)}`;
  }
  gallery.addEventListener("click", event => {
    const button = event.target.closest("[data-photo]");
    if (!button) return;
    displayPhoto(Number(button.dataset.photo));
    lightbox.showModal();
  });
  document.querySelector("#photo-previous").addEventListener("click", () => displayPhoto(currentPhoto - 1));
  document.querySelector("#photo-next").addEventListener("click", () => displayPhoto(currentPhoto + 1));
  lightbox.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      displayPhoto(currentPhoto + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  let touchStart;
  lightbox.addEventListener("touchstart", event => { touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }, { passive: true });
  lightbox.addEventListener("touchend", event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) displayPhoto(currentPhoto + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });

  const navigation = document.querySelector("#navigation");
  document.querySelector("#open-menu").addEventListener("click", () => navigation.showModal());
  document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });

  // Links enter each stage through its introduction at the lower edge.
  function stagePosition(id) {
    const stage = stages.find(item => item.dataset.stage === id);
    const anchor = document.getElementById(id);
    if (!stage || !anchor) return null;
    if (id === "roots") return document.scrollingElement.scrollHeight - window.innerHeight;
    // Offset geometry excludes the introductory text's animated reveal transform.
    const bottom = stage.getBoundingClientRect().top + window.scrollY + anchor.offsetTop + anchor.offsetHeight;
    return Math.max(0, bottom - window.innerHeight + 48);
  }

  function saveView() {
    if (!entered) return;
    history.replaceState({ ...history.state, portfolio: { key: entryKey, y: window.scrollY, category: selectedCategory } }, "");
  }

  function persistView() {
    saveView();
    if (!entered) return;
    try { sessionStorage.setItem(`portfolio-view:${entryKey}`, JSON.stringify(history.state.portfolio)); } catch { /* Storage may be unavailable for local files. */ }
  }

  function restoreView(view) {
    const category = categories.includes(view.category) ? view.category : "All";
    if (category !== selectedCategory) {
      selectedCategory = category;
      filters.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.category === category)));
      renderGallery();
    }
    window.scrollTo({ top: view.y, behavior: "instant" });
    scheduleScrollUpdate();
  }

  window.addEventListener("pagehide", persistView);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persistView();
  });
  window.addEventListener("popstate", event => {
    window.clearTimeout(saveTimer);
    saveTimer = null;
    if (Number.isFinite(event.state?.portfolio?.y)) {
      entryKey = event.state.portfolio.key || newEntryKey();
      restoreView(event.state.portfolio);
    }
  });
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link === github && !content.github) return;
    link.addEventListener("click", event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const id = link.getAttribute("href").slice(1);
      if (!document.querySelector(`[data-stage="${id}"]`)) return;
      event.preventDefault();
      if (navigation.open) navigation.close();
      const target = stagePosition(id);
      saveView();
      entryKey = newEntryKey();
      history.pushState({ portfolio: { key: entryKey, y: target, category: selectedCategory } }, "", `#${id}`);
      document.getElementById(id).focus({ preventScroll: true });
      window.scrollTo({ top: target, behavior: reducedMotion.matches ? "instant" : "smooth" });
    });
  });

  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    const stops = stages.map(stage => ({ y: stagePosition(stage.dataset.stage), height: Number(stage.dataset.height) }));
    let height = stops.at(-1).height;
    let railProgress = 1;
    for (let index = 0; index < stops.length - 1; index++) {
      if (window.scrollY >= stops[index + 1].y) {
        const fraction = Math.min(1, Math.max(0, (stops[index].y - window.scrollY) / Math.max(1, stops[index].y - stops[index + 1].y)));
        height = stops[index].height + (stops[index + 1].height - stops[index].height) * fraction;
        railProgress = (index + fraction) / (stops.length - 1);
        break;
      }
    }
    html.style.setProperty("--progress", (height / stops.at(-1).height).toFixed(4));
    html.style.setProperty("--rail-progress", railProgress.toFixed(4));
    document.querySelector("#height-value").textContent = number(Math.round(height));
    let currentStage = stages[0];
    for (const stage of stages) {
      const bounds = stage.getBoundingClientRect();
      if (bounds.top <= window.innerHeight * .58 && bounds.bottom > window.innerHeight * .58) currentStage = stage;
    }
    document.querySelectorAll("[data-rail]").forEach(link => {
      const active = link.dataset.rail === currentStage.dataset.stage;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (currentStage.dataset.stage === "branches" && !projectHover) {
      let nearest = 0;
      let distance = Infinity;
      projectRows.forEach((row, index) => {
        const bounds = row.getBoundingClientRect();
        const difference = Math.abs(bounds.top + bounds.height / 2 - window.innerHeight * .52);
        if (difference < distance) { distance = difference; nearest = index; }
      });
      selectProject(nearest);
    }
  }
  function scheduleScrollUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateScroll);
  }
  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("scroll", () => {
    if (entered && !saveTimer) saveTimer = window.setTimeout(() => { saveTimer = null; saveView(); }, 180);
  }, { passive: true });
  window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
  window.addEventListener("pageshow", scheduleScrollUpdate);

  const pollen = document.querySelector("#pollen");
  for (let index = 0; index < 28; index++) {
    const mote = document.createElement("span");
    mote.style.cssText = `left:${(index * 37.7) % 100}%;top:${(index * 23.1) % 100}%;--duration:${12 + index % 11}s;--delay:-${index * 1.8}s;--opacity:${.12 + index % 5 * .055}`;
    pollen.append(mote);
  }

  if (window.anime) {
    const foliage = [...document.querySelectorAll(".tree [data-sway]")].map(element => ({ element, animation: null, visible: !("IntersectionObserver" in window) }));
    const syncBreeze = branch => {
      if (!branch.animation) return;
      if (branch.visible && !document.hidden) branch.animation.resume();
      else branch.animation.pause();
    };
    const rebuildBreeze = () => {
      foliage.forEach((branch, index) => {
        branch.animation?.revert();
        branch.animation = null;
        if (reducedMotion.matches) return;
        const strength = Number(branch.element.dataset.sway);
        const duration = 3800 + index % 7 * 430;
        branch.animation = window.anime.animate(branch.element, {
          rotate: [-strength, strength],
          duration,
          ease: "inOutSine",
          alternate: true,
          loop: true,
          autoplay: false,
        });
        branch.animation.seek(index * 617 % duration);
        syncBreeze(branch);
      });
    };
    // Keep the breeze local to visible foliage, with a different rhythm at every joint.
    if ("IntersectionObserver" in window) {
      const branches = new Map(foliage.map(branch => [branch.element, branch]));
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const branch = branches.get(entry.target);
          branch.visible = entry.isIntersecting;
          syncBreeze(branch);
        });
      }, { rootMargin: "100px" });
      foliage.forEach(branch => observer.observe(branch.element));
    }
    reducedMotion.addEventListener("change", rebuildBreeze);
    document.addEventListener("visibilitychange", () => foliage.forEach(syncBreeze));
    rebuildBreeze();
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    document.querySelectorAll(".stage-intro, .about-copy, .portrait, .service, .skill-group, .contact-link").forEach(element => {
      element.classList.add("reveal");
      observer.observe(element);
    });
  }

  let interacted = false;
  const markInteraction = () => { interacted = true; };
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(type => window.addEventListener(type, markInteraction, { once: true, passive: true }));
  async function enter() {
    // Fonts can change the bottom coordinate. Image aspect ratios are reserved in CSS.
    await Promise.race([document.fonts.ready, new Promise(resolve => window.setTimeout(resolve, 1600))]);
    if (document.readyState !== "complete") await new Promise(resolve => window.addEventListener("load", resolve, { once: true }));
    await new Promise(resolve => window.requestAnimationFrame(resolve));
    const entryUrl = new URL(window.portfolioEntryUrl || window.location.href);
    if (!interacted) history.replaceState(history.state, "", entryUrl.href);
    if (navigationType !== "navigate" && Number.isFinite(savedView?.y) && !interacted) {
      restoreView(savedView);
    } else if (navigationType === "navigate" && !interacted) {
      const hasFragment = entryUrl.href.includes("#");
      let id = "";
      try { id = decodeURIComponent(entryUrl.hash.slice(1)); } catch { /* Unknown fragments retain the top entry. */ }
      const target = hasFragment ? (id ? stagePosition(id) : null) : stagePosition("roots");
      if (target !== null) window.scrollTo({ top: target, behavior: "instant" });
      else if (id) document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
    }
    html.classList.remove("booting");
    html.dataset.ready = "true";
    entered = true;
    saveView();
    updateScroll();
  }
  enter();
})();
