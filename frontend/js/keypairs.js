/* ============================================================
   keypairs.js — RSA Key Generation, Sign & Verify (Web Crypto)
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  API.requireAuth();
  const user=API.getUser();
  if(user){document.getElementById('userAvatarSm').textContent=((user.firstName||'?')[0]+(user.lastName||'?')[0]).toUpperCase();document.getElementById('userNameSm').textContent=user.username||user.firstName;}
  document.getElementById('logoutBtn').addEventListener('click',()=>{if(confirm('Logout?'))API.logout();});

  async function loadActiveKey(){
    const card=document.getElementById('activeKeyCard');
    const badge=document.getElementById('keyStatusBadge');
    try{
      const r=await API.get('/keypairs/active',true);
      if(!r.keyPair){
        badge.textContent='No Key'; badge.style.background='rgba(239,68,68,0.1)'; badge.style.color='var(--red)';
        card.innerHTML=`<div class="no-key-card"><p>No active key pair. Generate one below to enable digital signatures.</p></div>`;
        return;
      }
      const kp=r.keyPair;
      badge.textContent='✓ Active';
      card.innerHTML=`
        <div class="active-key-card">
          <div class="active-key-header">
            <div class="key-icon">⬡</div>
            <div class="key-label-block"><h3>${esc(kp.label||'Identity Key')}</h3><p>${esc(kp.algorithm||'RSA-PSS')} · Generated ${new Date(kp.createdAt).toLocaleDateString()}</p></div>
            <div style="margin-left:auto"><span class="badge badge-green">Active</span></div>
          </div>
          <div class="key-meta-grid">
            <div class="key-meta-item"><div class="key-meta-label">Algorithm</div><div class="key-meta-value">${esc(kp.algorithm)}</div></div>
            <div class="key-meta-item"><div class="key-meta-label">Block Height</div><div class="key-meta-value">${kp.blockIndex??'—'}</div></div>
            <div class="key-meta-item"><div class="key-meta-label">Fingerprint</div><div class="key-meta-value mono">${kp.fingerprint?kp.fingerprint.substring(0,20)+'...':'—'}</div></div>
            <div class="key-meta-item"><div class="key-meta-label">Created</div><div class="key-meta-value">${new Date(kp.createdAt).toLocaleDateString()}</div></div>
          </div>
          <div class="public-key-display"><div class="key-meta-label">Public Key</div><textarea class="key-textarea" style="margin-top:8px;min-height:120px" readonly>${esc(kp.publicKey)}</textarea></div>
        </div>`;
    }catch(err){card.innerHTML=`<p style="color:var(--red);padding:20px">Error: ${esc(err.message)}</p>`;}
  }

  document.getElementById('btnGenerateKey').addEventListener('click', async()=>{
    const label=document.getElementById('keyLabel').value.trim();
    const algo =document.getElementById('keyAlgo').value;
    const errEl=document.getElementById('generateError');
    const resEl=document.getElementById('newKeyResult');
    errEl.style.display='none'; resEl.style.display='none';
    if(!label){errEl.textContent='Please enter a key label.';errEl.style.display='block';return;}
    setGenLoading(true);
    try{
      let keyPair,pubPem,privPem;
      if(algo==='RSA-PSS'){
        keyPair=await crypto.subtle.generateKey({name:'RSA-PSS',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
        pubPem =toPem(await crypto.subtle.exportKey('spki',  keyPair.publicKey),  'PUBLIC KEY');
        privPem=toPem(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey), 'PRIVATE KEY');
      }else{
        keyPair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
        pubPem =toPem(await crypto.subtle.exportKey('spki',  keyPair.publicKey),  'PUBLIC KEY');
        privPem=toPem(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey), 'PRIVATE KEY');
      }
      const fpBuf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pubPem));
      const fingerprint=Array.from(new Uint8Array(fpBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      await API.post('/keypairs/generate',{label,algorithm:algo,publicKey:pubPem,fingerprint},true);
      document.getElementById('newPublicKey').value=pubPem;
      document.getElementById('newPrivateKey').value=privPem;
      resEl.style.display='block';
      await loadActiveKey(); await loadKeyHistory();
    }catch(err){errEl.textContent=err.message||'Key generation failed';errEl.style.display='block';}
    finally{setGenLoading(false);}
  });
  function setGenLoading(on){document.getElementById('generateBtnText').style.display=on?'none':'inline';document.getElementById('generateSpinner').style.display=on?'inline-block':'none';document.getElementById('btnGenerateKey').disabled=on;}

  /* Copy Buttons */
  document.querySelectorAll('.btn-copy').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const t=document.getElementById(btn.dataset.target);
      if(!t) return;
      navigator.clipboard.writeText(t.value).then(()=>{btn.textContent='✓ Copied!';btn.classList.add('copied');setTimeout(()=>{btn.textContent='Copy';btn.classList.remove('copied');},2000);});
    });
  });

  /* Sign */
  document.getElementById('btnSign').addEventListener('click', async()=>{
    const msg=document.getElementById('signMessage').value.trim();
    const key=document.getElementById('signPrivateKey').value.trim();
    const errEl=document.getElementById('signError');
    const resEl=document.getElementById('signResult');
    errEl.style.display='none'; resEl.style.display='none';
    if(!msg||!key){errEl.textContent='Message and private key are required.';errEl.style.display='block';return;}
    try{
      const ck=await importPrivateKey(key);
      const sig=await crypto.subtle.sign({name:'RSA-PSS',saltLength:32},ck,new TextEncoder().encode(msg));
      document.getElementById('signatureOutput').value=btoa(String.fromCharCode(...new Uint8Array(sig)));
      resEl.style.display='flex';
    }catch(err){errEl.textContent='Signing failed: '+err.message;errEl.style.display='block';}
  });

  /* Verify */
  document.getElementById('btnVerify').addEventListener('click', async()=>{
    const msg=document.getElementById('verifyMessage').value.trim();
    const sig=document.getElementById('verifySignature').value.trim();
    const pub=document.getElementById('verifyPublicKey').value.trim();
    const errEl=document.getElementById('verifyError');
    const resEl=document.getElementById('verifySigResult');
    errEl.style.display='none'; resEl.style.display='none';
    if(!msg||!sig||!pub){errEl.textContent='All three fields are required.';errEl.style.display='block';return;}
    try{
      const ck=await importPublicKey(pub);
      const sigBytes=Uint8Array.from(atob(sig),c=>c.charCodeAt(0));
      const valid=await crypto.subtle.verify({name:'RSA-PSS',saltLength:32},ck,sigBytes,new TextEncoder().encode(msg));
      resEl.className='verify-sig-result '+(valid?'valid':'invalid');
      resEl.textContent=valid?'✓ Signature is valid — message is authentic':'✗ Signature invalid — message may have been tampered with';
      resEl.style.display='block';
    }catch(err){errEl.textContent='Verification failed: '+err.message;errEl.style.display='block';}
  });

  async function loadKeyHistory(){
    const el=document.getElementById('keyHistoryList');
    try{
      const r=await API.get('/keypairs',true);
      const keys=r.keyPairs||[];
      if(!keys.length){el.innerHTML='<div class="key-history-empty"><p>No key pairs generated yet.</p></div>';return;}
      el.innerHTML=keys.map(kp=>`
        <div class="key-history-item">
          <div class="key-history-icon">${kp.status==='active'?'⬡':'⬢'}</div>
          <div class="key-history-info">
            <div class="key-history-label">${esc(kp.label)} <span class="badge ${kp.status==='active'?'badge-green':'badge-yellow'}" style="margin-left:8px">${kp.status}</span></div>
            <div class="key-history-meta"><span>${esc(kp.algorithm)}</span><span class="key-history-block">Block #${kp.blockIndex??'—'}</span><span>${new Date(kp.createdAt).toLocaleDateString()}</span><span>Fingerprint: ${kp.fingerprint?kp.fingerprint.substring(0,12)+'...':'—'}</span></div>
          </div>
        </div>`).join('');
    }catch(err){el.innerHTML='<div class="key-history-empty"><p style="color:var(--red)">Failed to load history</p></div>';}
  }

  /* Utils */
  function toPem(buf,label){const b64=btoa(String.fromCharCode(...new Uint8Array(buf)));const lines=b64.match(/.{1,64}/g).join('\n');return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;}
  function fromPem(pem){const b64=pem.replace(/-----[^-]+-----/g,'').replace(/\s/g,'');return Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer;}
  async function importPrivateKey(pem){return crypto.subtle.importKey('pkcs8',fromPem(pem),{name:'RSA-PSS',hash:'SHA-256'},false,['sign']);}
  async function importPublicKey(pem){return crypto.subtle.importKey('spki', fromPem(pem),{name:'RSA-PSS',hash:'SHA-256'},false,['verify']);}
  function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  await loadActiveKey();
  await loadKeyHistory();
});
