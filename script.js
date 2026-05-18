gsap.registerPlugin(ScrollTrigger);

// HERO ANIMATIONS
gsap.to("#heroVideo", {
  yPercent: 12, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
});

const tl = gsap.timeline({ delay: 0.2 });
tl.to("#heroTag",   { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" })
  .to("#heroTitle", { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, "-=0.3")
  .to("#heroSub",   { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.4")
  .to("#heroCtas",  { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.3")
  .to("#heroStats", { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.2");

// HERO COUNT-UP
function countUp(el, target, duration) {
  const suffix = el.dataset.suffix || '';
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start).toLocaleString('uk-UA') + suffix;
  }, 16);
}
setTimeout(() => {
  document.querySelectorAll(".hero-stat .num").forEach(el => {
    countUp(el, parseInt(el.dataset.target), 1800);
  });
}, 1200);

// SCROLL FADE-UP
gsap.utils.toArray(".fade-up").forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.75,
    ease: "power2.out",
    delay: (i % 4) * 0.08,
    scrollTrigger: {
      trigger: el, start: "top 88%", toggleActions: "play none none none"
    }
  });
});

// STATS COUNT-UP ON SCROLL
document.querySelectorAll(".stat-num").forEach(el => {
  ScrollTrigger.create({
    trigger: el,
    start: "top 85%",
    once: true,
    onEnter: () => countUp(el, parseInt(el.dataset.target), 1600)
  });
});

// ABOUT PHOTOS — staggered scroll reveal (each photo has its own trigger)
gsap.utils.toArray(".about-photo").forEach((el, i) => {
  gsap.to(el, {
    clipPath: "inset(0% 0 0 0)",
    duration: 1.0,
    ease: "power3.out",
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => el.classList.add("is-revealed")
    }
  });
});

// STICKY HEADER
window.addEventListener("scroll", () => {
  document.getElementById("header").classList.toggle("scrolled", window.scrollY > 60);
});

// TABS
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    // Re-trigger animations for newly shown cards
    gsap.utils.toArray("#tab-" + btn.dataset.tab + " .fade-up").forEach((el, i) => {
      gsap.fromTo(el, {opacity: 0, y: 30}, {
        opacity: 1, y: 0, duration: 0.5,
        ease: "power2.out", delay: i * 0.04
      });
    });
  });
});