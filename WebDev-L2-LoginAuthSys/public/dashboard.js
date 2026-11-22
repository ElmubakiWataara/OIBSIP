async function verifySession() {
  const response = await fetch('/api/session');
  if (!response.ok) {
    window.location.replace('/login');
    return;
  }
  const { user } = await response.json();
  document.querySelector('#user-name').textContent = user.name.split(' ')[0];
  document.querySelector('#user-email').textContent = user.email;
}

document.querySelector('#logout-button').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.replace('/login');
});

verifySession();
