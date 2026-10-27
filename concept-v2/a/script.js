/* Concept A: mobile menu, sticky CTA visibility, demo form. */
(function () {
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');
  var body = document.body;

  function closeMenu() {
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  }

  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    if (open) { closeMenu(); return; }
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
  });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* Sticky CTA: hide while the hero actions or the form are on screen. */
  var sticky = document.querySelector('.sticky-cta');
  var watch = [document.querySelector('.hero .actions'), document.querySelector('#visit')].filter(Boolean);
  if ('IntersectionObserver' in window && sticky) {
    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      sticky.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.2 });
    watch.forEach(function (el) { io.observe(el); });
  }

  /* Hero video: load only on wide screens, after the page is ready, and never with reduced motion or data saver. */
  var video = document.querySelector('.hero__video video');
  var conn = navigator.connection || {};
  if (video && window.matchMedia('(min-width: 768px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !conn.saveData) {
    var toggle = document.querySelector('.video-toggle');
    window.addEventListener('load', function () {
      video.src = video.getAttribute('data-src');
      video.autoplay = true;
      video.play().then(function () { toggle.hidden = false; }).catch(function () {});
    });
    toggle.addEventListener('click', function () {
      if (video.paused) { video.play(); toggle.textContent = 'Пауза'; toggle.setAttribute('aria-pressed', 'false'); }
      else { video.pause(); toggle.textContent = 'Відтворити'; toggle.setAttribute('aria-pressed', 'true'); }
    });
  }

  /* Demo form: no backend in the concept. */
  var form = document.querySelector('.form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name=name]');
      var phone = form.querySelector('[name=phone]');
      var note = form.querySelector('.form__note');
      name.setAttribute('aria-invalid', String(!name.value.trim()));
      phone.setAttribute('aria-invalid', String(!phone.value.trim()));
      if (!name.value.trim() || !phone.value.trim()) {
        note.textContent = 'Вкажіть ім’я і телефон, щоб ми могли передзвонити.';
        note.classList.add('is-error');
        (name.value.trim() ? phone : name).focus();
        return;
      }
      note.classList.remove('is-error');
      note.textContent = 'Заявку записано. Передзвонимо у робочий час.';
      form.querySelector('button').disabled = true;
    });
  }
})();
