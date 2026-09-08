document.addEventListener('DOMContentLoaded', () => {

  // Désactiver les animations lourdes si l'utilisateur préfère réduire les mouvements
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ==========================================================================
     1. ANIMATION DES BARRES DE COMPÉTENCES (.skill-progress)
     ========================================================================== */
  const skillProgressBars = document.querySelectorAll('.skill-progress');
  const skillsSection = document.querySelector('.skills-section');

  if (skillsSection && skillProgressBars.length > 0) {
    skillProgressBars.forEach(bar => {
      bar.dataset.targetWidth = bar.style.width || '0%';
      bar.style.width = '0%';
      bar.style.transition = 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const animateSkills = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            skillProgressBars.forEach((bar, index) => {
              setTimeout(() => {
                bar.style.width = bar.dataset.targetWidth;
              }, prefersReducedMotion ? 0 : index * 80);
            });
          });
          observer.unobserve(entry.target);
        }
      });
    };

    const skillsObserver = new IntersectionObserver(animateSkills, { threshold: 0.15 });
    skillsObserver.observe(skillsSection);
  }


  /* ==========================================================================
     2. REVEAL STAGGERED (APPARITION FLUIDE EN CASCADE)
     ========================================================================== */
  const selectors = '.project-card, .highlight-card, .experience-card, .contact-card';
  const revealElements = document.querySelectorAll(selectors);

  if (!prefersReducedMotion) {
    revealElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });

    const revealOnScroll = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const parentGrid = entry.target.parentElement;
          const siblings = Array.from(parentGrid.children).filter(child => child.matches(selectors));
          const index = siblings.indexOf(entry.target);
          const delay = index >= 0 ? index * 90 : 0;

          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    };

    const revealObserver = new IntersectionObserver(revealOnScroll, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }


  /* ==========================================================================
     3. SMOOTH SCROLL OPTIMISÉ POUR LIENS D'ANCRE
     ========================================================================== */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });


  /* ==========================================================================
     4. MICRO-TILT 3D ET PARALLAXE SUR LES CARTES PROJETS
     ========================================================================== */
  const interactiveCards = document.querySelectorAll('.project-card');

  if (!prefersReducedMotion && window.innerWidth > 900) {
    interactiveCards.forEach(card => {
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

});