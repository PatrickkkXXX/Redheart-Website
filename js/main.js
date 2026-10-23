/* =============================================================
   Redheart Glass & Aluminum Supply — main.js
   -------------------------------------------------------------
   1.  Preferences
   2.  Hero entrance
   3.  Header state & active section
   4.  Mobile navigation
   5.  Scroll progress & back to top
   6.  Scroll reveal
   7.  Statistic counters
   8.  Process line
   9.  Capability ticker
   10. Gallery lightbox
   11. Enquiry form
   12. Footer year
   ============================================================= */
(function () {
  'use strict';

  // Signal that the script is running so the HTML load-fallback stays off.
  document.documentElement.classList.add('rh-ready');

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 1. Preferences ---------- */
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionQuery.matches;
  motionQuery.addEventListener('change', function (e) { reduced = e.matches; });

  /* ---------- 2. Hero entrance ---------- */
  (function heroEntrance() {
    var items = $$('[data-seq]');
    if (!items.length) return;

    if (reduced) {
      items.forEach(function (el) { el.style.opacity = '1'; });
      return;
    }

    items.forEach(function (el) {
      var delay = (0.1 + Number(el.dataset.seq) * 0.095).toFixed(3) + 's';
      if (el.classList.contains('mask')) {
        var inner = el.firstElementChild;
        if (!inner) return;
        inner.style.animationDelay = delay;
        inner.classList.add('line-in');
      } else {
        el.style.animationDelay = delay;
        el.classList.add('seq-in');
      }
    });
  })();

  /* ---------- 3. Header state & active section ---------- */
  var header = $('#header');
  var navLinks = $$('.primary-nav ul a');

  (function activeSection() {
    // Only in-page (#anchor) links drive the active state; external links
    // like the 3D Designer page are skipped.
    var hashLinks = navLinks.filter(function (a) {
      var h = a.getAttribute('href') || '';
      return h.charAt(0) === '#' && h.length > 1;
    });
    var sections = hashLinks
      .map(function (a) { return $(a.getAttribute('href')); })
      .filter(Boolean);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    var seen = new Map();
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { seen.set(entry.target.id, entry.intersectionRatio); });

      var best = '', bestRatio = 0;
      seen.forEach(function (ratio, id) {
        if (ratio > bestRatio) { bestRatio = ratio; best = id; }
      });

      navLinks.forEach(function (a) {
        a.classList.toggle('is-current', bestRatio > 0 && a.getAttribute('href') === '#' + best);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

    sections.forEach(function (s) { obs.observe(s); });
  })();

  /* ---------- 4. Mobile navigation ---------- */
  (function mobileNav() {
    var toggle = $('#menuToggle');
    var nav    = $('#primaryNav');
    var scrim  = $('#navScrim');
    if (!toggle || !nav || !scrim) return;

    var open = false;

    function setOpen(next) {
      open = next;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';

      if (open) {
        scrim.hidden = false;
        requestAnimationFrame(function () { scrim.classList.add('is-open'); });
      } else {
        scrim.classList.remove('is-open');
        window.setTimeout(function () { if (!open) scrim.hidden = true; }, 450);
      }
    }

    toggle.addEventListener('click', function () { setOpen(!open); });
    scrim.addEventListener('click', function () { setOpen(false); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setOpen(false); toggle.focus(); }
    });

    window.addEventListener('resize', function () {
      if (open && window.innerWidth > 920) setOpen(false);
    });
  })();

  /* ---------- 5. Scroll progress & back to top ---------- */
  (function scrollUi() {
    var bar   = $('#progress i');
    var toTop = $('#toTop');
    var ticking = false;

    function update() {
      var y = window.scrollY || document.documentElement.scrollTop;
      var max = document.documentElement.scrollHeight - window.innerHeight;

      if (bar) bar.style.width = (max > 0 ? Math.min(y / max, 1) * 100 : 0) + '%';
      if (header) header.classList.toggle('is-stuck', y > 24);
      if (toTop) toTop.classList.toggle('is-shown', y > 640);

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }
  })();

  /* ---------- 6. Scroll reveal ---------- */
  (function reveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { obs.observe(el); });
  })();

  /* ---------- 7. Statistic counters ---------- */
  (function counters() {
    var nodes = $$('.count');
    if (!nodes.length) return;

    if (reduced || !('IntersectionObserver' in window)) return;

    function run(el) {
      var target = Number(el.dataset.count) || 0;
      var duration = 1500;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(frame);
      }

      el.textContent = '0';
      requestAnimationFrame(frame);
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    nodes.forEach(function (el) { obs.observe(el); });
  })();

  /* ---------- 8. Process line ---------- */
  (function processLine() {
    var steps = $('#steps');
    if (!steps) return;

    if (reduced || !('IntersectionObserver' in window)) { steps.classList.add('is-drawn'); return; }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        steps.classList.add('is-drawn');
        obs.disconnect();
      });
    }, { threshold: 0.25 });

    obs.observe(steps);
  })();

  /* ---------- 9. Capability ticker ---------- */
  (function ticker() {
    var track = $('#tickerTrack');
    if (!track) return;
    var set = track.firstElementChild;
    if (!set) return;
    var clone = set.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  })();

  /* ---------- 10. Gallery lightbox ---------- */
  (function lightbox() {
    var box = $('#lightbox');
    var img = $('#lbImage');
    var cap = $('#lbCaption');
    var shots = $$('.gallery .shot');
    if (!box || !img || !shots.length) return;

    var index = 0;
    var lastFocused = null;

    var slides = shots.map(function (shot) {
      var picture = $('img', shot);
      return {
        src: picture ? picture.getAttribute('src') : '',
        alt: picture ? picture.getAttribute('alt') : '',
        caption: shot.dataset.caption || ''
      };
    });

    function render() {
      var slide = slides[index];
      img.style.opacity = '0';
      window.setTimeout(function () {
        img.src = slide.src;
        img.alt = slide.alt;
        cap.textContent = slide.caption;
        img.style.opacity = '1';
      }, reduced ? 0 : 140);
    }

    function open(i) {
      index = i;
      lastFocused = document.activeElement;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { box.classList.add('is-open'); });

      var slide = slides[index];
      img.src = slide.src;
      img.alt = slide.alt;
      img.style.opacity = '1';
      cap.textContent = slide.caption;
      $('#lbClose').focus();
    }

    function close() {
      box.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(function () { box.hidden = true; img.src = ''; }, 420);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function step(delta) {
      index = (index + delta + slides.length) % slides.length;
      render();
    }

    shots.forEach(function (shot, i) {
      shot.setAttribute('tabindex', '0');
      shot.setAttribute('role', 'button');
      shot.setAttribute('aria-label', 'View ' + (shot.dataset.caption || 'photograph') + ' at full size');
      shot.addEventListener('click', function () { open(i); });
      shot.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });

    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { step(-1); });
    $('#lbNext').addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape')     { close(); }
      if (e.key === 'ArrowLeft')  { step(-1); }
      if (e.key === 'ArrowRight') { step(1); }
      if (e.key === 'Tab') {
        var focusables = $$('button', box);
        var first = focusables[0];
        var last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  })();

  /* ---------- 11. Enquiry form ---------- */
  (function enquiry() {
    var form   = $('#enquiryForm');
    var status = $('#formStatus');
    var submit = $('#enquirySubmit');
    if (!form) return;

    var MESSENGER = 'https://m.me/RedHeart24';

    var rules = {
      firstName: { label: 'first name', test: function (v) { return v.length >= 2; }, msg: 'Please enter your first name.' },
      lastName:  { label: 'last name',  test: function (v) { return v.length >= 2; }, msg: 'Please enter your last name.' },
      phone:     { label: 'contact number', test: function (v) { return v.replace(/\D/g, '').length >= 7; }, msg: 'Please enter a contact number we can reach you on.' },
      service:   { label: 'scope of work', test: function (v) { return v !== ''; }, msg: 'Please choose the scope of work.' },
      message:   { label: 'project details', test: function (v) { return v.length >= 10; }, msg: 'Please add a little more detail (at least 10 characters).' }
    };

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input, showError) {
      var rule = rules[input.name];
      if (!rule) return true;

      var ok = rule.test(input.value.trim());
      var wrap = fieldOf(input);
      var slot = wrap ? $('[data-error-for="' + input.name + '"]', wrap) : null;

      if (wrap) wrap.classList.toggle('has-error', !ok && showError);
      if (slot) slot.textContent = ok ? '' : rule.msg;
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener('blur',  function () { validate(input, true); });
      input.addEventListener('input', function () {
        var wrap = fieldOf(input);
        if (wrap && wrap.classList.contains('has-error')) validate(input, true);
      });
      input.addEventListener('change', function () {
        var wrap = fieldOf(input);
        if (wrap && wrap.classList.contains('has-error')) validate(input, true);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      var valid = true;

      // Validate every field, not just up to the first failure.
      Object.keys(rules).forEach(function (name) {
        var input = form.elements[name];
        if (!input) return;
        if (!validate(input, true)) {
          valid = false;
          if (!firstInvalid) firstInvalid = input;
        }
      });

      if (!valid) {
        status.textContent = 'Please complete the highlighted fields before sending.';
        status.classList.remove('is-ok');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var data = {
        name:    form.elements.firstName.value.trim() + ' ' + form.elements.lastName.value.trim(),
        phone:   form.elements.phone.value.trim(),
        service: form.elements.service.value,
        message: form.elements.message.value.trim()
      };

      var body = [
        'Quotation request from the Redheart website.',
        '',
        'Name: ' + data.name,
        'Contact number: ' + data.phone,
        'Scope of work: ' + data.service,
        '',
        'Details:',
        data.message
      ].join('\n');

      window.open(MESSENGER + '?text=' + encodeURIComponent(body), '_blank', 'noopener');

      status.textContent = 'Messenger has opened in a new tab with your details. Send the message there to reach us.';
      status.classList.add('is-ok');
      submit.disabled = true;

      window.setTimeout(function () {
        form.reset();
        submit.disabled = false;
        $$('.field', form).forEach(function (f) { f.classList.remove('has-error'); });
      }, 1200);
    });
  })();

  /* ---------- 12. Footer year ---------- */
  (function year() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
