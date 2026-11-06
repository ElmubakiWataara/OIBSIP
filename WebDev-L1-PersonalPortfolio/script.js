const toggle = document.querySelector('.theme-toggle');
const preferredTheme = localStorage.getItem('portfolio-theme');

if (preferredTheme === 'dark') {
  document.body.classList.add('dark');
  toggle.setAttribute('aria-pressed', 'true');
  toggle.setAttribute('aria-label', 'Switch to light mode');
}

toggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
});

const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formStatus.textContent = 'Thanks - I’ll be in touch soon.';
  contactForm.reset();
});
