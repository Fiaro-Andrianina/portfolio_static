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
    const desktopQuery = window.matchMedia('(min-width: 901px)');

    const setMenuState = (isOpen) => {
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation');
      navMenu.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
    };

    navToggle.addEventListener('click', () => {
      setMenuState(navToggle.getAttribute('aria-expanded') !== 'true');
    });

    // Fermeture au clic sur un lien du panneau
    navMenu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenuState(false);
    });

    // Fermeture à la touche Échap
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setMenuState(false);
        navToggle.focus();
      }
    });

    // Refermet le menu si l'on repasse en affichage large
    desktopQuery.addEventListener('change', (event) => {
      if (event.matches) setMenuState(false);
    });

    // Garantit un état cohérent au chargement (retour en arrière avec cache)
    if (!mobileQuery.matches) setMenuState(false);
  }

  /* ==========================================================================
     2. ANNÉE DU FOOTER
     ========================================================================== */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ==========================================================================
     3. BARRES DE COMPÉTENCES
     La largeur cible vit dans l'attribut `style` du HTML (contenu de repli
     sans JavaScript). On la mémorise puis on repart de 0.
     ========================================================================== */
  const skillBars = Array.from(document.querySelectorAll('.skill-progress'));
  const skillsSection = document.querySelector('.skills-section');

  if (skillsSection && skillBars.length > 0) {
    if (!supportsObserver || prefersReducedMotion) {
      // Sans observateur ou sans animation : on affiche directement l'état final.
      skillBars.forEach(bar => { bar.style.transition = 'none'; });
    } else {
      skillBars.forEach(bar => {
        bar.dataset.targetWidth = bar.style.width || '0%';
        bar.style.width = '0%';
        bar.style.transition = 'width 1.2s var(--ease-out-expo)';
      });

      const animateSkills = (entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          requestAnimationFrame(() => {
            skillBars.forEach((bar, index) => {
              setTimeout(() => {
                bar.style.width = bar.dataset.targetWidth;
              }, index * 80);
            });
          });

          observer.unobserve(entry.target);
        });
      };

      const skillsObserver = new IntersectionObserver(animateSkills, { threshold: 0.15 });
      skillsObserver.observe(skillsSection);
    }
  }

  /* ==========================================================================
     4. APPARITION EN CASCADE AU DÉFILEMENT
     Le reveal anime `opacity` uniquement : `transform` reste réservé au tilt
     et à l'état de survol, ce qui évite que les deux se marchent dessus.
     ========================================================================== */
  const revealSelectors = '.project-card, .highlight-card, .experience-card, .contact-card';
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
     5. MICRO-TILT 3D SUR LES CARTES PROJETS
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
     6. TOGGLE SECTION "À PROPOS" (AFFICHAGE RÉDUIT UNIQUEMENT)
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