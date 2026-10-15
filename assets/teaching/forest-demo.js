(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-forest-demo]").forEach(demo => {
    const photo = demo.querySelector("[data-demo-photo]");
    const drawing = demo.querySelector("[data-demo-drawing]");
    const twig = demo.querySelector("[data-demo-twig]");
    const stem = demo.querySelector("[data-demo-stem]");
    const controls = Object.fromEntries([...demo.querySelectorAll("[data-control]")].map(input => [input.dataset.control, input]));
    const status = demo.querySelector("[data-demo-status]");
    const length = stem.getTotalLength();
    const points = Array.from({ length: 2001 }, (_, i) => stem.getPointAtLength(length * i / 2000));
    const leaves = [...demo.querySelectorAll("[data-demo-leaf]")].map(leaf => {
      const matrix = leaf.transform.baseVal.consolidate().matrix;
      const original = { x: matrix.e, y: matrix.f };
      const nearest = points.reduce((best, point) => Math.hypot(point.x - original.x, point.y - original.y) < Math.hypot(best.x - original.x, best.y - original.y) ? point : best);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("r", "2.2");
      dot.setAttribute("class", "forest-demo__base");
      twig.append(dot);
      return { leaf, matrix, original, nearest, dot, attached: stem.isPointInStroke(new DOMPoint(original.x, original.y)) };
    });
    let animation;

    function syncMotion() {
      animation?.revert();
      animation = null;
      controls.wind.disabled = reducedMotion.matches || !window.anime;
      demo.querySelector("[data-motion-note]").hidden = !reducedMotion.matches;
      if (controls.wind.checked && !controls.wind.disabled && controls.drawing.checked && !document.hidden) {
        animation = window.anime.animate(twig, { rotate: [-4, 4], duration: 3500, alternate: true, loop: true, ease: "inOutSine" });
      }
    }

    function render() {
      photo.hidden = !controls.photo.checked;
      drawing.toggleAttribute("hidden", !controls.drawing.checked);
      const aligned = controls.align.checked;
      demo.dataset.aligned = String(aligned);
      let attached = 0;
      leaves.forEach(({ leaf, matrix, original, nearest, dot, attached: originallyAttached }) => {
        const point = aligned ? nearest : original;
        leaf.setAttribute("transform", `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${point.x} ${point.y})`);
        dot.setAttribute("cx", point.x);
        dot.setAttribute("cy", point.y);
        if (aligned || originallyAttached) attached++;
      });
      status.textContent = aligned
        ? `Aligned: ${attached} of ${leaves.length} leaf bases meet the stem. The shapes and photo are the same; only the leaf positions changed.`
        : `Original: ${leaves.length - attached} of ${leaves.length} leaf bases miss the stem. The gaps exist even with the breeze switched off.`;
      syncMotion();
    }

    Object.values(controls).forEach(input => input.addEventListener("change", render));
    reducedMotion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncMotion);
    render();
  });
})();
