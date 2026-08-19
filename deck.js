(() => {
  const deck = document.getElementById("deck");
  const track = document.getElementById("track");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const progress = document.getElementById("progress");
  const picker = document.getElementById("slide-picker");
  const hint = document.getElementById("hint");
  let index = 0;
  let animating = false;

  const params = new URLSearchParams(window.location.search);
  const start = Number(params.get("slide"));
  if (Number.isFinite(start) && start >= 1 && start <= slides.length) {
    index = start - 1;
  }

  function slideLabel(slide, i) {
    const title = slide.querySelector("h1")?.innerText?.replace(/\s+/g, " ").trim() || `Slide ${i + 1}`;
    const n = String(i + 1).padStart(2, "0");
    return `${n} · ${title}`;
  }

  if (picker) {
    slides.forEach((slide, i) => {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = slideLabel(slide, i);
      picker.appendChild(option);
    });
  }

  function setTrack(offsetPercent, animate = true) {
    if (!animate) {
      deck.classList.add("is-dragging");
    } else {
      deck.classList.remove("is-dragging");
    }
    track.style.transform = `translate3d(${offsetPercent}%, 0, 0)`;
  }

  function render(animate = true) {
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    setTrack(-index * 100, animate);
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    if (picker) picker.value = String(index);
    const url = new URL(window.location.href);
    url.searchParams.set("slide", String(index + 1));
    history.replaceState(null, "", url);
    document.title = `${slides[index].querySelector("h1")?.innerText || "Deck"} — ArcTouch`;
  }

  function goTo(next, animate = true) {
    if (animating) return;
    const target = Math.min(slides.length - 1, Math.max(0, next));
    if (target === index) {
      render(false);
      return;
    }
    animating = true;
    index = target;
    render(animate);
    window.setTimeout(() => {
      animating = false;
    }, 560);
  }

  function go(delta) {
    goTo(index + delta, true);
  }

  prevBtn.addEventListener("click", () => go(-1));
  nextBtn.addEventListener("click", () => go(1));

  if (picker) {
    picker.addEventListener("change", () => {
      goTo(Number(picker.value), true);
    });
  }

  document.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName;
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;

    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Home") {
      goTo(0, true);
    } else if (event.key === "End") {
      goTo(slides.length - 1, true);
    } else if (event.key === "f" || event.key === "F") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".controls") || event.target.closest("a, button, .snippet-card")) {
      return;
    }
    const x = event.clientX / window.innerWidth;
    if (x > 0.66) go(1);
    else if (x < 0.33) go(-1);
  });

  let touchX = null;
  let touchActive = false;

  document.addEventListener(
    "touchstart",
    (event) => {
      if (event.target.closest(".controls")) return;
      touchX = event.changedTouches[0].clientX;
      touchActive = true;
      deck.classList.add("is-dragging");
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (!touchActive || touchX == null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      const dragPercent = (dx / window.innerWidth) * 100;
      setTrack(-index * 100 + dragPercent, false);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (event) => {
      if (!touchActive || touchX == null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      touchX = null;
      touchActive = false;
      deck.classList.remove("is-dragging");
      if (Math.abs(dx) > 60) {
        go(dx < 0 ? 1 : -1);
      } else {
        render(true);
      }
    },
    { passive: true }
  );

  setTimeout(() => {
    if (hint) hint.style.opacity = "0";
  }, 4500);

  // Jump to deep-linked slide without animating on first paint
  render(false);
  requestAnimationFrame(() => {
    deck.classList.remove("is-dragging");
  });

  function highlightSwift() {
    if (!window.hljs) return;
    document.querySelectorAll("pre code.language-swift").forEach((block) => {
      window.hljs.highlightElement(block);
    });
  }

  if (window.hljs) {
    highlightSwift();
  } else {
    window.addEventListener("load", highlightSwift);
  }
})();
