/* Motion layer shared by concepts A and B. No libraries.
   A «Спільнота»: a route from the first CTA to the form; the façade assembles; people get joined by a line.
   B «Спадщина»: an album that develops into focus; chronicle rules; odometer digits; paper lifts off photos.
   Does nothing under prefers-reduced-motion; the CSS keeps everything visible unless html.mo is set. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var html = document.documentElement;
  var wide = window.matchMedia('(min-width: 1024px)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  html.classList.add('mo');
  html.classList.add('mo-init'); /* no transitions while the hidden start states are applied */
  if (fine) html.classList.add('fine');

  /* Masked headlines: wrap each word so it can rise from under the line. */
  var masked = document.querySelectorAll('[data-mo="mask"]');
  masked.forEach(function (el) {
    var nodes = Array.prototype.slice.call(el.childNodes), i = 0;
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
  /* Line mode: words on the same line share one delay, so a quote arrives line by line. */
  function lineIndex() {
    document.querySelectorAll('[data-mo="mask"][data-mo-lines]').forEach(function (el) {
      var tops = [], words = el.querySelectorAll('.mo-w > span');
      words.forEach(function (s) {
        var t = Math.round(s.parentNode.offsetTop / 4);
        if (tops.indexOf(t) < 0) tops.push(t);
        s.style.setProperty('--i', tops.indexOf(t));
      });
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lineIndex); else lineIndex();
  window.addEventListener('resize', lineIndex);

  /* Stagger: a parent with data-mo-stagger="80" hands its children incremental delays; "rand" scatters them. */
  document.querySelectorAll('[data-mo-stagger]').forEach(function (p) {
    var v = p.getAttribute('data-mo-stagger'), step = parseInt(v, 10) || 80;
    var kind = p.getAttribute('data-mo-kind') || 'up';
    Array.prototype.forEach.call(p.children, function (c, i) {
      if (c.classList.contains('shape')) return; /* decorative panels move by scroll, not by reveal */
      if (!c.hasAttribute('data-mo')) c.setAttribute('data-mo', kind);
      c.style.setProperty('--d', (v === 'rand' ? Math.round(Math.random() * 520) : i * step) + 'ms');
    });
  });
  document.querySelectorAll('[data-mo-delay]').forEach(function (el) { el.style.setProperty('--d', el.getAttribute('data-mo-delay') + 'ms'); });

  /* Odometer (B): each digit becomes a column 0–9 that rolls to its value when revealed. Built up front so layout is stable. */
  document.querySelectorAll('[data-count="roll"]').forEach(function (el) {
    var txt = el.textContent, k = 0, frag = document.createDocumentFragment();
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = txt; frag.appendChild(sr);
    Array.prototype.forEach.call(txt, function (ch) {
      var o = document.createElement('span'); o.setAttribute('aria-hidden', 'true');
      if (/\d/.test(ch)) {
        o.className = 'od';
        var col = document.createElement('span'); col.className = 'od__col';
        for (var d = 0; d <= 9; d++) { var s = document.createElement('span'); s.textContent = d; col.appendChild(s); }
        col.style.setProperty('--n', ch); col.style.setProperty('--k', k++);
        o.appendChild(col);
      } else { o.className = 'od od--s'; o.textContent = ch; }
      frag.appendChild(o);
    });
    el.textContent = ''; el.appendChild(frag);
  });

  /* Count-up (A): count to the number already in the markup, keeping its suffix and grouping. */
  function countUp(el) {
    var txt = el.textContent, m = txt.match(/^([\d\s ]+)(.*)$/);
    if (!m) return;
    var n = parseInt(m[1].replace(/\D/g, ''), 10);
    if (!n) return;
    var gap = /[\s ]$/.test(m[1]) ? ' ' : '', suf = m[2], t0 = null, dur = 1400;
    el.style.minWidth = el.getBoundingClientRect().width + 'px'; el.style.display = 'inline-block';
    function fmt(v) { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(n * e)) + gap + suf;
      if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    }
    requestAnimationFrame(step);
  }

  /* Apply the start states without transitions (a layout forced by another script may already have styled the page). */
  void document.body.offsetWidth;
  html.classList.remove('mo-init');

  /* Reveal observer. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]:not([data-count="roll"])').forEach(countUp);
      if (en.target.hasAttribute('data-count') && en.target.getAttribute('data-count') !== 'roll') countUp(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('[data-mo]').forEach(function (el) { io.observe(el); });
  document.querySelectorAll('[data-count]').forEach(function (el) { if (!el.closest('[data-mo]')) io.observe(el); });

  /* Connect (A): a line the alumni portraits hang from, drawn once the block is on screen. Tablet and up.
     Runs along the top tangent of the portraits, not through their centres: a line across the middle of a row reads as a strike-through. */
  var connects = window.matchMedia('(min-width: 768px)').matches ? Array.prototype.slice.call(document.querySelectorAll('[data-connect]')) : [];
  connects.forEach(function (box) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'connect'); svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(path); box.appendChild(svg);
    function geo() {
      var b = box.getBoundingClientRect(), d = '';
      /* layout offsets (relative to the box), not client rects: the cards are still shifted down by their entrance transition when this runs */
      box.querySelectorAll('.person img, .person__ph').forEach(function (a, i) {
        var x = a.offsetWidth / 2, y = 1, o = a;
        while (o && o !== box) { x += o.offsetLeft; y += o.offsetTop; o = o.offsetParent; }
        d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      });
      svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
      path.setAttribute('d', d);
      path.style.setProperty('--L', Math.ceil(path.getTotalLength()));
    }
    geo(); window.addEventListener('resize', geo); window.addEventListener('load', geo);
  });

  /* Route (A): a line beside the text, from the first CTA down into the first admission step, drawn by scrolling; a runner leads. */
  /* Off in a/ since 04.11 (the first version lived on the margin and read as a template timeline); on in a-route/ (main[data-route]) and with ?route. */
  var main = document.querySelector('main[data-route]');
  if (!main && /[?&]route\b/.test(location.search) && document.body.classList.contains('theme-a')) main = document.querySelector('main');
  var route = null;
  if (main && wide) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'route'); svg.setAttribute('aria-hidden', 'true');
    var line = document.createElementNS(ns, 'path'); svg.appendChild(line);
    var secs = Array.prototype.slice.call(main.querySelectorAll('section[id]'));
    var dots = secs.map(function (s) {
      var c = document.createElementNS(ns, 'circle'); c.setAttribute('class', 'dot'); c.setAttribute('r', 6);
      c.style.setProperty('--c', s.getAttribute('data-route-color') || '#7859C0'); svg.appendChild(c); return c;
    });
    var runner = document.createElementNS(ns, 'circle'); runner.setAttribute('class', 'runner'); runner.setAttribute('r', 7); svg.appendChild(runner);
    main.appendChild(svg);
    route = { h: 0, w: 0, L: 0, ys: [], s: 0, e: 1 };
    /* Layout coordinates (offset chain up to main): entrance transitions translate and scale the blocks, so client rects lie until they finish. */
    var off = function (el) { var x = 0, y = 0, o = el; while (o && o !== main) { x += o.offsetLeft; y += o.offsetTop; o = o.offsetParent; } return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight }; };
    route.geo = function () {
      var top = main.getBoundingClientRect().top + window.scrollY;
      var wrap = main.querySelector('.hero .wrap');
      var content = off(wrap).x + parseFloat(getComputedStyle(wrap).paddingLeft);
      var x = Math.round(content - 44);  /* a fixed distance from the text, not the middle of whatever margin is left */
      route.h = main.scrollHeight; route.w = window.innerWidth;
      if (x < 28) { svg.style.display = 'none'; route.L = 0; return; }
      svg.style.display = '';
      var a = off(main.querySelector('.hero .actions'));
      var step = off(main.querySelector('#visit .steps li'));
      var y1 = a.y + a.h + 28;
      var ey = step.y + 14, ex = step.x + 14, R = 24;  /* centre of the first step's marker */
      line.setAttribute('d', 'M' + x + ' ' + y1 + ' V' + (ey - R) + ' Q' + x + ' ' + ey + ' ' + (x + R) + ' ' + ey + ' H' + (ex - 20));
      svg.setAttribute('width', ex + 20); svg.setAttribute('height', route.h); svg.setAttribute('viewBox', '0 0 ' + (ex + 20) + ' ' + route.h);
      route.L = line.getTotalLength();
      line.style.strokeDasharray = route.L; line.style.strokeDashoffset = route.L;
      route.ys = secs.map(function (s) { var h = off(s.querySelector('h2') || s); return h.y + h.h / 2; });
      dots.forEach(function (c, i) { c.setAttribute('cx', x); c.setAttribute('cy', route.ys[i]); });
      var vh = window.innerHeight, maxY = Math.max(0, document.documentElement.scrollHeight - vh);
      route.s = top + y1 - vh * .6;                         /* drawing starts when the CTA passes 60 % of the screen */
      route.e = Math.min(top + ey - vh * .72, maxY - 1);    /* and ends when the first step is on screen, or at the end of the page */
      if (route.e <= route.s) route.e = route.s + 1;
    };
    route.tick = function (y, vh) {
      if (main.scrollHeight !== route.h || window.innerWidth !== route.w) route.geo();
      if (!route.L) return;
      var p = Math.max(0, Math.min(1, (y - route.s) / (route.e - route.s)));
      line.style.strokeDashoffset = route.L * (1 - p);
      var pt = line.getPointAtLength(route.L * p);
      runner.setAttribute('cx', pt.x); runner.setAttribute('cy', pt.y);
      dots.forEach(function (c, i) { c.classList.toggle('lit', route.ys[i] <= pt.y + 4); });
    };
    route.geo(); window.addEventListener('load', route.geo); window.addEventListener('resize', route.geo);
  }

  /* Scroll-driven: parallax, rotated shapes, header state, route progress. */
  var par = wide ? Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')) : [];
  var shapes = wide ? Array.prototype.slice.call(document.querySelectorAll('[data-rotate]')) : [];
  var top = document.querySelector('.top'), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (top) top.classList.toggle('is-scrolled', y > 8);
    par.forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-parallax')) || .2;
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) return;
      if (el.hasAttribute('data-parallax-hero')) el.style.translate = '0 ' + (y * k).toFixed(1) + 'px';
      else el.style.translate = '0 ' + (-((box.top + box.height / 2 - vh / 2) / vh) * k * 100).toFixed(1) + 'px';
    });
    shapes.forEach(function (el) {
      var k = parseFloat(el.getAttribute('data-rotate')) || .02, base = y;
      /* parallax panels turn around their resting angle as their block passes the middle of the screen */
      if (el.hasAttribute('data-parallax')) { var pb = el.parentElement.getBoundingClientRect(); base = -(pb.top + pb.height / 2 - vh / 2); }
      el.style.setProperty('--rot', (base * k).toFixed(2) + 'deg');
    });
    if (route) route.tick(y, vh);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  /* A: the primary button floods from the cursor point. */
  if (fine) document.querySelectorAll('.theme-a .btn--primary').forEach(function (b) {
    b.addEventListener('mouseenter', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* Custom cursor: a dot and a lagging ring. Takes the colour of the section under it; shows "+" over photos. */
  if (wide && fine) {
    var cur = document.createElement('div'); cur.className = 'cur';
    cur.innerHTML = '<span class="cur__dot"></span><span class="cur__ring"></span>';
    document.body.appendChild(cur);
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false, dot = cur.firstChild, ring = cur.lastChild;
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; html.classList.add('cur-on'); loop(); }
      var t = e.target, c = t.closest ? t.closest('[data-cur-color]') : null;
      cur.style.setProperty('--cur', c ? c.getAttribute('data-cur-color') : '');
      cur.classList.toggle('is-view', !!(t.closest && t.closest('[data-cur="view"]')));
      cur.classList.toggle('is-link', !!(t.closest && t.closest('a, button')) && !(t.closest && t.closest('[data-cur="view"]')));
      cur.classList.toggle('is-text', !!(t.closest && t.closest('input, textarea')));
    });
    document.addEventListener('mousedown', function () { cur.classList.add('is-down'); });
    document.addEventListener('mouseup', function () { cur.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { html.classList.remove('cur-on'); });
    document.addEventListener('mouseenter', function () { if (shown) html.classList.add('cur-on'); });
    function loop() {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      dot.style.translate = mx + 'px ' + my + 'px';
      ring.style.translate = rx.toFixed(1) + 'px ' + ry.toFixed(1) + 'px';
      requestAnimationFrame(loop);
    }
  }
})();
