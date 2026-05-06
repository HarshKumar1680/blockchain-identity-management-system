/* ============================================================
   documents.js — Document Upload, Hash Verification, List
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  API.requireAuth();
  const user = API.getUser();
  if (user) {
    document.getElementById('userAvatarSm').textContent = ((user.firstName||'?')[0]+(user.lastName||'?')[0]).toUpperCase();
    document.getElementById('userNameSm').textContent   = user.username||user.firstName;
  }
  document.getElementById('logoutBtn').addEventListener('click', () => { if(confirm('Logout?')) API.logout(); });

  let selectedFile=null, selectedHash=null, allDocs=[], revokeTarget=null;

  /* ---- Drop Zone ---- */
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput= document.getElementById('fileInput');
  document.getElementById('browseBtn').addEventListener('click', ()=>fileInput.click());
  dropzone.addEventListener('click', ()=>fileInput.click());
  dropzone.addEventListener('dragover', e=>{e.preventDefault();dropzone.classList.add('drag-over');});
  dropzone.addEventListener('dragleave',()=>dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e=>{e.preventDefault();dropzone.classList.remove('drag-over');if(e.dataTransfer.files[0])handleFileSelect(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change', ()=>{if(fileInput.files[0])handleFileSelect(fileInput.files[0]);});

  async function handleFileSelect(file) {
    if(file.size>10*1024*1024){alert('File too large. Max 10MB.');return;}
    selectedFile=file;
    document.getElementById('uploadDropzone').style.display='none';
    document.getElementById('filePreviewBar').style.display='flex';
    document.getElementById('uploadFormCard').style.display='flex';
    document.getElementById('filePreviewIcon').textContent=fileEmoji(file.name);
    document.getElementById('filePreviewName').textContent=file.name;
    document.getElementById('filePreviewSize').textContent=formatBytes(file.size);
    document.getElementById('fileHashPreview').textContent='Computing...';
    document.getElementById('docName').value=file.name.replace(/\.[^/.]+$/,'');
    try { selectedHash=await sha256(file); document.getElementById('fileHashPreview').textContent=selectedHash.substring(0,16)+'...'; }
    catch(e){ document.getElementById('fileHashPreview').textContent='Error'; }
  }

  document.getElementById('btnRemoveFile').addEventListener('click', resetUpload);
  document.getElementById('btnCancelUpload').addEventListener('click', resetUpload);
  function resetUpload() {
    selectedFile=null; selectedHash=null; fileInput.value='';
    document.getElementById('uploadDropzone').style.display='block';
    document.getElementById('filePreviewBar').style.display='none';
    document.getElementById('uploadFormCard').style.display='none';
    document.getElementById('uploadSuccessCard').style.display='none';
    document.getElementById('uploadError').style.display='none';
    document.getElementById('docName').value='';
    document.getElementById('docDescription').value='';
  }

  /* ---- Upload Submit ---- */
  document.getElementById('btnUpload').addEventListener('click', async ()=>{
    if(!selectedFile||!selectedHash) return;
    const name=document.getElementById('docName').value.trim();
    const type=document.getElementById('docType').value;
    const desc=document.getElementById('docDescription').value.trim();
    const errEl=document.getElementById('uploadError');
    if(!name){errEl.textContent='Please enter a document name.';errEl.style.display='block';return;}
    errEl.style.display='none';
    setUploadLoading(true);
    try {
      const r=await API.post('/documents/upload',{name,type,description:desc,hash:selectedHash,fileName:selectedFile.name,fileSize:selectedFile.size,mimeType:selectedFile.type},true);
      document.getElementById('filePreviewBar').style.display='none';
      document.getElementById('uploadFormCard').style.display='none';
      document.getElementById('uploadSuccessCard').style.display='block';
      document.getElementById('txBlock').textContent=r.document.blockIndex??'—';
      document.getElementById('txHash').textContent=shortHash(r.document.blockHash);
      document.getElementById('txTime').textContent=new Date(r.document.createdAt).toLocaleString();
      await loadDocuments();
    } catch(err){ errEl.textContent=err.message||'Upload failed'; errEl.style.display='block'; }
    finally{ setUploadLoading(false); }
  });
  document.getElementById('btnUploadAnother').addEventListener('click', resetUpload);
  function setUploadLoading(on){document.getElementById('uploadBtnText').style.display=on?'none':'inline';document.getElementById('uploadSpinner').style.display=on?'inline-block':'none';document.getElementById('btnUpload').disabled=on;}

  /* ---- Verify ---- */
  const verifyDrop=document.getElementById('verifyDrop');
  const verifyInput=document.getElementById('verifyInput');
  document.getElementById('verifyBrowse').addEventListener('click',()=>verifyInput.click());
  verifyDrop.addEventListener('click',()=>verifyInput.click());
  verifyDrop.addEventListener('dragover',e=>{e.preventDefault();verifyDrop.classList.add('drag-over');});
  verifyDrop.addEventListener('dragleave',()=>verifyDrop.classList.remove('drag-over'));
  verifyDrop.addEventListener('drop',e=>{e.preventDefault();verifyDrop.classList.remove('drag-over');if(e.dataTransfer.files[0])handleVerify(e.dataTransfer.files[0]);});
  verifyInput.addEventListener('change',()=>{if(verifyInput.files[0])handleVerify(verifyInput.files[0]);});

  async function handleVerify(file){
    const rw=document.getElementById('verifyResultWrap');
    const sb=document.getElementById('verifyStatusBlock');
    verifyDrop.style.display='none'; rw.style.display='flex';
    sb.innerHTML='<div class="loading-spinner" style="width:24px;height:24px;border-width:2px;margin:10px 0"></div>';
    document.getElementById('verifyHashVal').textContent='Computing...';
    try{
      const hash=await sha256(file);
      document.getElementById('verifyHashVal').textContent=hash.substring(0,20)+'...';
      const r=await API.post('/documents/verify',{hash},true);
      if(r.found){
        const d=r.document;
        sb.innerHTML=`<div class="verify-success"><h4>✓ Document Verified on Blockchain</h4><div class="verify-match-info">
          <div class="verify-match-row"><span>Document Name</span><span>${esc(d.name)}</span></div>
          <div class="verify-match-row"><span>Type</span><span>${esc(d.type)}</span></div>
          <div class="verify-match-row"><span>Block Height</span><span>${d.blockIndex}</span></div>
          <div class="verify-match-row"><span>Anchored</span><span>${new Date(d.createdAt).toLocaleString()}</span></div>
          <div class="verify-match-row"><span>Status</span><span style="color:${d.status==='active'?'var(--green)':'var(--red)'}">${d.status==='active'?'✓ Active':'✗ Revoked'}</span></div>
        </div></div>`;
      } else {
        sb.innerHTML=`<div class="verify-fail"><h4>✗ Document Not Found</h4><p>This document's hash does not match any record. It may have been tampered with or was never uploaded.</p></div>`;
      }
    }catch(err){sb.innerHTML=`<div class="verify-fail"><h4>✗ Error</h4><p>${esc(err.message)}</p></div>`;}
  }
  document.getElementById('btnVerifyReset').addEventListener('click',()=>{verifyInput.value='';document.getElementById('verifyResultWrap').style.display='none';verifyDrop.style.display='block';document.getElementById('verifyHashVal').textContent='—';document.getElementById('verifyStatusBlock').innerHTML='';});

  /* ---- Documents List ---- */
  async function loadDocuments(){
    const grid=document.getElementById('docsGrid');
    try{
      const r=await API.get('/documents',true);
      allDocs=r.documents||[];
      renderDocs(allDocs);
    }catch(err){grid.innerHTML=`<p style="color:var(--red);padding:20px">Failed: ${esc(err.message)}</p>`;}
  }

  function renderDocs(docs){
    const grid=document.getElementById('docsGrid');
    if(!docs||docs.length===0){grid.innerHTML=`<div class="empty-docs"><div class="empty-docs-icon">◧</div><h3>No Documents Yet</h3><p>Upload your first document above.</p></div>`;return;}
    grid.innerHTML=docs.map(d=>`
      <div class="doc-card ${d.status==='revoked'?'revoked':''}" data-id="${d._id}">
        <div class="doc-card-header">
          <div class="doc-type-icon">${docEmoji(d.type)}</div>
          <div><div class="doc-card-title">${esc(d.name)}</div><div class="doc-card-type">${esc(d.type)}</div></div>
          ${d.status==='revoked'?'<span class="badge badge-red" style="margin-left:auto">Revoked</span>':'<span class="badge badge-green" style="margin-left:auto">Active</span>'}
        </div>
        <div class="doc-hash-preview">${esc(d.hash)}</div>
        <div class="doc-card-footer"><span class="doc-card-time">${new Date(d.createdAt).toLocaleDateString()}</span><span class="doc-card-block">Block #${d.blockIndex??'—'}</span></div>
      </div>`).join('');
    grid.querySelectorAll('.doc-card').forEach(card=>{card.addEventListener('click',()=>{const d=allDocs.find(x=>x._id===card.dataset.id);if(d)openDocModal(d);});});
  }

  document.getElementById('docSearch').addEventListener('input', filterDocs);
  document.getElementById('docFilter').addEventListener('change', filterDocs);
  function filterDocs(){
    const q=document.getElementById('docSearch').value.toLowerCase();
    const t=document.getElementById('docFilter').value;
    renderDocs(allDocs.filter(d=>(d.name.toLowerCase().includes(q)||d.hash.includes(q))&&(t==='all'||d.type===t)));
  }

  /* ---- Doc Modal ---- */
  function openDocModal(doc){
    document.getElementById('modalDocTitle').textContent=doc.name;
    document.getElementById('docDetailGrid').innerHTML=`
      <div class="doc-detail-row"><span class="doc-detail-label">Document ID</span><span class="doc-detail-value mono">${esc(doc._id)}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Name</span><span class="doc-detail-value">${esc(doc.name)}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Type</span><span class="doc-detail-value">${esc(doc.type)}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Description</span><span class="doc-detail-value">${esc(doc.description||'—')}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">SHA-256 Hash</span><span class="doc-detail-value mono">${esc(doc.hash)}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">File Name</span><span class="doc-detail-value">${esc(doc.fileName||'—')}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">File Size</span><span class="doc-detail-value">${doc.fileSize?formatBytes(doc.fileSize):'—'}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Block Height</span><span class="doc-detail-value">${doc.blockIndex??'—'}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Block Hash</span><span class="doc-detail-value mono">${esc(doc.blockHash||'—')}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Uploaded</span><span class="doc-detail-value">${new Date(doc.createdAt).toLocaleString()}</span></div>
      <div class="doc-detail-row"><span class="doc-detail-label">Status</span><span class="doc-detail-value"><span class="badge ${doc.status==='active'?'badge-green':'badge-red'}">${doc.status==='active'?'✓ Active':'✗ Revoked'}</span></span></div>`;
    const act=document.getElementById('docModalActions');
    act.innerHTML='';
    if(doc.status==='active'){const b=document.createElement('button');b.className='btn-danger';b.textContent='Revoke Document';b.addEventListener('click',()=>{revokeTarget=doc;document.getElementById('revokeDocName').textContent=doc.name;document.getElementById('docDetailModal').style.display='none';document.getElementById('revokeDocModal').style.display='flex';});act.appendChild(b);}
    document.getElementById('docDetailModal').style.display='flex';
  }
  document.getElementById('closeDocModal').addEventListener('click',()=>{document.getElementById('docDetailModal').style.display='none';});
  document.getElementById('docDetailModal').addEventListener('click',e=>{if(e.target.id==='docDetailModal')e.target.style.display='none';});

  /* ---- Revoke ---- */
  document.getElementById('closeRevokeDocModal').addEventListener('click',closeRevoke);
  document.getElementById('cancelRevokeDoc').addEventListener('click',closeRevoke);
  function closeRevoke(){document.getElementById('revokeDocModal').style.display='none';document.getElementById('revokeError').style.display='none';revokeTarget=null;}
  document.getElementById('confirmRevokeDoc').addEventListener('click', async()=>{
    if(!revokeTarget) return;
    const errEl=document.getElementById('revokeError');
    errEl.style.display='none';
    try{await API.delete(`/documents/${revokeTarget._id}`,true);closeRevoke();await loadDocuments();}
    catch(err){errEl.textContent=err.message||'Revoke failed';errEl.style.display='block';}
  });

  /* ---- Helpers ---- */
  async function sha256(file){const buf=await file.arrayBuffer();const h=await crypto.subtle.digest('SHA-256',buf);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
  function formatBytes(b){if(b<1024)return b+' B';if(b<1024*1024)return(b/1024).toFixed(1)+' KB';return(b/(1024*1024)).toFixed(1)+' MB';}
  function shortHash(h){if(!h)return'—';return h.substring(0,10)+'...'+h.substring(h.length-8);}
  function fileEmoji(n){const e=n.split('.').pop().toLowerCase();return{pdf:'📄',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',docx:'📝',doc:'📝',txt:'📋'}[e]||'📁';}
  function docEmoji(t){return{identity:'🪪',certificate:'🏆',license:'📋',medical:'🏥',financial:'💰',other:'📁'}[t]||'📁';}
  function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  loadDocuments();
});
