// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// "Currently serving" indicator based on time of day
function getServingPeriod(hour) {
  if (hour >= 6 && hour < 11) return 'Breakfast is on right now';
  if (hour >= 11 && hour < 16) return 'Lunch is on right now';
  if (hour >= 16 && hour < 22) return 'Dinner is on right now';
  return 'Late night bites and the bar are open';
}

const servingText = document.getElementById('serving-text');
if (servingText) {
  const hour = new Date().getHours();
  servingText.textContent = getServingPeriod(hour);
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Scroll-triggered entrance animation for category cards and story copy
const revealTargets = document.querySelectorAll('.category-card, .story-copy');
if (revealTargets.length && 'IntersectionObserver' in window) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    revealTargets.forEach(el => el.classList.add('in-view'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach(el => observer.observe(el));
  }
} else {
  revealTargets.forEach(el => el.classList.add('in-view'));
}
