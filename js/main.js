(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setOpen(open) {
    if (!toggle || !nav || !header) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    header.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth > 720) setOpen(false);
  });

  document.querySelectorAll("form.book-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "thank-you.html";
    });
  });

  function isFanMobileLayout() {
    return typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 960px)").matches
      : window.innerWidth <= 960;
  }

  document.querySelectorAll("[data-fan-carousel]").forEach(function (fanRoot) {
    var rawStage = fanRoot.querySelector(".fan-carousel__stage");
    if (!rawStage) return;

    var viewport = document.createElement("div");
    viewport.className = "fan-carousel__viewport";
    rawStage.parentNode.insertBefore(viewport, rawStage);
    viewport.appendChild(rawStage);

    var stage = rawStage;
    var cards = Array.prototype.slice.call(stage.querySelectorAll(".fan-card"));
    var prevBtn = fanRoot.querySelector(".fan-carousel__btn--prev");
    var nextBtn = fanRoot.querySelector(".fan-carousel__btn--next");
    var centerIdx = Math.min(2, Math.max(0, cards.length - 1));

    var rail = document.createElement("div");
    rail.className = "fan-carousel__rail";
    rail.setAttribute("aria-hidden", "true");
    var railThumb = document.createElement("span");
    railThumb.className = "fan-carousel__rail-thumb";
    rail.appendChild(railThumb);

    var dots = document.createElement("div");
    dots.className = "fan-carousel__dots";
    dots.setAttribute("role", "tablist");
    dots.setAttribute("aria-label", "Featured looks");

    viewport.appendChild(rail);
    viewport.appendChild(dots);

    var dotButtons = [];
    cards.forEach(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fan-carousel__dot";
      b.setAttribute("aria-label", "Go to look " + (i + 1));
      b.addEventListener("click", function () {
        cards[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      dots.appendChild(b);
      dotButtons.push(b);
    });

    function wrapRel(raw) {
      while (raw > 2) raw -= cards.length;
      while (raw < -2) raw += cards.length;
      return raw;
    }

    function renderFan() {
      cards.forEach(function (card, i) {
        var rel = wrapRel(i - centerIdx);
        card.setAttribute("data-offset", String(rel));
        card.classList.toggle("fan-card--center", rel === 0);
      });
    }

    function step(delta) {
      if (!cards.length) return;
      centerIdx = (centerIdx + delta + cards.length) % cards.length;
      renderFan();
      if (!isFanMobileLayout()) syncDotsToCenter();
    }

    function syncDotsToCenter() {
      dotButtons.forEach(function (btn, i) {
        btn.setAttribute("aria-current", i === centerIdx ? "true" : "false");
      });
    }

    function syncFromScroll() {
      if (!cards.length || !isFanMobileLayout()) return;

      var stageMid = stage.scrollLeft + stage.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      cards.forEach(function (card, i) {
        var mid = card.offsetLeft + card.offsetWidth / 2;
        var dist = Math.abs(mid - stageMid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      dotButtons.forEach(function (btn, i) {
        btn.setAttribute("aria-current", i === best ? "true" : "false");
      });

      var maxScroll = Math.max(1, stage.scrollWidth - stage.clientWidth);
      var progress = stage.scrollLeft / maxScroll;
      /* Thumb width fixed at 28% in CSS; travels across remaining 72% */
      railThumb.style.left = progress * (100 - 28) + "%";
    }

    var scrollScheduled = false;
    stage.addEventListener(
      "scroll",
      function () {
        if (!isFanMobileLayout()) return;
        if (!scrollScheduled) {
          scrollScheduled = true;
          requestAnimationFrame(function () {
            scrollScheduled = false;
            syncFromScroll();
          });
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      if (isFanMobileLayout()) syncFromScroll();
      else syncDotsToCenter();
    });

    if (cards.length) {
      renderFan();
      syncDotsToCenter();
      requestAnimationFrame(syncFromScroll);

      if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
      if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });
    }
  });
})();
