/*
  LC Fotografia — skrypty strony
  1. Menu mobilne
  2. Pasek rezerwacji na telefonie (chowa się przy formularzu)
  3. Proporcje zdjęć w galerii
  4. Filtr kategorii w portfolio (adres: portfolio.html#zespoly)
  5. Podgląd zdjęć na pełnym ekranie (strzałki, klawiatura, przesunięcie palcem)
  6. Formularze kontaktowe
*/
(function () {
  "use strict";

  var doc = document;
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* 1. Menu mobilne ------------------------------------------------------- */
  var toggle = $("[data-nav-toggle]");
  var menu = $("[data-mobile-menu]");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
      menu.hidden = !open;
      doc.documentElement.classList.toggle("menu-open", open);
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        setMenu(false);
        toggle.focus();
      }
    });
    var wide = window.matchMedia("(min-width: 861px)");
    var onWide = function (e) { if (e.matches) setMenu(false); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
  }

  /* 2. Pasek rezerwacji --------------------------------------------------- */
  var bar = $("[data-mobile-bar]");
  var formArea = $("#kontakt") || $("#formularz");
  if (bar && formArea && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle("is-hidden", entries[0].isIntersecting);
    }, { threshold: 0.1 }).observe(formArea);
  }

  /* 3. Proporcje zdjęć w galerii ----------------------------------------- */
  $$(".g-item img").forEach(function (img) {
    var setRatio = function () {
      var w = img.naturalWidth || Number(img.getAttribute("width"));
      var h = img.naturalHeight || Number(img.getAttribute("height"));
      if (w && h) img.parentElement.style.setProperty("--r", (w / h).toFixed(4));
    };
    if (img.complete && img.naturalWidth) setRatio();
    else img.addEventListener("load", setRatio);
  });

  /* 4. Filtr portfolio ----------------------------------------------------- */
  var filters = $("[data-filters]");
  var filterGallery = $("[data-gallery][data-filterable]");
  if (filters && filterGallery) {
    var buttons = $$("[data-filter]", filters);
    var items = $$(".g-item", filterGallery);
    var intros = $$("[data-cat-intro]");
    var empty = $("[data-gallery-empty]");
    var known = buttons.map(function (b) { return b.getAttribute("data-filter"); });

    var applyFilter = function (cat, writeHash) {
      if (known.indexOf(cat) === -1) cat = "wszystkie";
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === cat));
      });
      var shown = 0;
      items.forEach(function (item) {
        var cats = (item.getAttribute("data-cat") || "").split(/\s+/);
        var match = cat === "wszystkie" || cats.indexOf(cat) !== -1;
        item.hidden = !match;
        if (match) shown += 1;
      });
      intros.forEach(function (p) { p.hidden = p.getAttribute("data-cat-intro") !== cat; });
      if (empty) empty.hidden = shown > 0;
      if (writeHash) {
        try { history.replaceState(null, "", "#" + cat); } catch (err) { /* podgląd bez historii */ }
      }
    };

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter"), true); });
    });
    var fromHash = function () {
      var cat = "wszystkie";
      try { cat = decodeURIComponent(location.hash.slice(1)) || "wszystkie"; } catch (err) { /* zły adres */ }
      applyFilter(cat, false);
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  /* 5. Podgląd zdjęć ------------------------------------------------------- */
  var dialog = $("[data-lightbox-dialog]");
  if (dialog && typeof dialog.showModal === "function") {
    var lbImg = $("[data-lb-img]", dialog);
    var lbCaption = $("[data-lb-caption]", dialog);
    var lbCount = $("[data-lb-count]", dialog);
    var lbStage = $("[data-lb-stage]", dialog);
    var list = [];
    var current = 0;
    var opener = null;

    var showAt = function (i) {
      if (!list.length) return;
      current = (i + list.length) % list.length;
      var link = list[current];
      var thumb = $("img", link);
      lbImg.src = link.getAttribute("href");
      lbImg.alt = thumb ? thumb.alt : "";
      lbCaption.textContent = link.getAttribute("data-caption") || (thumb ? thumb.alt : "");
      lbCount.textContent = (current + 1) + " / " + list.length;
      var next = list[(current + 1) % list.length];
      if (next) { var pre = new Image(); pre.src = next.getAttribute("href"); }
    };

    doc.addEventListener("click", function (e) {
      var link = e.target.closest("[data-gallery] .g-item");
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var gallery = link.closest("[data-gallery]");
      list = $$(".g-item", gallery).filter(function (it) { return !it.hidden; });
      opener = link;
      showAt(list.indexOf(link));
      dialog.showModal();
    });

    $("[data-lb-prev]", dialog).addEventListener("click", function () { showAt(current - 1); });
    $("[data-lb-next]", dialog).addEventListener("click", function () { showAt(current + 1); });
    $("[data-lb-close]", dialog).addEventListener("click", function () { dialog.close(); });

    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); showAt(current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); showAt(current + 1); }
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target === lbStage) dialog.close();
    });
    dialog.addEventListener("close", function () {
      lbImg.removeAttribute("src");
      if (opener) opener.focus();
    });

    var startX = null;
    var startY = null;
    dialog.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    dialog.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showAt(current + (dx < 0 ? 1 : -1));
      else if (dy > 100 && Math.abs(dy) > Math.abs(dx)) dialog.close();
      startX = startY = null;
    });
  }

  /* 6. Formularze ----------------------------------------------------------
     Wysyłka idzie na adres z site.json → "form_endpoint" (np. Formspree).
     Bez adresu formularz pokazuje komunikat z prośbą o telefon lub e-mail. */
  $$("[data-form]").forEach(function (form) {
    var status = $("[data-form-status]", form);
    var submit = $('button[type="submit"]', form);
    var say = function (text, state) {
      status.textContent = text;
      status.setAttribute("data-state", state || "");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (form.elements.website && form.elements.website.value) return; // pułapka na boty

      var endpoint = (form.getAttribute("data-endpoint") || "").trim();
      if (!endpoint) {
        say("Wysyłka formularza nie jest jeszcze włączona. Zadzwoń albo napisz e-mail, dane kontaktowe są obok.", "info");
        return;
      }

      submit.disabled = true;
      say("Wysyłanie…", "");
      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          say("Dziękuję, wiadomość dotarła. Odpowiem w ciągu " + (form.getAttribute("data-reply-time") || "24 godzin") + ".", "ok");
        })
        .catch(function () {
          say("Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę albo zadzwoń.", "err");
        })
        .then(function () { submit.disabled = false; });
    });
  });
})();
