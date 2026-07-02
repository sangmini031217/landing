/**
 * Jeju FarmLink AI - main.js
 * Handles: hamburger menu, smooth scroll, header scroll effect, fade-in animations
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ===========================
     1. Hamburger Menu
     =========================== */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close on mobile nav link click
    mobileNav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }

  /* ===========================
     2. Smooth Scroll
     =========================== */
  function scrollToSection(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    const headerH = document.querySelector('.header') ?
      document.querySelector('.header').offsetHeight : 68;
    const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // All nav links (desktop + mobile) with href="#..."
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      e.preventDefault();
      scrollToSection(targetId);
    });
  });

  // CTA buttons with data-target
  document.querySelectorAll('[data-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      scrollToSection(this.getAttribute('data-target'));
    });
  });

  /* ===========================
     3. Header Scroll Effect
     =========================== */
  const header = document.querySelector('.header');

  function handleHeaderScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  /* ===========================
     4. Fade-in on Scroll (IntersectionObserver)
     =========================== */
  const fadeEls = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window && fadeEls.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ===========================
     5. Dashboard animated bar (optional polish)
     =========================== */
  const barFill = document.querySelector('.hero-card-bar-fill');
  if (barFill) {
    setTimeout(function () {
      barFill.style.width = '72%';
    }, 600);
  }

  /* ===========================
     6. Hero "AI 수확 예측" 카드 → 상세 페이지 이동
     =========================== */
  var harvestCard = document.getElementById('heroHarvestCard');
  if (harvestCard) {
    harvestCard.addEventListener('click', function () {
      window.location.href = 'pages/ai-harvest.html';
    });
    harvestCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = 'pages/ai-harvest.html';
      }
    });
  }

  /* ===========================
     7. Hero "수확 알림" 카드 → 실시간 모니터링 페이지 이동
     =========================== */
  var monitorCard = document.getElementById('heroMonitorCard');
  if (monitorCard) {
    monitorCard.addEventListener('click', function () {
      window.location.href = 'pages/monitoring.html';
    });
    monitorCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = 'pages/monitoring.html';
      }
    });
  }

  /* ===========================
     8. Hero "차량 매칭" 카드 → 차량 매칭 페이지 이동
     =========================== */
  var vehicleCard = document.getElementById('heroVehicleCard');
  if (vehicleCard) {
    vehicleCard.addEventListener('click', function () {
      window.location.href = 'pages/vehicle-matching.html';
    });
    vehicleCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = 'pages/vehicle-matching.html';
      }
    });
  }

});
  if (harvestCard) {
    // 클릭으로 이동
    harvestCard.addEventListener('click', function () {
      window.location.href = 'pages/ai-harvest.html';
    });
    // 키보드 접근성 (Enter / Space)
    harvestCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = 'pages/ai-harvest.html';
      }
    });
  }
