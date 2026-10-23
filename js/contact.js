/* ==========================================================================
   FORMULAIRE DE CONTACT — ENVOI VIA FORMSUBMIT
   ==========================================================================
   FormSubmit relaie le message vers rktfify@gmail.com sans backend ni code
   serveur. La requête AJAX part directement du navigateur vers
   https://formsubmit.co/ajax/rktfify@gmail.com.

   L'adresse e-mail présente dans l'attribut `action` n'est pas un secret :
   elle est nécessaire au fonctionnement du formulaire. Aucun mot de passe
   SMTP ni clé privée ne doit être stocké ici.

   Sans JavaScript, le formulaire reste fonctionnel : il est envoyé en POST
   classique vers FormSubmit, puis redirigé vers merci.html grâce à `_next`.
   ========================================================================== */
(function () {
  'use strict';

  const CONTACT_CONFIG = {
    minFillSeconds: 3 // en dessous, on suppose un robot
  };

  const form = document.getElementById('contact-form');
  if (!form) return;

  // Avec JavaScript, la validation est gérée champ par champ et les messages
  // d'erreur restent dans la page. Sans JavaScript, les attributs HTML
  // (`required`, `type="email"`, `minlength`) reprennent la main.
  if (window.fetch) form.noValidate = true;

  // L'endpoint AJAX est dérivé de l'action du formulaire : une seule adresse
  // à modifier dans le HTML si le destinataire change.
  const AJAX_URL = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

  const submitButton = document.getElementById('form-submit');
  const submitLabel = document.getElementById('form-submit-label');
  const statusBox = document.getElementById('form-status');
  const statusText = document.getElementById('form-status-text');
  const honeypot = document.getElementById('field-website');

  // Horodatage du chargement de la page : sert de repère au piège temporel.
  const pageLoadedAt = Date.now();

  const FIELDS = [
    {
      id: 'field-name',
      errorId: 'error-name',
      validate: value => value.trim().length >= 2 || 'Indiquez votre nom (2 caractères minimum).'
    },
    {
      id: 'field-email',
      errorId: 'error-email',
      validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) || 'Indiquez une adresse e-mail valide.'
    },
    {
      id: 'field-message',
      errorId: 'error-message',
      validate: value => value.trim().length >= 20 || 'Décrivez votre besoin en 20 caractères minimum.'
    }
  ];

  /* ------------------------------------------------------------------------
     AFFICHAGE DES MESSAGES
     ------------------------------------------------------------------------ */
  function showStatus(type, message) {
    statusBox.classList.remove('form-status-success', 'form-status-error');
    statusBox.classList.add(type === 'success' ? 'form-status-success' : 'form-status-error');
    statusBox.setAttribute('role', type === 'success' ? 'status' : 'alert');
    statusBox.querySelector('.form-status-icon').textContent = type === 'success' ? '\u2713' : '!';
    statusText.textContent = message;
    statusBox.classList.add('is-visible');
  }

  function hideStatus() {
    statusBox.classList.remove('is-visible');
  }

  /* ------------------------------------------------------------------------
     ERREURS DE CHAMP
     ------------------------------------------------------------------------ */
  function setFieldError(field, message) {
    const input = document.getElementById(field.id);
    const errorEl = document.getElementById(field.errorId);

    if (message) {
      errorEl.textContent = message;
      errorEl.classList.add('is-visible');
      input.setAttribute('aria-invalid', 'true');
    } else {
      errorEl.textContent = '';
      errorEl.classList.remove('is-visible');
      input.removeAttribute('aria-invalid');
    }
  }

  function validateForm() {
    let isValid = true;

    FIELDS.forEach(field => {
      const value = document.getElementById(field.id).value;
      const result = field.validate(value);
      setFieldError(field, result === true ? null : result);
      if (result !== true) isValid = false;
    });

    const consent = document.getElementById('field-consent');
    const consentError = document.getElementById('error-consent');

    if (!consent.checked) {
      consentError.textContent = 'Merci de cocher cette case pour continuer.';
      consentError.classList.add('is-visible');
      consent.setAttribute('aria-invalid', 'true');
      isValid = false;
    } else {
      consentError.textContent = '';
      consentError.classList.remove('is-visible');
      consent.removeAttribute('aria-invalid');
    }

    return isValid;
  }

  function clearAllErrors() {
    FIELDS.forEach(field => setFieldError(field, null));

    const consent = document.getElementById('field-consent');
    const consentError = document.getElementById('error-consent');
    consentError.textContent = '';
    consentError.classList.remove('is-visible');
    consent.removeAttribute('aria-invalid');
  }

  /* ------------------------------------------------------------------------
     ANTI-SPAM CÔTÉ NAVIGATEUR
     FormSubmit filtre déjà les robots ; ce délai minimum évite les envois
     instantanés sans gêner une saisie humaine.
     ------------------------------------------------------------------------ */
  function isTooFast() {
    return (Date.now() - pageLoadedAt) / 1000 < CONTACT_CONFIG.minFillSeconds;
  }

  /* ------------------------------------------------------------------------
     ÉTAT DU BOUTON
     ------------------------------------------------------------------------ */
  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
    submitLabel.textContent = isLoading ? 'Envoi en cours…' : 'Envoyer le message';
    form.setAttribute('aria-busy', String(isLoading));
  }

  /* ------------------------------------------------------------------------
     ENVOI
     ------------------------------------------------------------------------ */
  async function sendMessage(payload) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(AJAX_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const rawBody = await response.text();
      let data = {};

      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch (error) {
        // Réponse HTML (page d'activation, pare-feu, etc.) : on garde un
        // message générique plutôt que d'exposer du HTML brut à l'utilisateur.
      }

      const isSuccess = data.success === true || data.success === 'true';

      if (isSuccess) return data;

      const serviceMessage = typeof data.message === 'string' ? data.message : '';

      if (/activat/i.test(serviceMessage) || (!serviceMessage && /activat/i.test(rawBody))) {
        const activationError = new Error('FormSubmit doit encore être activé.');
        activationError.code = 'ACTIVATION_REQUIRED';
        throw activationError;
      }

      if (!response.ok) {
        throw new Error(serviceMessage || `Le service d'envoi a répondu ${response.status}.`);
      }

      throw new Error(serviceMessage || "Le service d'envoi n'a pas confirmé la réception du message.");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  form.addEventListener('submit', async (event) => {
    // Navigateur sans fetch : on laisse le POST natif vers FormSubmit agir.
    if (!window.fetch) return;

    event.preventDefault();

    if (submitButton.disabled) return;

    hideStatus();

    // Piège à robots : un humain ne remplit jamais ce champ. On simule un
    // succès pour ne pas donner d'indice à un script automatisé.
    if (honeypot && honeypot.value.trim() !== '') {
      form.reset();
      clearAllErrors();
      showStatus('success', 'Message envoyé. Je vous réponds sous 48 heures en moyenne.');
      return;
    }

    if (!validateForm()) {
      showStatus('error', 'Certains champs doivent être corrigés avant l’envoi.');
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    if (isTooFast()) {
      showStatus('error', 'Formulaire envoyé trop rapidement. Vérifiez les champs puis réessayez.');
      statusBox.focus();
      return;
    }

    const name = document.getElementById('field-name').value.trim();
    const email = document.getElementById('field-email').value.trim();
    const subject = document.getElementById('field-subject').value || 'Nouveau message';
    const message = document.getElementById('field-message').value.trim();

    const payload = {
      _subject: `[Portfolio] ${subject} — ${name}`,
      _template: 'table',
      _captcha: 'false',
      _replyto: email,
      name,
      email,
      subject,
      message,
      consent: 'Oui'
    };

    setLoading(true);

    try {
      await sendMessage(payload);

      form.reset();
      clearAllErrors();
      showStatus('success',
        'Message envoyé. Je vous réponds sous 48 heures en moyenne — pensez à vérifier vos courriers indésirables.');
      statusBox.focus();
    } catch (error) {
      if (error.code === 'ACTIVATION_REQUIRED') {
        showStatus('error',
          "Le formulaire est en cours d'activation. En attendant, écrivez directement à rktfify@gmail.com.");
      } else if (error.name === 'AbortError') {
        showStatus('error',
          "Le service d'envoi met trop de temps à répondre. Réessayez ou écrivez directement à rktfify@gmail.com.");
      } else {
        const reason = error.message || "L'envoi a échoué.";
        showStatus('error',
          reason + ' Si le problème persiste, écrivez directement à rktfify@gmail.com.');
      }

      statusBox.focus();
    } finally {
      setLoading(false);
    }
  });

  /* ------------------------------------------------------------------------
     CONFORT DE SAISIE
     ------------------------------------------------------------------------ */
  // On efface l'erreur d'un champ dès que l'utilisateur le corrige.
  FIELDS.forEach(field => {
    const input = document.getElementById(field.id);

    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        const result = field.validate(input.value);
        setFieldError(field, result === true ? null : result);
      }
      hideStatus();
    });
  });

  document.getElementById('field-consent').addEventListener('change', (event) => {
    if (!event.target.checked) return;

    const consentError = document.getElementById('error-consent');
    consentError.textContent = '';
    consentError.classList.remove('is-visible');
    event.target.removeAttribute('aria-invalid');
    hideStatus();
  });
})();
