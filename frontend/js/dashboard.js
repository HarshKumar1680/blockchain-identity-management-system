/* ============================================================
   dashboard.js — Overview, Identity, Blockchain (All Phases)
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  API.requireAuth();

  const sections = { overview: document.getElementById('section-overview'), identity: document.getElementById('section-identity'), blockchain: document.getElementById('section-blockchain') };
  const headings = { overview: ['Overview','Welcome to your BlockID dashboard'], identity: ['My Identity','Your decentralized identity record'], blockchain: ['Blockchain','Inspect every block on your chain'] };

  function showSection(name) {
    Object.keys(sections).forEach(k => { if (sections[k]) sections[k].style.display = k === name ? 'block' : 'none'; });
    document.querySelectorAll('.nav-item[data-section]').forEach(el => el.classList.toggle('active', el.dataset.section === name));
    const [h, sub] = headings[name] || ['',''];
    document.getElementById('pageHeading').textContent  = h;
    document.getElementById('pageSubtitle').textContent = sub;
  }

  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const sec = item.dataset.section;
      showSection(sec);
      if (sec === 'identity')   loadIdentityFull();
      if (sec === 'blockchain') loadBlockchain();
    });
  });
  document.getElementById('viewChainLink')?.addEventListener('click', e => { e.preventDefault(); showSection('blockchain'); loadBlockchain(); });

  const hash = window.location.hash.replace('#','') || 'overview';
  const start= ['overview','identity','blockchain'].includes(hash) ? hash : 'overview';
  showSection(start);
  if (start === 'identity')   loadIdentityFull();
  if (start === 'blockchain') loadBlockchain();

  /* Sidebar user */
  const user = API.getUser();
  if (user) {
    const initials = ((user.firstName||'?')[0]+(user.lastName||'?')[0]).toUpperCase();
    document.getElementById('userAvatarSm').textContent = initials;
    document.getElementById('userNameSm').textContent   = user.username || user.firstName || 'User';
  }
  document.getElementById('logoutBtn').addEventListener('click', () => { if (confirm('Logout from BlockID?')) API.logout(); });

  /* ---- Overview ---- */
  async function loadOverview() {
    try {
      const stats = await API.get('/blockchain/stats');
      document.getElementById('totalBlocks').textContent     = stats.totalBlocks     ?? '—';
      document.getElementById('totalIdentities').textContent = stats.totalIdentities ?? '—';
      document.getElementById('chainValid').textContent      = stats.isValid ? '✓ Valid' : '✗ Invalid';
      try {
        const dr = await API.get('/documents', true);
        document.getElementById('totalDocuments').textContent = (dr.documents||[]).filter(d=>d.status==='active').length;
      } catch(e) { document.getElementById('totalDocuments').textContent = '0'; }

      const { user } = await API.get('/user/me', true);
      document.getElementById('identityMini').innerHTML = `
        <div class="identity-mini-info">
          <div class="id-row"><span class="id-label">Name</span><span class="id-value">${esc(user.firstName)} ${esc(user.lastName)}</span></div>
          <div class="id-row"><span class="id-label">Username</span><span class="id-value">@${esc(user.username)}</span></div>
          <div class="id-row"><span class="id-label">DID</span><span class="id-value mono">${esc(user.did||'—')}</span></div>
          <div class="id-row"><span class="id-label">Status</span><span class="id-value"><span class="badge badge-green">Active</span></span></div>
        </div>`;

      const chain = await API.get('/blockchain/chain');
      if (chain.blocks?.length) {
        const b = chain.blocks[chain.blocks.length-1];
        document.getElementById('latestBlock').innerHTML = `
          <div class="latest-block-info">
            <div class="block-info-row"><span class="block-info-label">Block #</span><span class="block-info-value">${b.index}</span></div>
            <div class="block-info-row"><span class="block-info-label">Type</span><span class="block-info-value">${blockTypeLabel(b.data?.type)}</span></div>
            <div class="block-info-row"><span class="block-info-label">Hash</span><span class="block-info-value">${shortHash(b.hash)}</span></div>
            <div class="block-info-row"><span class="block-info-label">Nonce</span><span class="block-info-value">${b.nonce}</span></div>
            <div class="block-info-row"><span class="block-info-label">Time</span><span class="block-info-value">${new Date(b.timestamp).toLocaleTimeString()}</span></div>
          </div>`;
      }
    } catch(err) { console.error('Overview error:', err); }
  }

  /* ---- Identity Full ---- */
  async function loadIdentityFull() {
    const el = document.getElementById('identityCardFull');
    el.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const { user } = await API.get('/user/me', true);
      const initials = ((user.firstName||'?')[0]+(user.lastName||'?')[0]).toUpperCase();
      let keyInfo = '—';
      try { const kr = await API.get('/keypairs/active',true); keyInfo = kr.keyPair ? `${kr.keyPair.algorithm} — ${kr.keyPair.label}` : 'None'; } catch(e){}
      el.innerHTML = `
        <div class="identity-header">
          <div class="identity-avatar">${initials}</div>
          <div class="identity-name-block">
            <h2>${esc(user.firstName)} ${esc(user.lastName)}</h2>
            <div class="identity-did">${esc(user.did||'No DID found')}</div>
          </div>
          <div style="margin-left:auto"><span class="badge badge-green">✓ Verified</span></div>
        </div>
        <div class="identity-grid">
          <div class="identity-field"><div class="field-label">Username</div><div class="field-value">@${esc(user.username)}</div></div>
          <div class="identity-field"><div class="field-label">Email</div><div class="field-value">${esc(user.email)}</div></div>
          <div class="identity-field"><div class="field-label">Block Hash</div><div class="field-value mono">${shortHash(user.blockHash)}</div></div>
          <div class="identity-field"><div class="field-label">Block Height</div><div class="field-value">${user.blockIndex??'—'}</div></div>
          <div class="identity-field"><div class="field-label">Active Key</div><div class="field-value">${esc(keyInfo)}</div></div>
          <div class="identity-field"><div class="field-label">Member Since</div><div class="field-value">${new Date(user.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</div></div>
        </div>
        <div style="margin-top:16px">
          <div class="field-label" style="margin-bottom:8px">Decentralized Identifier (DID)</div>
          <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;font-family:var(--font-mono);font-size:0.82rem;color:var(--accent);word-break:break-all;">${esc(user.did||'—')}</div>
        </div>
        <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
          <a href="documents.html"      class="btn-secondary">◧ Documents</a>
          <a href="access-control.html" class="btn-secondary">◈ Access Control</a>
          <a href="keypairs.html"       class="btn-secondary">⬡ Key Pairs</a>
        </div>`;
    } catch(err) { el.innerHTML = `<p style="color:var(--red);padding:20px">Failed: ${esc(err.message)}</p>`; }
  }

  /* ---- Blockchain ---- */
  async function loadBlockchain() {
    const listEl = document.getElementById('blocksList');
    const infoEl = document.getElementById('chainInfo');
    listEl.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const { blocks } = await API.get('/blockchain/chain');
      infoEl.textContent = `${blocks.length} block${blocks.length!==1?'s':''} in chain`;
      if (!blocks?.length) { listEl.innerHTML='<p style="color:var(--text-muted);padding:20px">No blocks found.</p>'; return; }
      listEl.innerHTML = '';
      [...blocks].reverse().forEach(block => {
        const item = document.createElement('div');
        item.className = `block-item ${block.index===0?'genesis':''}`;
        item.innerHTML = `
          <div><div class="block-index">#${block.index}</div><div class="block-index-label">${blockTypeLabel(block.data?.type)}</div></div>
          <div><div class="block-hash-label">Hash</div><div class="block-hash-short">${shortHash(block.hash)}</div></div>
          <div class="block-data-preview">${blockPreview(block.data)}</div>
          <div class="block-time">${new Date(block.timestamp).toLocaleTimeString()}</div>
          <div class="block-arrow">›</div>`;
        item.addEventListener('click', () => openBlockModal(block));
        listEl.appendChild(item);
      });
    } catch(err) { listEl.innerHTML = `<p style="color:var(--red);padding:20px">Failed: ${esc(err.message)}</p>`; }
  }

  document.getElementById('validateChainBtn')?.addEventListener('click', async () => {
    try {
      const r = await API.get('/blockchain/verify');
      document.getElementById('chainInfo').innerHTML = `<span style="color:${r.isValid?'var(--green)':'var(--red)'}">${r.isValid?'✓ Chain valid':'✗ Chain compromised!'}</span>`;
    } catch(e){}
  });

  function openBlockModal(block) {
    document.getElementById('modalBlockTitle').textContent = `Block #${block.index}`;
    document.getElementById('modalBlockBody').innerHTML = `
      <div class="block-detail-grid">
        <div class="detail-row"><span class="detail-label">Index</span><span class="detail-value">${block.index}</span></div>
        <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value">${esc(block.data?.type||'unknown')}</span></div>
        <div class="detail-row"><span class="detail-label">Hash</span><span class="detail-value mono">${esc(block.hash)}</span></div>
        <div class="detail-row"><span class="detail-label">Previous Hash</span><span class="detail-value mono">${esc(block.previousHash||'0000000000000000')}</span></div>
        <div class="detail-row"><span class="detail-label">Nonce</span><span class="detail-value">${block.nonce}</span></div>
        <div class="detail-row"><span class="detail-label">Timestamp</span><span class="detail-value">${new Date(block.timestamp).toLocaleString()}</span></div>
        <div class="detail-row"><span class="detail-label">Data</span><span class="detail-value mono" style="font-size:0.72rem;white-space:pre-wrap">${esc(JSON.stringify(block.data,null,2))}</span></div>
      </div>`;
    document.getElementById('blockModal').style.display = 'flex';
  }
  document.getElementById('closeBlockModal')?.addEventListener('click', () => { document.getElementById('blockModal').style.display='none'; });
  document.getElementById('blockModal')?.addEventListener('click', e => { if(e.target.id==='blockModal') e.target.style.display='none'; });

  /* ---- Utils ---- */
  function esc(s)  { if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function shortHash(h) { if(!h) return '—'; return h.substring(0,8)+'...'+h.substring(h.length-6); }
  function blockTypeLabel(type) {
    const map = { identity_registration:'Identity',document_upload:'Document',document_revocation:'Revoked',access_granted:'Access',access_revoked:'Revoked',keypair_generated:'Key Pair',genesis:'Genesis' };
    return map[type]||'Block';
  }
  function blockPreview(data) {
    if(!data) return 'No data';
    if(data.type==='identity_registration') return `@${data.username||''}`;
    if(data.type==='document_upload')       return `Doc: ${data.docName||''}`;
    if(data.type==='document_revocation')   return `Revoked: ${data.docName||''}`;
    if(data.type==='access_granted')        return `→ ${data.granteeUsername||''}`;
    if(data.type==='access_revoked')        return `Revoked: ${data.granteeUsername||''}`;
    if(data.type==='keypair_generated')     return `Key: ${data.label||''}`;
    return JSON.stringify(data).substring(0,40);
  }

  loadOverview();
});
