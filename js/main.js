/**
 * RE:PIUM 사업계획서 — Main Interactions
 * Starbucks-inspired: smooth, measured, café-like
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollSpy();
  initMobileNav();
  initRevealAnimations();
  initCounterAnimations();
});

/* --- Smooth Scroll Navigation --- */
function initNavigation() {
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        const offset = 20;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        // Close mobile nav
        document.querySelector('.nav-sidebar').classList.remove('open');
        const overlay = document.querySelector('.nav-overlay');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });
}

/* --- Scroll Spy --- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-15% 0px -75% 0px',
    threshold: 0
  });

  sections.forEach(section => observer.observe(section));
}

/* --- Mobile Navigation --- */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const sidebar = document.querySelector('.nav-sidebar');
  const overlay = document.querySelector('.nav-overlay');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

/* --- Reveal on Scroll (fade + slide up) --- */
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  });

  reveals.forEach(el => observer.observe(el));
}

/* --- Counter Animation (numbers count up) --- */
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-counter]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-counter'));
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = el.getAttribute('data-decimals') || 0;
        const duration = 1200;

        animateCounter(el, 0, target, duration, prefix, suffix, parseInt(decimals));
        observer.unobserve(el);
      }
    });
  }, {
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.2
  });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el, start, end, duration, prefix, suffix, decimals) {
  const startTime = performance.now();
  const diff = end - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + diff * eased;

    if (decimals > 0) {
      el.textContent = prefix + current.toFixed(decimals) + suffix;
    } else {
      el.textContent = prefix + Math.round(current).toLocaleString() + suffix;
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}
