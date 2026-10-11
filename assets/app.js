/*
 * Landing-page behaviour. No dependencies.
 * Sections: lead form.
 */
(function () {
  'use strict';

  var pageLoadedAt = Date.now();

  /* ---------- Lead form ---------- */

  var form = document.getElementById('lead-form');
  var success = document.getElementById('lead-success');
  if (!form || !success) return;

  var email = form.elements.email;
  var emailError = document.getElementById('email-error');
  var formError = document.getElementById('form-error');
  var submitBtn = form.querySelector('button[type="submit"]');
  var mode = form.getAttribute('data-lead-mode') === 'live' ? 'live' : 'demo';

  // Demo notices are only shown while the form is not collecting data.
  if (mode === 'live') {
    document.querySelectorAll('[data-demo-only]').forEach(function (el) { el.hidden = true; });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function setEmailError(show) {
    emailError.hidden = !show;
    email.setAttribute('aria-invalid', show ? 'true' : 'false');
  }

  email.addEventListener('input', function () {
    if (!emailError.hidden && isValidEmail(email.value.trim())) setEmailError(false);
  });

  function send(body) {
    if (mode === 'demo') {
      // Nothing leaves the browser. Keep the payload for local inspection.
      window.__lastLeadPayload = Object.fromEntries(body);
      return Promise.resolve();
    }
    // Netlify Forms AJAX submission.
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    });
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.hidden = true;

    // Honeypot filled: almost certainly a bot. Show success, send nothing.
    if (form.elements.company.value) {
      showSuccess();
      return;
    }

    email.value = email.value.trim();
    if (!isValidEmail(email.value)) {
      setEmailError(true);
      email.focus();
      return;
    }
    setEmailError(false);

    form.elements.time_to_submit_ms.value = String(Date.now() - pageLoadedAt);

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');

    send(new URLSearchParams(new FormData(form)))
      .then(showSuccess)
      .catch(function () {
        formError.hidden = false;
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      });
  });
})();
