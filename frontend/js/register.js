/* ============================================================
   register.js — Register Form + Password Strength + Mining
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (API.isLoggedIn()) { window.location.href = 'dashboard.html'; return; }

  const form            = document.getElementById('registerForm');
  const regPassword     = document.getElementById('regPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const strengthFill    = document.getElementById('strengthFill');
  const strengthLabel   = document.getElementById('strengthLabel');
  const regError        = document.getElementById('regError');
  const regSuccess      = document.getElementById('regSuccess');
  const regSubmit       = document.getElementById('regSubmit');
  const regBtnText      = document.getElementById('regBtnText');
  const regSpinner      = document.getElementById('regSpinner');
  const miningOverlay   = document.getElementById('miningOverlay');
  const miningStatus    = document.getElementById('miningStatus');
  const miningHash      = document.getElementById('miningHash');

  /* Password Strength */
  regPassword.addEventListener('input', () => {
    const v  = regPassword.value;
    let score = 0;
    if (v.length >= 8)           score++;
    if (/[A-Z]/.test(v))         score++;
    if (/[0-9]/.test(v))         score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    const levels = [
      { label: '',       color: '',                  width: '0%'   },
      { label: 'Weak',   color: 'var(--red)',         width: '25%'  },
      { label: 'Fair',   color: 'var(--yellow)',      width: '50%'  },
      { label: 'Good',   color: 'var(--accent)',      width: '75%'  },
      { label: 'Strong', color: 'var(--green)',       width: '100%' },
    ];
    const lvl = levels[score];
    strengthFill.style.width      = lvl.width;
    strengthFill.style.background = lvl.color;
    strengthLabel.textContent     = lvl.label;
    strengthLabel.style.color     = lvl.color;
  });

  /* Toggle password */
  document.getElementById('toggleRegPass')?.addEventListener('click', () => {
    regPassword.type = regPassword.type === 'password' ? 'text' : 'password';
  });

  /* Submit */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideMessages();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('regEmail').value.trim();
    const username  = document.getElementById('username').value.trim();
    const password  = regPassword.value;
    const confirm   = confirmPassword.value;

    if (!firstName || !lastName || !email || !username || !password) return showError('Please fill in all fields.');
    if (password.length < 8) return showError('Password must be at least 8 characters.');
    if (password !== confirm) return showError('Passwords do not match.');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return showError('Username: 3–20 chars, letters/numbers/underscore only.');

    setLoading(true);
    showMining();
    try {
      const data = await API.register({ firstName, lastName, email, username, password });
      finishMining(data);
    } catch (err) {
      hideMining();
      setLoading(false);
      showError(err.message || 'Registration failed.');
    }
  });

  function showMining() {
    miningOverlay.style.display = 'flex';
    const msgs = ['Generating SHA-256 hash...','Computing proof-of-work...','Validating nonce...','Writing to blockchain...','Anchoring your identity...'];
    let i = 0;
    const mi = setInterval(() => { if (i < msgs.length) miningStatus.textContent = msgs[i++]; else clearInterval(mi); }, 500);
    const hi = setInterval(() => { miningHash.textContent = fakeHash(); }, 100);
    miningOverlay._intervals = [mi, hi];
  }
  function finishMining(data) {
    miningOverlay._intervals?.forEach(clearInterval);
    miningStatus.textContent = '✓ Block mined successfully!';
    if (data.user?.blockHash) miningHash.textContent = data.user.blockHash.substring(0, 16) + '...';
    setTimeout(() => { hideMining(); window.location.href = 'dashboard.html'; }, 1200);
  }
  function hideMining()   { miningOverlay.style.display = 'none'; }
  function fakeHash()     { const c='0123456789abcdef'; let h='0000'; for(let i=0;i<12;i++) h+=c[Math.floor(Math.random()*c.length)]; return h; }
  function setLoading(on) { regBtnText.style.display = on ? 'none' : 'inline'; regSpinner.style.display = on ? 'inline-block' : 'none'; regSubmit.disabled = on; }
  function showError(msg) { regError.textContent = msg; regError.style.display = 'block'; }
  function hideMessages() { regError.style.display = 'none'; regSuccess.style.display = 'none'; }
});
