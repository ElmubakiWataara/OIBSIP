const form = document.querySelector('form');
const status = document.querySelector('#form-status');

document.querySelectorAll('[data-password-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.querySelector(`#${button.dataset.passwordToggle}`);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    button.textContent = isHidden ? 'Hide' : 'Show';
    button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  const submitButton = form.querySelector('[type="submit"]');
  const payload = Object.fromEntries(new FormData(form));
  const isRegistering = form.id === 'register-form';

  if (Object.values(payload).some((value) => !String(value).trim())) {
    status.textContent = 'Please complete every field.';
    return;
  }
  if (isRegistering && (payload.password.length < 8 || !/\d/.test(payload.password))) {
    status.textContent = 'Use at least 8 characters and include at least 1 number.';
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = isRegistering ? 'Creating account…' : 'Signing in…';
  try {
    const response = await fetch(isRegistering ? '/api/register' : '/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
    window.location.assign(data.redirect);
  } catch (error) {
    status.textContent = error.message;
    submitButton.disabled = false;
    submitButton.textContent = isRegistering ? 'Create account' : 'Sign in';
  }
});
