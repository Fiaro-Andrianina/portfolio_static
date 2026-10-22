/* ==========================================================================
   FORMULAIRE DE CONTACT — ENVOI VIA WEB3FORMS
   ==========================================================================
   Web3Forms relaie le message vers rktfify@gmail.com sans backend ni code
   serveur : la requête part directement du navigateur vers
   https://api.web3forms.com/submit.

   La clé d'accès n'est PAS un secret : c'est un identifiant public, propre
   au site, qui autorise l'envoi vers la seule adresse associée. Elle peut
   donc rester dans le code côté client. En revanche ne JAMAIS y mettre un
   mot de passe SMTP ou une clé d'API d'un autre service : ils seraient
   lisibles par n'importe qui.

   OBTENIR LA CLÉ : https://web3forms.com/ (entrer l'e-mail de réception).
   Puis la coller ci-dessous.
   ========================================================================== */
(function () {
  'use strict';

  const CONTACT_CONFIG = {
    accessKey: 'VOTRE_CLE_WEB3FORMS', // <-- à remplacer
    recipientEmail: 'rktfify@gmail.com',
    minFillSeconds: 3,   // en dessous, on suppose un robot
    cooldownSeconds: 25 // délai minimum entre deux envois depuis ce navigateur
  };

  const API_URL = 'https://api.web3forms.com/submit';
  const STORAGE_KEY = 'portfolio:lastContactSubmit';

  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitButton = document.getElementById('form-submit');
  const submitLabel = document.getElementById('form-submit-label');
  const statusBox = document.getElementById('form-status');
  const statusText = document.getElementById('form-status-text');
  const honeypot = document.getElementById('field-website');

  // Horodatage du chargement de la page : sert de repère au piège temporel.
  const pageLoadedAt = Date.now();

  /* ------------------------------------------------------------------------
     AFFICHAGE DES MESSAGES
     ------------------------------------------------------------------------ */
  function showStatus(type, message) {
    statusBox.classList.remove('form-status-success', 'form-status-error');
    statusBox.classList.add(type === 'success' ? 'form-status-success' : 'form-status-error');
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
  const FIELDS = [
    { id: 'field-name', errorId: 'error-name', label: 'Nom complet', validate: v => v.trim().length >= 2 || 'Indiquez votre nom (2 caractères minimum).' },
    { id: 'field-email', errorId: 'error-email', label: 'Adresse e-mail', validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Indiquez une adresse e-mail valide.' },
    { id: 'field-message', errorId: 'error-message', label: 'Message', validate: v => v.trim().length >= 20 || 'Décrivez votre besoin en 20 caractères minimum.' }
  ];

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
      isValid = false;
    } else {
      consentError.textContent = '';
      consentError.classList.remove('is-visible');
    }

    // Captcha : on n'exige le widget que s'il est réellement présent dans la page.
    // Si hcaptcha.com est bloqué (extension, réseau, pare-feu) on préfère laisser
    // partir le message plutôt que de perdre un vrai contact.
    if (isCaptchaPresent() && !getCaptchaToken()) {
      const captchaError = document.getElementById('error-captcha');
      captchaError.textContent = 'Merci de valider le captcha pour envoyer le message.';
      captchaError.classList.add('is-visible');
      isValid = false;
    }

    return isValid;
  }

  /* ------------------------------------------------------------------------
     CAPTCHA hCAPTCHA
     Le widget est rendu par le script de Web3Forms, qui injecte un champ
     caché `h-captcha-response` contenant le token. Sa présence permet de
     savoir si le captcha est réellement disponible sur cette page.
     ------------------------------------------------------------------------ */
  const captchaError = document.getElementById('error-captcha');

  function getCaptchaToken() {
    const field = form.querySelector('textarea[name="h-captcha-response"]');
    return field ? field.value.trim() : '';
  }

  function isCaptchaPresent() {
    return Boolean(form.querySelector('textarea[name="h-captcha-response"]'));
  }

  function clearCaptchaError() {
    if (!captchaError) return;
    captchaError.textContent = '';
    captchaError.classList.remove('is-visible');
  }

  // Le token est à usage unique : sans reset, le deuxième envoi échouerait.
  function resetCaptcha() {
    if (!isCaptchaPresent()) return;

    const widget = form.querySelector('.h-captcha');
    const widgetId = widget && widget.dataset.widgetId;

    if (window.hCaptcha && typeof window.hCaptcha.reset === 'function') {
      window.hCaptcha.reset(widgetId || 0);
    }

    // Repli si le SDK n'est pas exposé globalement mais que le champ existe.
    const tokenField = form.querySelector('textarea[name="h-captcha-response"]');
    if (tokenField) tokenField.value = '';
  }

  /* ------------------------------------------------------------------------
     ANTI-SPAM CÔTÉ NAVIGATEUR
     ------------------------------------------------------------------------ */

  // 1. Délai minimum depuis le chargement : un humain met plus de 3 s à lire
  //    et remplir, un script de spam part immédiatement.
  function isTooFast() {
    return (Date.now() - pageLoadedAt) / 1000 < CONTACT_CONFIG.minFillSeconds;
  }

  // 2. Délai minimum entre deux envois depuis le même navigateur.
  function isInCooldown() {
    try {
      const last = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
      return (Date.now() - last) / 1000 < CONTACT_CONFIG.cooldownSeconds;
    } catch (error) {
      return false; // stockage indisponible (navigation privée) : on n'y bloque pas
    }
  }

  function rememberSubmission() {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (error) {
      /* stockage indisponible : sans conséquence */
    }
  }

  /* ------------------------------------------------------------------------
     ÉTAT DU BOUTON
     ------------------------------------------------------------------------ */
  function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
    submitLabel.textContent = isLoading ? 'Envoi en cours…' : 'Envoyer le message';
  }

  /* ------------------------------------------------------------------------
     ENVOI
     ------------------------------------------------------------------------ */
  async function sendMessage(payload) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success !== true) {
      throw new Error(data.message || `Le service d'envoi a répondu ${response.status}.`);
    }

    return data;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideStatus();

    // Cas non configuré : on ne tente rien, on oriente vers l'e-mail direct.
    if (CONTACT_CONFIG.accessKey === 'VOTRE_CLE_WEB3FORMS') {
      showStatus('error',
        "Formulaire non configuré : la clé Web3Forms n'a pas encore été renseignée. " +
        "En attendant, utilisez le lien direct ci-contre ou écrivez à " +
        CONTACT_CONFIG.recipientEmail + '.');
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
      return;
    }

    if (isInCooldown()) {
      showStatus('error',
        `Un message vient déjà d'être envoyé. Merci d'attendre ${CONTACT_CONFIG.cooldownSeconds} secondes avant de réessayer.`);
      return;
    }

    const email = document.getElementById('field-email').value.trim();
    const subject = document.getElementById('field-subject').value;

    // `botcheck` est le champ attendu par Web3Forms pour filtrer les robots :
    // un humain le laisse vide (piège à robots), un robot le remplit.
    // `h-captcha-response` est normalement ajouté par le script Web3Forms ;
    // on le renvoie explicitement au cas où le script l'aurait omis.
    const payload = {
      access_key: CONTACT_CONFIG.accessKey,
      subject: `[Portfolio] ${subject}`,
      name: document.getElementById('field-name').value.trim(),
      email,
      message: document.getElementById('field-message').value.trim(),
      replyto: email,
      from_name: 'Formulaire portfolio',
      botcheck: honeypot ? honeypot.value : ''
    };

    const captchaToken = getCaptchaToken();
    if (captchaToken) payload['h-captcha-response'] = captchaToken;

    setLoading(true);

    try {
      await sendMessage(payload);

      rememberSubmission();
      form.reset();
      FIELDS.forEach(field => setFieldError(field, null));
      document.getElementById('error-consent').classList.remove('is-visible');
      clearCaptchaError();
      resetCaptcha();

      showStatus('success',
        'Message envoyé. Je vous réponds sous 48 heures en moyenne — pensez à vérifier vos courriers indésirables.');
    } catch (error) {
      showStatus('error',
        error.message + " Si le problème persiste, écrivez directement à " +
        CONTACT_CONFIG.recipientEmail + '.');
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
        setFieldError(field, field.validate(input.value) === true ? null : field.validate(input.value));
      }
      hideStatus();
    });
  });

  // Erreur du captcha effacée dès qu'il est validé
  form.addEventListener('input', (event) => {
    if (event.target.name === 'h-captcha-response') clearCaptchaError();
  });

  document.getElementById('field-consent').addEventListener('change', (event) => {
    if (event.target.checked) {
      const err = document.getElementById('error-consent');
      err.textContent = '';
      err.classList.remove('is-visible');
    }
  });

  /* ------------------------------------------------------------------------
     AVERTISSEMENT EN CONSOLE SI NON CONFIGURÉ
     ------------------------------------------------------------------------ */
  if (CONTACT_CONFIG.accessKey === 'VOTRE_CLE_WEB3FORMS') {
    console.warn('[contact] Clé Web3Forms absente : le formulaire ne peut pas partir. ' +
      'Récupère-la sur https://web3forms.com/ puis remplace VOTRE_CLE_WEB3FORMS dans js/contact.js.');
  }
})();