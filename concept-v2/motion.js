/* Motion layer shared by concepts A and B. No libraries.
   Reveal on scroll with stagger, masked headlines, counters, parallax, scroll-rotated shapes, custom cursor.
   Does nothing under prefers-reduced-motion; the CSS keeps every element visible unless html.mo is set. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var html = document.documentElement;
  html.classList.add('mo');

  /* Masked headlines: wrap each word so it can slide up from under the line. */
  document.querySelectorAll('[data-mo="mask"]').forEach(function (el) {
    var nodes = Array.prototype.slice.call(el.childNodes);
    var i = 0;
    el.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType !== 3) { el.appendChild(n); return; }
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
        var o = document.createElement('span'); o.className = 'mo-w';
        var s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
        o.appendChild(s); el.appendChild(o);
      });
    });
  });

  /* Stagger: a parent with data-mo-stagger="80" hands its children incremental delays. */
  document.querySelectorAll('[data-mo-stagger]').forEach(function (p) {
    var step = parseInt(p.getAttribute('data-mo-stagger'), 10) || 80;
    var kind = p.getAttribute('data-mo-kind') || 'up';
    Array.prototype.forEach.call(p.children, function (c, i) {
      if (!c.hasAttribute('data-mo')) c.setAttribute('data-mo', kind);
      c.style.setProperty('--d', (i * step) + 'ms');
    });
  });
  document.querySelectorAll('[data-mo-delay]').forEach(function (el) {
    el.style.setProperty('--d', el.getAttribute('data-mo-delay') + 'ms');
  });

  /* Counters: count up to the number already in the markup, keeping its suffix and digit grouping. */
  function countUp(el) {
    var txt = el.textContent;
    var m = txt.match(/^([\d\s ]+)(.*)$/);
    if (!m) return;
    var n = parseInt(m[1].replace(/\D/g, ''), 10);
    if (!n) return;
    var gap = /[\s ]$/.test(m[1]) ? ' ' : '';
    var suf = m[2];
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.style.display = 'inline-block';
    var t0 = null, dur = 1400;
    function fmt(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(n * e)) + gap + suf;
      if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    }
    requestAnimationFrame(step);
  }

  /* Reveal observer. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      if (en.target.hasAttribute('data-count')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-mo]').forEach(function (el) { io.observe(el); });
  /* counters that are not inside a revealed element */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    if (!el.closest('[data-mo]')) io.observe(el);
  });

  /* Scroll-driven: parallax images and rotated shapes. Desktop only; phones get reveals and counters. */
  var wide = window.matchMedia('(min-width: 1024px)').matches;
  var par = wide ? Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')) : [];
  var shapes = wide ? Array.prototype.slice.call(document.querySelectorAll('[data-rotate]')) : [];
  var top = document.querySelector('.top');
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (top) top.classList.toggle('is-scrolled', y > 8);
    par.forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-parallax')) || .2;
      var box = (el.closest('[data-parallax-box]') || el.parentElement).getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      if (el.hasAttribute('data-parallax-hero')) {
        el.style.translate = '0 ' + (y * k).toFixed(1) + 'px';
      } else {
        var prog = (box.top + box.height / 2 - vh / 2) / vh;   /* -1 .. 1 */
        el.style.translate = '0 ' + (-prog * k * 100).toFixed(1) + 'px';
      }
    });
    shapes.forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-rotate')) || .02;
      el.style.setProperty('--rot', (y * k).toFixed(2) + 'deg');
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (par.length || shapes.length || top) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }

  /* Custom cursor: a dot and a lagging ring, only with a real mouse on a wide screen. */
  if (wide && window.matchMedia('(pointer: fine)').matches) {
    var cur = document.createElement('div');
    cur.className = 'cur';
    cur.innerHTML = '<span class="cur__dot"></span><span class="cur__ring"></span>';
    document.body.appendChild(cur);
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; html.classList.add('cur-on'); loop(); }
      var t = e.target;
      cur.classList.toggle('is-link', !!(t.closest && t.closest('a, button, [data-cur]')));
      cur.classList.toggle('is-text', !!(t.closest && t.closest('input, textarea')));
    });
    document.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { html.classList.remove('cur-on'); });
    document.addEventListener('mouseenter', function () { if (shown) html.classList.add('cur-on'); });
    var dot = cur.firstChild, ring = cur.lastChild;
    function loop() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      dot.style.translate = mx + 'px ' + my + 'px';
      ring.style.translate = rx.toFixed(1) + 'px ' + ry.toFixed(1) + 'px';
      requestAnimationFrame(loop);
    }
  }
})();
