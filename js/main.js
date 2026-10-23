/* ==========================================================================
   PORTFOLIO — SCRIPTS PRINCIPAUX
   Chargé avec l'attribut `defer` : le DOM est déjà prêt à l'exécution.
   ========================================================================== */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const supportsObserver = 'IntersectionObserver' in window;

  /* ==========================================================================
     1. MENU MOBILE (BURGER)
     ========================================================================== */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    const mobileQuery = window.matchMedia('(max-width: 900px)');
    const focusableSelector = 'a[href], button:not([disabled])';
    let menuOpen = false;

    const setMenuState = (isOpen) => {
      menuOpen = isOpen;
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation');
      navMenu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('nav-open', isOpen);

      // Sur mobile, le panneau fermé ne doit pas être atteignable au clavier
      // ni par les technologies d'assistance. Sur desktop, il reste actif.
      navMenu.inert = mobileQuery.matches ? !isOpen : false;

      if (isOpen) {
        const firstLink = navMenu.querySelector(focusableSelector);
        if (firstLink) requestAnimationFrame(() => firstLink.focus());
      }
    };

    navToggle.addEventListener('click', () => {
      setMenuState(!menuOpen);
    });

    // Fermeture au clic sur un lien du panneau
    navMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenuState(false);
    });

    document.addEventListener('keydown', (event) => {
      if (!menuOpen) return;

      if (event.key === 'Escape') {
        setMenuState(false);
        navToggle.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      // Piège de focus : le menu, le bouton burger et leurs liens forment
      // une boucle tant que le panneau est ouvert.
      const focusables = [navToggle, ...navMenu.querySelectorAll(focusableSelector)]
        .filter(element => !element.hasAttribute('disabled') && element.getClientRects().length > 0);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Referme le menu si l'on repasse en affichage large
    mobileQuery.addEventListener('change', () => setMenuState(false));

    // État initial cohérent (y compris au retour en arrière avec cache)
    setMenuState(false);
  }

  /* ==========================================================================
     2. ANNÉE DU FOOTER
     ========================================================================== */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ==========================================================================
     3. APPARITION EN CASCADE AU DÉFILEMENT
     Le reveal anime `opacity` uniquement : `transform` reste réservé au tilt
     et à l'état de survol, ce qui évite que les deux se marchent dessus.
     ========================================================================== */
  const revealSelectors = '.project-card, .highlight-card, .experience-card, .education-card, .contact-card, .languages-card';
  const revealElements = document.querySelectorAll(revealSelectors);

  if (revealElements.length > 0) {
    if (!supportsObserver || prefersReducedMotion) {
      // Repli : on laisse le contenu visible plutôt que masqué.
      revealElements.forEach(el => { el.style.opacity = '1'; });
    } else {
      revealElements.forEach(el => {
        el.classList.add('reveal');
      });

      const revealOnScroll = (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const parentGrid = entry.target.parentElement;
          const siblings = parentGrid
            ? Array.from(parentGrid.children).filter(child => child.matches(revealSelectors))
            : [];
          const index = siblings.indexOf(entry.target);

          setTimeout(() => entry.target.classList.add('is-revealed'), index >= 0 ? index * 90 : 0);

          observer.unobserve(entry.target);
        });
      };

      const revealObserver = new IntersectionObserver(revealOnScroll, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(el => revealObserver.observe(el));
    }
  }

  /* ==========================================================================
     4. MICRO-TILT 3D SUR LES CARTES PROJETS
     ========================================================================== */
  const projectCards = document.querySelectorAll('.project-card');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  const initTilt = () => {
    if (prefersReducedMotion || !finePointerQuery.matches) return;

    projectCards.forEach(card => {
      if (card.dataset.tiltReady) return;
      card.dataset.tiltReady = 'true';

      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4;

        card.style.setProperty('--tilt', `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt', 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)');
      });
    });
  };

  initTilt();
  finePointerQuery.addEventListener('change', initTilt);

  /* ==========================================================================
     5. TOGGLE SECTION "À PROPOS" (AFFICHAGE RÉDUIT UNIQUEMENT)
     ========================================================================== */
  const aboutWrapper = document.querySelector('.about-text-wrapper');
  const aboutToggle = document.querySelector('.about-toggle-btn');
  const compactQuery = window.matchMedia('(max-width: 768px)');

  if (aboutWrapper && aboutToggle) {
    // Le bouton n'est affiché qu'en affichage réduit (voir about.css) : sa
    // visibilité est donc pilotée par CSS, et non par JavaScript.
    const setAboutExpanded = (isExpanded) => {
      aboutWrapper.classList.toggle('expanded', isExpanded);
      aboutToggle.setAttribute('aria-expanded', String(isExpanded));
      aboutToggle.querySelector('.about-toggle-label').textContent = isExpanded ? 'Réduire' : 'Lire la suite';
    };

    aboutToggle.addEventListener('click', () => {
      setAboutExpanded(aboutToggle.getAttribute('aria-expanded') !== 'true');
    });

    // Au changement de taille d'écran, on repart de l'état replié.
    compactQuery.addEventListener('change', () => setAboutExpanded(false));
  }
})();
