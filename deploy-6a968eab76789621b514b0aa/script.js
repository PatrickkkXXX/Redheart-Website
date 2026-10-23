/* Redheart Glass & Aluminum — Interactive Scripts */

/* 0. MOBILE HAMBURGER MENU */
const hamburger = document.getElementById('navHamburger');
const navLinksEl = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');
const closeNav = () => {
  hamburger.classList.remove('open');
  navLinksEl.classList.remove('open');
  navOverlay.classList.remove('active');
  document.body.style.overflow = '';
};
hamburger?.addEventListener('click', () => {
  const isOpen = navLinksEl.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  navOverlay.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
navOverlay?.addEventListener('click', closeNav);
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', closeNav));

/* 1. MOUSE GLOW TRAIL (keeps native cursor visible) */
const glowTrail = document.createElement('div');
glowTrail.className = 'mouse-glow';
document.body.appendChild(glowTrail);
let mgX = 0, mgY = 0, mgCX = 0, mgCY = 0;
document.addEventListener('mousemove', e => { mgX = e.clientX; mgY = e.clientY; });
(function animateGlow() {
  mgCX += (mgX - mgCX) * 0.08;
  mgCY += (mgY - mgCY) * 0.08;
  glowTrail.style.transform = `translate(${mgCX - 150}px,${mgCY - 150}px)`;
  requestAnimationFrame(animateGlow);
})();

/* 2. PARTICLE SPARKS ON HERO CLICK */
document.getElementById('hero').addEventListener('click', e => {
  for (let i = 0; i < 14; i++) spawnParticle(e.clientX, e.clientY);
});
function spawnParticle(x, y) {
  const p = document.createElement('div');
  p.className = 'spark';
  const angle = Math.random() * 360;
  const dist = 40 + Math.random() * 90;
  p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(angle*Math.PI/180)*dist}px;--dy:${Math.sin(angle*Math.PI/180)*dist}px;`;
  document.body.appendChild(p);
  p.addEventListener('animationend', () => p.remove());
}

/* 3. SCROLL REVEAL — fixed observer */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }, i * 90);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* 4. COUNTER ANIMATION */
function animateCounter(el, target, suffix) {
  let start = null;
  (function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / 2000, 1);
    el.textContent = Math.floor((1 - Math.pow(1 - p, 4)) * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(performance.now());
}
const statObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target, parseInt(entry.target.dataset.count), entry.target.dataset.suffix || '');
      statObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number').forEach(el => statObs.observe(el));

/* 5. STICKY NAV + ACTIVE LINK */
const navLinkEls = document.querySelectorAll('.nav-links a:not(.nav-cta)');
const sectionEls = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  document.querySelector('nav').style.boxShadow = window.scrollY > 40 ? '0 4px 40px rgba(0,0,0,0.6)' : 'none';
  let current = '';
  sectionEls.forEach(sec => { if (window.scrollY >= sec.offsetTop - 120) current = sec.id; });
  navLinkEls.forEach(a => a.classList.toggle('nav-active', a.getAttribute('href') === `#${current}`));
});

/* 6. 3D TILT ON SERVICE CARDS */
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width/2)  / (r.width/2);
    const dy = (e.clientY - r.top  - r.height/2) / (r.height/2);
    card.style.transition = 'none';
    card.style.transform = `perspective(900px) rotateY(${dx*7}deg) rotateX(${-dy*7}deg) translateY(-6px) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.55s cubic-bezier(.23,1,.32,1)';
    card.style.transform = '';
  });
});

/* 6B. ADVANCED 3D ROTATING CABINET EFFECT FOR GALLERY */
document.querySelectorAll('.gallery-item').forEach((item) => {
  const img = item.querySelector('img');
  const overlay = item.querySelector('.gallery-item-overlay');
  let autoRotateInterval;
  let isHovering = false;
  let rafId = null;

  // Setup 3D perspective
  item.style.perspective = '1200px';
  img.style.willChange = 'transform';
  img.style.transition = 'all 0.08s ease-out';

  // Mouse enter - start auto rotating cabinet
  item.addEventListener('mouseenter', () => {
    isHovering = true;
    let rotY = 0;
    
    // Smooth auto-rotation animation
    const autoRotate = () => {
      rotY += 3;
      if (rotY > 360) rotY = 0;
      img.style.transform = `perspective(1200px) rotateX(20deg) rotateY(${rotY}deg) rotateZ(8deg) scale(1.1)`;
      if (isHovering) {
        rafId = requestAnimationFrame(autoRotate);
      }
    };
    autoRotate();

    // Add glow effect
    img.style.filter = 'drop-shadow(0 0 30px rgba(192,21,42,0.4)) brightness(1.15)';
    if (overlay) overlay.style.opacity = '0';
  });

  // Mouse move - track rotation based on cursor
  item.addEventListener('mousemove', (e) => {
    if (!isHovering) return;
    
    const rect = item.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = (e.clientX - centerX) / rect.width;
    const mouseY = (e.clientY - centerY) / rect.height;
    
    // Cancel auto-rotate and use mouse position
    if (rafId) cancelAnimationFrame(rafId);
    
    const rotX = mouseY * 30;
    const rotY = mouseX * 45;
    const tiltZ = mouseX * 10;
    
    img.style.transition = 'none';
    img.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${tiltZ}deg) scale(1.15)`;
  });

  // Mouse leave - reset
  item.addEventListener('mouseleave', () => {
    isHovering = false;
    if (rafId) cancelAnimationFrame(rafId);
    
    img.style.transition = 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)';
    img.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)';
    img.style.filter = 'drop-shadow(0 0 0px rgba(0,0,0,0)) brightness(1)';
    if (overlay) overlay.style.opacity = '';
  });
});

/* 6C. INTERACTIVE LIGHT SHINE EFFECT ON CABINET IMAGES */
document.querySelectorAll('.gallery-item').forEach(item => {
  const img = item.querySelector('img');
  const shineLayer = document.createElement('div');
  shineLayer.className = 'shine-effect';
  shineLayer.style.cssText = `
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: inherit;
  `;
  item.appendChild(shineLayer);

  item.addEventListener('mouseenter', () => {
    shineLayer.style.opacity = '0.6';
  });

  item.addEventListener('mouseleave', () => {
    shineLayer.style.opacity = '0';
  });
});

/* 7. GALLERY LIGHTBOX */
const lb = document.createElement('div');
lb.className = 'lightbox';
lb.innerHTML = '<div class="lb-backdrop"></div><button class="lb-close">✕</button><button class="lb-prev">❮</button><button class="lb-next">❯</button><div class="lb-inner"><img class="lb-img" src="" alt=""><div class="lb-caption"></div></div>';
document.body.appendChild(lb);
const lbImg = lb.querySelector('.lb-img');
const lbCap = lb.querySelector('.lb-caption');
const gItems = [...document.querySelectorAll('.gallery-item')];
let lbIdx = 0;
const openLb = i => {
  lbIdx = i;
  lbImg.src = gItems[i].querySelector('img').src;
  lbCap.textContent = gItems[i].querySelector('.gallery-item-label')?.textContent || '';
  lb.classList.add('lb-active');
  document.body.style.overflow = 'hidden';
};
const closeLb = () => { lb.classList.remove('lb-active'); document.body.style.overflow = ''; };
const navLb = d => {
  lbIdx = (lbIdx + d + gItems.length) % gItems.length;
  lbImg.style.opacity = '0';
  setTimeout(() => {
    lbImg.src = gItems[lbIdx].querySelector('img').src;
    lbCap.textContent = gItems[lbIdx].querySelector('.gallery-item-label')?.textContent || '';
    lbImg.style.opacity = '1';
  }, 180);
};
gItems.forEach((item, i) => item.addEventListener('click', () => openLb(i)));
lb.querySelector('.lb-close').addEventListener('click', closeLb);
lb.querySelector('.lb-backdrop').addEventListener('click', closeLb);
lb.querySelector('.lb-prev').addEventListener('click', () => navLb(-1));
lb.querySelector('.lb-next').addEventListener('click', () => navLb(1));
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('lb-active')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft')  navLb(-1);
  if (e.key === 'ArrowRight') navLb(1);
});

/* 8. RIPPLE ON BUTTONS */
document.querySelectorAll('.btn-primary,.btn-outline,.form-submit,.nav-cta').forEach(btn => {
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.addEventListener('click', function(e) {
    const r = this.getBoundingClientRect();
    const rpl = document.createElement('span');
    rpl.className = 'ripple';
    rpl.style.cssText = 'left:' + (e.clientX - r.left) + 'px;top:' + (e.clientY - r.top) + 'px;';
    this.appendChild(rpl);
    rpl.addEventListener('animationend', () => rpl.remove());
  });
});

/* 9. MARQUEE PAUSE ON HOVER */
const mInner = document.querySelector('.marquee-inner');
document.querySelector('.marquee-strip')?.addEventListener('mouseenter', () => mInner.style.animationPlayState = 'paused');
document.querySelector('.marquee-strip')?.addEventListener('mouseleave', () => mInner.style.animationPlayState = 'running');

/* 10. HERO PARALLAX */
const heroImgEl = document.querySelector('.hero-img');
window.addEventListener('scroll', () => {
  if (heroImgEl) heroImgEl.style.transform = 'translateY(' + (window.scrollY * 0.28) + 'px)';
});

/* 11. TYPING EFFECT ON BADGE */
const badge = document.querySelector('.hero-badge');
if (badge) {
  const text = badge.textContent;
  badge.textContent = '';
  badge.style.opacity = '1';
  let bi = 0;
  const type = () => { if (bi < text.length) { badge.textContent += text[bi++]; setTimeout(type, 42); } };
  setTimeout(type, 700);
}

/* 12. SCROLL PROGRESS BAR */
const prog = document.createElement('div');
prog.className = 'scroll-progress';
document.body.appendChild(prog);
window.addEventListener('scroll', () => {
  prog.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + '%';
});

/* 13. BACK TO TOP */
const btt = document.createElement('button');
btt.className = 'back-to-top';
btt.innerHTML = '↑';
btt.title = 'Back to top';
document.body.appendChild(btt);
window.addEventListener('scroll', () => btt.classList.toggle('btt-visible', window.scrollY > 500));
btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* 14. FORM VALIDATION + SUBMIT → SMS to owner */
function handleSubmit(btn) {
  const section = btn.closest('section');
  const allInputs = section.querySelectorAll('.form-input,.form-textarea');
  const fields = [...allInputs];

  // Get values
  const firstName = fields[0]?.value.trim();
  const lastName  = fields[1]?.value.trim();
  const phone     = fields[2]?.value.trim();
  const service   = fields[3]?.value.trim();
  const message   = fields[4]?.value.trim();

  // Validate — all must be filled
  let valid = true;
  fields.forEach(inp => {
    const empty = !inp.value.trim();
    inp.style.borderColor = empty ? 'var(--red)' : '';
    inp.style.boxShadow   = empty ? '0 0 12px rgba(192,21,42,0.35)' : '';
    if (empty) valid = false;
  });

  if (!valid) {
    btn.textContent = '⚠ Please fill all fields';
    btn.style.background = '#7a3020';
    setTimeout(() => { btn.textContent = 'Send Message →'; btn.style.background = ''; }, 2500);
    return;
  }

  // Build the SMS text
  const smsText =
    'New inquiry from Redheart Website!\n' +
    '----------------------------\n' +
    'Name: ' + firstName + ' ' + lastName + '\n' +
    'Phone: ' + phone + '\n' +
    'Service: ' + service + '\n' +
    'Message: ' + message;

  // Build the pre-filled Messenger message
  const messengerText =
    'Hi Redheart! I found you through your website.\n\n' +
    'Name: ' + firstName + ' ' + lastName + '\n' +
    'Phone: ' + phone + '\n' +
    'Service Needed: ' + service + '\n' +
    'Message: ' + message;

  // Open Facebook Messenger to Redheart page with pre-filled message
  const messengerURL = 'https://m.me/RedHeart24?text=' + encodeURIComponent(messengerText);
  window.open(messengerURL, '_blank');

  // Success state
  btn.textContent = '✓ Opening Messenger...';
  btn.style.background = '#1877f2';
  btn.style.boxShadow = '0 0 30px rgba(24,119,242,0.5)';

  // Clear form
  fields.forEach(inp => { inp.value = ''; inp.style.borderColor = ''; inp.style.boxShadow = ''; });
  setTimeout(() => { btn.textContent = 'Send Message →'; btn.style.background = ''; btn.style.boxShadow = ''; }, 3500);
}

/* 15. GLITCH EFFECT ON SECTION TITLES */
document.querySelectorAll('.section-title').forEach(el => {
  el.addEventListener('mouseenter', () => el.classList.add('glitch'));
  el.addEventListener('animationend', () => el.classList.remove('glitch'));
});
