import './style.css';
import { initCursor } from './cursor.js';

// ============================================================
// 1. CUSTOM CURSOR FOLLOWER
// ============================================================
initCursor();


// ============================================================
// 2. SCROLL PROGRESS BAR
// ============================================================
const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrolled / maxScroll) * 100;
  if (scrollProgress) {
    scrollProgress.style.width = progress + '%';
  }
});

// ============================================================
// 3. HEADER SCROLL EFFECT
// ============================================================
const header = document.getElementById('main-header');
const marqueeSection = document.querySelector('.marquee-section');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header?.classList.add('scrolled');
    marqueeSection?.classList.add('scrolled');
  } else {
    header?.classList.remove('scrolled');
    marqueeSection?.classList.remove('scrolled');
  }
});

// ============================================================
// 4. HERO ENTRANCE ANIMATION SEQUENCE
// ============================================================
function animateHeroEntrance() {
  const timeline = [
    { el: '.anim-hero-badge', delay: 200 },
    { el: '.anim-hero-title', delay: 400 },
    { el: '.anim-hero-desc', delay: 700 },
    { el: '.anim-hero-actions', delay: 900 },
    { el: '.anim-hero-stats', delay: 1100 },
    { el: '.anim-hero-visual', delay: 600 },
  ];

  timeline.forEach(({ el, delay }) => {
    const element = document.querySelector(el);
    if (element) {
      setTimeout(() => {
        element.classList.add('animate-in');
      }, delay);
    }
  });

  // Animate individual words in title
  document.querySelectorAll('.title-word').forEach((word) => {
    const i = parseInt(word.style.getPropertyValue('--word-i'));
    setTimeout(() => {
      word.classList.add('word-visible');
    }, 500 + i * 120);
  });
}

// Run hero animation after page load
window.addEventListener('load', () => {
  setTimeout(animateHeroEntrance, 100);
});

// ============================================================
// 5. SCROLL REVEAL SYSTEM (IntersectionObserver based)
// ============================================================
const revealObserverOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -80px 0px'
};

// Single element reveals
const scrollRevealEls = document.querySelectorAll('.scroll-reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const revealType = entry.target.dataset.reveal || 'fade-up';
      entry.target.classList.add('revealed', `reveal-${revealType}`);
      revealObserver.unobserve(entry.target);
    }
  });
}, revealObserverOptions);
scrollRevealEls.forEach(el => revealObserver.observe(el));

// Stagger-children reveals
const staggerEls = document.querySelectorAll('.scroll-reveal-stagger');
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('stagger-revealed');
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
staggerEls.forEach(el => staggerObserver.observe(el));

// Legacy .reveal support
const legacyRevealElements = document.querySelectorAll('.reveal');
const legacyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
legacyRevealElements.forEach(el => legacyObserver.observe(el));

// ============================================================
// 6. ANIMATED COUNTERS
// ============================================================
const counters = document.querySelectorAll('.counter');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target;
      const target = parseInt(counter.dataset.target);
      const suffix = counter.dataset.suffix || '';
      let current = 0;
      const duration = 2000;
      const step = target / (duration / 16);

      function updateCounter() {
        current += step;
        if (current >= target) {
          current = target;
          counter.textContent = target.toLocaleString() + suffix;
        } else {
          counter.textContent = Math.floor(current).toLocaleString() + suffix;
          requestAnimationFrame(updateCounter);
        }
      }
      updateCounter();
      counterObserver.unobserve(counter);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

// ============================================================
// 7. PARALLAX FLOATING ORBS
// ============================================================
const ambientOrbs = document.querySelectorAll('.ambient-orb');
let scrollY = 0;

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  ambientOrbs.forEach(orb => {
    const speed = parseFloat(orb.dataset.speed);
    orb.style.transform = `translateY(${scrollY * speed}px)`;
  });
});

// ============================================================
// 8. 3D TILT CARDS ON HOVER
// ============================================================
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
  });
});

// ============================================================
// 9. MAGNETIC BUTTONS
// ============================================================
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});

// ============================================================
// 10. PARTICLE BACKGROUND (Ember System)
// ============================================================
const canvas = document.getElementById('bg-canvas');
const ctx = canvas?.getContext('2d');

if (canvas && ctx) {
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(100, Math.floor((width * height) / 15000));
  const mouse = { x: null, y: null, radius: 180 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Ember {
    constructor() {
      this.reset(true);
    }

    reset(randomY = false) {
      this.x = Math.random() * width;
      this.y = randomY ? Math.random() * height : height + 10;
      this.vx = (Math.random() - 0.5) * 0.2;
      this.vy = -0.2 - Math.random() * 0.5;
      this.radius = Math.random() * 2.5 + 0.5;
      this.life = 0.4 + Math.random() * 0.6;
      this.decay = 0.001 + Math.random() * 0.002;

      const colors = [
        'rgba(255, 107, 74, ',
        'rgba(255, 94, 58, ',
        'rgba(255, 165, 0, ',
        'rgba(232, 85, 58, ',
        'rgba(167, 139, 250, ',  // purple embers
      ];
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.vx += (Math.random() - 0.5) * 0.02;
      this.vx = Math.max(-0.4, Math.min(0.4, this.vx));

      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 0.8;
          this.y -= (dy / dist) * force * 0.8;
        }
      }

      if (this.life <= 0 || this.y < -10 || this.x < -10 || this.x > width + 10) {
        this.reset(false);
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      const alpha = this.life * 0.5;
      ctx.fillStyle = `${this.colorBase}${alpha})`;

      if (this.radius > 1.8) {
        ctx.shadowColor = 'rgba(255, 107, 74, 0.5)';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fill();
    }
  }

  // Connection lines between nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          const alpha = (1 - dist / 120) * 0.08;
          ctx.strokeStyle = `rgba(255, 107, 74, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Ember());
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    let bgGradient;
    if (mouse.x !== null) {
      bgGradient = ctx.createRadialGradient(mouse.x, mouse.y, 50, width / 2, height / 2, Math.max(width, height));
      bgGradient.addColorStop(0, '#0a0503');
      bgGradient.addColorStop(0.3, '#030303');
      bgGradient.addColorStop(1, '#030303');
    } else {
      bgGradient = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
      bgGradient.addColorStop(0, '#030303');
      bgGradient.addColorStop(1, '#030303');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.shadowBlur = 0;
    drawConnections();

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animateCanvas);
  }

  animateCanvas();
}

// ============================================================
// 11. LIVE MOCKUP FEED ROTATION
// ============================================================
const mockupFeed = document.getElementById('mockup-feed');
const mockIncidents = [
  { type: 'leakage', label: 'Leakage', text: 'Water main burst at Sector 4, causing heavy street flooding.', user: '@RohanSingh', time: 'Just now' },
  { type: 'garbage', label: 'Garbage', text: 'Stagnant garbage piles behind Market Square blocking the drain.', user: '@Nisha21', time: '1 min ago' },
  { type: 'pothole', label: 'Pothole', text: 'Dangerous crater reported near the flyover slip road.', user: '@VarunD', time: '4 mins ago' },
  { type: 'leakage', label: 'Leakage', text: 'Sewage overflow on 8th Cross street. Foul smell in area.', user: '@Aditya_K', time: '7 mins ago' },
  { type: 'garbage', label: 'Garbage', text: 'Construction waste dumped illegally in the forest reserve.', user: '@KunalM', time: '15 mins ago' }
];

let incidentIndex = 0;

function rotateIncident() {
  if (!mockupFeed) return;
  const currentItems = mockupFeed.querySelectorAll('.mockup-item');
  if (currentItems.length >= 3) {
    const oldest = currentItems[currentItems.length - 1];
    oldest.style.opacity = '0';
    oldest.style.transform = 'translateY(10px)';
    setTimeout(() => oldest.remove(), 300);
  }

  const data = mockIncidents[incidentIndex];
  const item = document.createElement('div');
  item.className = 'mockup-item';
  item.innerHTML = `
    <div class="mockup-item-top">
      <span class="mockup-tag tag-${data.type}">${data.label}</span>
      <span class="mockup-status status-active">
        <span class="status-pulse"></span>
        New Report
      </span>
    </div>
    <div class="mockup-item-body">${data.text}</div>
    <div class="mockup-item-bottom">
      <span>By ${data.user}</span>
      <span>${data.time}</span>
    </div>
  `;

  mockupFeed.insertBefore(item, mockupFeed.firstChild);
  incidentIndex = (incidentIndex + 1) % mockIncidents.length;
}

setInterval(rotateIncident, 4000);

// ============================================================
// 12. SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================================
// 13. TEXT SCRAMBLE / GLITCH effect for section subtitles on reveal
// ============================================================
function scrambleText(element) {
  const originalText = element.textContent;
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  let iteration = 0;

  const interval = setInterval(() => {
    element.textContent = originalText
      .split('')
      .map((letter, index) => {
        if (index < iteration) return originalText[index];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join('');

    if (iteration >= originalText.length) {
      clearInterval(interval);
    }
    iteration += 1 / 2;
  }, 30);
}

const subtitles = document.querySelectorAll('.section-subtitle');
const subtitleObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      scrambleText(entry.target);
      subtitleObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
subtitles.forEach(s => subtitleObserver.observe(s));

// ============================================================
// 14. HORIZONTAL SCROLL FOR FEATURES SECTION ON SCROLL (LERP PHYSICS)
// ============================================================
const featuresSection = document.querySelector('.features');
const featuresTrack = document.getElementById('features-track');

let targetX = 0;
let currentX = 0;
let isAnimating = false;
const ease = 0.08; // Easing inertia factor (smaller = smoother trailing, larger = faster snapping)

function animateScroll() {
  currentX += (targetX - currentX) * ease;
  
  if (featuresTrack) {
    featuresTrack.style.transform = `translateX(${currentX}px)`;
  }

  // Stop the animation frame loop if we're close enough to the target coordinates to save CPU
  if (Math.abs(targetX - currentX) < 0.1) {
    currentX = targetX;
    if (featuresTrack) {
      featuresTrack.style.transform = `translateX(${currentX}px)`;
    }
    isAnimating = false;
    return;
  }

  requestAnimationFrame(animateScroll);
}

function handleHorizontalScroll() {
  if (!featuresSection || !featuresTrack || window.innerWidth <= 968) {
    if (featuresTrack) featuresTrack.style.transform = 'none';
    return;
  }

  const rect = featuresSection.getBoundingClientRect();
  const totalScroll = rect.height - window.innerHeight;
  
  let scrolled = -rect.top;
  let progress = scrolled / totalScroll;
  progress = Math.max(0, Math.min(1, progress));

  const trackWidth = featuresTrack.scrollWidth;
  const containerWidth = featuresTrack.parentElement.clientWidth;
  const maxTranslate = Math.max(0, trackWidth - containerWidth);

  targetX = -progress * maxTranslate;

  // Start the requestAnimationFrame animation frame loop if it's currently idle
  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(animateScroll);
  }
}

window.addEventListener('scroll', handleHorizontalScroll);
window.addEventListener('resize', () => {
  if (window.innerWidth <= 968 && featuresTrack) {
    featuresTrack.style.transform = 'none';
    targetX = 0;
    currentX = 0;
  } else {
    handleHorizontalScroll();
  }
});
handleHorizontalScroll();
