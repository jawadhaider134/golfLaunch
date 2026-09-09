/* ==========================================================================
   Launch Golf — interactions
   Vanilla JS only. All content lives in index.html; this file just moves it.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrollMode = reducedMotion ? 'auto' : 'smooth';

  /* ---------------------------------------------------------------- images
     Image slots stay empty until real files are dropped into /images.
     Hide any that fail so the placeholder gradient underneath shows through. */
  function markMissing(img) { img.classList.add('img-missing'); }

  $$('img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) {
      markMissing(img);
    } else {
      img.addEventListener('error', function () { markMissing(img); });
      img.addEventListener('load', function () { img.classList.remove('img-missing'); });
    }
  });

  /* ---------------------------------------------------------------- header */
  var header = $('.site-header');
  var onScroll = function () {
    header.classList.toggle('is-stuck', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------ mobile nav */
  var nav = $('#nav');
  var navToggle = $('#navToggle');

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    $$('.nav-link', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ----------------------------------------------------- active nav link */
  var sections = $$('section[id], header[id]');
  var navLinks = $$('.nav-link');

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------------------ accordion */
  $$('#accordion .acc-item').forEach(function (item, _i, items) {
    var head = $('.acc-head', item);

    head.addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');

      items.forEach(function (other) {
        other.classList.remove('is-open');
        $('.acc-head', other).setAttribute('aria-expanded', 'false');
      });

      if (willOpen) {
        item.classList.add('is-open');
        head.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* -------------------------------------------------------- coach carousel */
  var track = $('#coachTrack');

  if (track) {
    var step = function () {
      var card = $('.coach-card', track);
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    };

    var syncArrows = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      $$('[data-slide]').forEach(function (btn) {
        var isPrev = btn.dataset.slide === 'prev';
        btn.disabled = isPrev ? track.scrollLeft <= 2 : track.scrollLeft >= max;
      });
    };

    $$('[data-slide]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        track.scrollBy({ left: btn.dataset.slide === 'next' ? step() : -step(), behavior: scrollMode });
      });
    });

    track.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);
    syncArrows();
  }

  /* ---------------------------------------------------------- testimonials */
  var slides = $$('#testiSlides .testi-slide');
  var faces = $$('#testiFaces .face');

  if (slides.length) {
    var current = 0;

    var show = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) { slide.classList.toggle('is-active', i === current); });
      faces.forEach(function (face, i) { face.classList.toggle('is-active', i === current); });
    };

    faces.forEach(function (face) {
      face.addEventListener('click', function () { show(Number(face.dataset.index)); });
    });

    $$('[data-testi]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show(current + (btn.dataset.testi === 'next' ? 1 : -1));
      });
    });

    show(0);
  }

  /* ------------------------------------------------------- billing switch */
  var billing = $('#billing');

  if (billing) {
    $$('.switch-opt', billing).forEach(function (opt) {
      opt.addEventListener('click', function () {
        var mode = opt.dataset.billing;

        $$('.switch-opt', billing).forEach(function (other) {
          var active = other === opt;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', String(active));
        });

        // Prices are authored in the HTML as data-monthly / data-yearly.
        $$('.plan-price [data-monthly]').forEach(function (el) {
          var value = el.dataset[mode];
          if (value) el.textContent = value;
        });
      });
    });
  }

  /* -------------------------------------------------- reveal + count-up */
  var animateCount = function (el) {
    var target = Number(el.dataset.count);
    if (!target || el.dataset.done) return;
    el.dataset.done = '1';

    var suffix = el.dataset.suffix || '';
    var start = performance.now();
    var duration = 1200;

    var tick = function (now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  var reveals = $$('.reveal');
  var counters = $$('[data-count]');

  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        $$('[data-count]', entry.target).concat(
          entry.target.hasAttribute('data-count') ? [entry.target] : []
        ).forEach(animateCount);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      revealer.observe(el);
    });

    counters.forEach(function (el) { revealer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    counters.forEach(animateCount);
  }

  /* ------------------------------------------------------- smooth anchors */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      var target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 8;
      window.scrollTo({ top: Math.max(top, 0), behavior: scrollMode });
    });
  });
})();
