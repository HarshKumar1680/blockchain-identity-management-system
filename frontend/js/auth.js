/* ============================================================
   auth.js — Login Modal Logic
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (API.isLoggedIn()) { window.location.href = 'pages/dashboard.html'; return; }

  const loginModal   = document.getElementById('loginModal');
  const loginForm    = document.getElementById('loginForm');
  const loginError   = document.getElementById('loginError');
  const loginSubmit  = document.getElementById('loginSubmit');
  const loginBtnText = document.getElementById('loginBtnText');
  const loginSpinner = document.getElementById('loginSpinner');
  const togglePass   = document.getElementById('togglePass');
  const loginPassword= document.getElementById('loginPassword');

  document.getElementById('loginBtn')?.addEventListener('click', () => {
    loginModal.style.display = 'flex';
    document.getElementById('loginEmail').focus();
  });
  document.getElementById('closeLoginModal')?.addEventListener('click', closeModal);
  loginModal?.addEventListener('click', e => { if (e.target === loginModal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && loginModal?.style.display === 'flex') closeModal(); });

  togglePass?.addEventListener('click', () => {
    loginPassword.type = loginPassword.type === 'password' ? 'text' : 'password';
    togglePass.textContent = loginPassword.type === 'password' ? '👁' : '🙈';
  });

  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = loginPassword.value;
    setLoading(true); hideError();
    try {
      await API.login(email, password);
      window.location.href = 'pages/dashboard.html';
    } catch (err) {
      showError(err.message || 'Login failed.');
      setLoading(false);
    }
  });

  function closeModal() { loginModal.style.display = 'none'; loginForm.reset(); hideError(); setLoading(false); }
  function setLoading(on) { loginBtnText.style.display = on ? 'none' : 'inline'; loginSpinner.style.display = on ? 'inline-block' : 'none'; loginSubmit.disabled = on; }
  function showError(msg) { loginError.textContent = msg; loginError.style.display = 'block'; }
  function hideError()    { loginError.style.display = 'none'; }
});
