(function () {
  var reducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Preloader — branded curtain until the page (and hero imagery) is ready */
  var preloader = document.createElement("div");
  preloader.className = "preloader";
  preloader.setAttribute("aria-hidden", "true");
  preloader.innerHTML =
    '<div class="preloader__mark">Auburn <span>Atelier</span></div>' +
    '<div class="preloader__bar"></div>';
  document.body.appendChild(preloader);

  var preloaderShownAt = Date.now();
  var MIN_PRELOADER_MS = reducedMotion ? 0 : 650;

  function hidePreloader() {
    var elapsed = Date.now() - preloaderShownAt;
    var wait = Math.max(0, MIN_PRELOADER_MS - elapsed);
    window.setTimeout(function () {
      preloader.classList.add("is-done");
      window.setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 600);
    }, wait);
  }

  if (document.readyState === "complete") {
    hidePreloader();
  } else {
    window.addEventListener("load", hidePreloader);
    /* Safety net: never trap visitors behind the curtain */
    window.setTimeout(hidePreloader, 4000);
  }

  /* Page transitions — fade out before following internal links */
  function isInternalPageLink(link) {
    if (link.target && link.target !== "_self") return false;
    if (link.hasAttribute("download")) return false;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return false;
    if (/^[a-z]+:/i.test(href) && href.indexOf(window.location.origin) !== 0) return false;
    if (link.origin && link.origin !== window.location.origin) return false;
    /* Same page + hash → let the browser scroll */
    if (link.pathname === window.location.pathname && link.hash) return false;
    return true;
  }

  document.addEventListener("click", function (e) {
    if (reducedMotion) return;
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target.closest ? e.target.closest("a[href]") : null;
    if (!link || !isInternalPageLink(link)) return;
    e.preventDefault();
    document.body.classList.add("is-leaving");
    window.setTimeout(function () {
      window.location.href = link.href;
    }, 260);
  });

  /* Restore state when returning via back/forward cache */
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      document.body.classList.remove("is-leaving");
      var stale = document.querySelector(".preloader");
      if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
    }
  });

  /* Button icons — arrows on CTA links (skip full-width form buttons) */
  document
    .querySelectorAll("a.btn--solid, a.btn--ghost, a.btn--promo-ghost")
    .forEach(function (btn) {
      if (btn.querySelector(".btn__icon")) return;
      var icon = document.createElement("span");
      icon.className = "btn__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "\u2192";
      btn.appendChild(icon);
    });

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

  /* Custom dropdowns — brand-styled replacement for native selects */
  document.querySelectorAll(".book-form select").forEach(function (native) {
    var wrap = document.createElement("div");
    wrap.className = "custom-select";
    native.parentNode.insertBefore(wrap, native);
    wrap.appendChild(native);
    native.classList.add("custom-select__native");
    native.setAttribute("tabindex", "-1");
    native.setAttribute("aria-hidden", "true");

    var labelEl = native.closest("label");
    var labelText = labelEl ? labelEl.childNodes[0].textContent.trim() : "";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    if (labelText) trigger.setAttribute("aria-label", labelText);

    var valueEl = document.createElement("span");
    valueEl.className = "custom-select__value";
    var chevron = document.createElement("span");
    chevron.className = "custom-select__chevron";
    chevron.setAttribute("aria-hidden", "true");
    trigger.appendChild(valueEl);
    trigger.appendChild(chevron);

    var list = document.createElement("ul");
    list.className = "custom-select__list";
    list.setAttribute("role", "listbox");
    if (labelText) list.setAttribute("aria-label", labelText);

    var options = Array.prototype.slice.call(native.options);
    var current = native.selectedIndex < 0 ? 0 : native.selectedIndex;

    var items = options.map(function (opt, i) {
      var li = document.createElement("li");
      li.className = "custom-select__option";
      li.setAttribute("role", "option");
      li.textContent = opt.text;
      li.addEventListener("click", function () {
        choose(i);
        close(true);
      });
      list.appendChild(li);
      return li;
    });

    function render() {
      valueEl.textContent = options[current] ? options[current].text : "";
      items.forEach(function (li, i) {
        li.setAttribute("aria-selected", i === current ? "true" : "false");
      });
    }

    function choose(i) {
      current = i;
      native.selectedIndex = i;
      render();
    }

    function isOpen() {
      return wrap.classList.contains("is-open");
    }

    function open() {
      wrap.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function close(refocus) {
      wrap.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      if (refocus) trigger.focus();
    }

    trigger.addEventListener("click", function () {
      if (isOpen()) {
        close(false);
      } else {
        open();
      }
    });

    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen()) {
          open();
          return;
        }
        var next = current + (e.key === "ArrowDown" ? 1 : -1);
        choose(Math.min(Math.max(next, 0), options.length - 1));
      } else if (e.key === "Home" && isOpen()) {
        e.preventDefault();
        choose(0);
      } else if (e.key === "End" && isOpen()) {
        e.preventDefault();
        choose(options.length - 1);
      } else if ((e.key === "Enter" || e.key === " ") && isOpen()) {
        e.preventDefault();
        close(true);
      } else if (e.key === "Escape" && isOpen()) {
        close(true);
      }
    });

    document.addEventListener("click", function (e) {
      if (isOpen() && !wrap.contains(e.target)) close(false);
    });

    wrap.appendChild(trigger);
    wrap.appendChild(list);
    render();
  });

  document.querySelectorAll("form.book-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.classList.contains("is-loading")) {
        submitBtn.classList.add("is-loading");
        submitBtn.setAttribute("aria-busy", "true");
        var spinner = document.createElement("span");
        spinner.className = "btn__spinner";
        spinner.setAttribute("aria-hidden", "true");
        submitBtn.appendChild(spinner);
      }
      window.setTimeout(function () {
        window.location.href = "thank-you.html";
      }, reducedMotion ? 0 : 800);
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
