/* ============================================================
   access-control.js — Access Control, Consent & Audit Log
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  API.requireAuth();
  const user = API.getUser();
  if (user) { document.getElementById('userAvatarSm').textContent=((user.firstName||'?')[0]+(user.lastName||'?')[0]).toUpperCase(); document.getElementById('userNameSm').textContent=user.username||user.firstName; }
  document.getElementById('logoutBtn').addEventListener('click',()=>{if(confirm('Logout?'))API.logout();});

  let revokeId=null;

  async function loadDocCheckboxes(){
    const el=document.getElementById('docCheckboxList');
    try{
      const r=await API.get('/documents',true);
      const docs=(r.documents||[]).filter(d=>d.status==='active');
      if(!docs.length){el.innerHTML='<span style="color:var(--text-muted);font-size:0.85rem">No active documents. Upload documents first.</span>';return;}
      el.innerHTML=docs.map(d=>`<label class="doc-checkbox-item"><input type="checkbox" name="docIds" value="${d._id}"/><span class="doc-check-name">${esc(d.name)}</span><span class="doc-check-type">${esc(d.type)}</span></label>`).join('');
    }catch(e){el.innerHTML='<span style="color:var(--red);font-size:0.85rem">Failed to load documents</span>';}
  }

  document.getElementById('btnGrantAccess').addEventListener('click', async()=>{
    const target =document.getElementById('grantTarget').value.trim();
    const level  =document.getElementById('grantLevel').value;
    const expiry =document.getElementById('grantExpiry').value;
    const purpose=document.getElementById('grantPurpose').value.trim();
    const errEl  =document.getElementById('grantError');
    const sucEl  =document.getElementById('grantSuccess');
    errEl.style.display='none'; sucEl.style.display='none';
    if(!target){errEl.textContent='Please enter a username or email.';errEl.style.display='block';return;}
    const docIds=Array.from(document.querySelectorAll('input[name="docIds"]:checked')).map(cb=>cb.value);
    setGrantLoading(true);
    try{
      await API.post('/access/grant',{target,level,expiry,purpose,docIds},true);
      sucEl.textContent=`Access granted to "${target}" successfully.`;sucEl.style.display='block';
      document.getElementById('grantTarget').value='';document.getElementById('grantPurpose').value='';
      document.querySelectorAll('input[name="docIds"]').forEach(cb=>cb.checked=false);
      await loadGrants(); await loadAuditLog();
    }catch(err){errEl.textContent=err.message||'Failed to grant access';errEl.style.display='block';}
    finally{setGrantLoading(false);}
  });
  function setGrantLoading(on){document.getElementById('grantBtnText').style.display=on?'none':'inline';document.getElementById('grantSpinner').style.display=on?'inline-block':'none';document.getElementById('btnGrantAccess').disabled=on;}

  async function loadGrants(){
    const tbody=document.getElementById('grantsTableBody');
    const badge=document.getElementById('activeGrantsBadge');
    try{
      const r=await API.get('/access/grants',true);
      const grants=r.grants||[];
      badge.textContent=grants.filter(g=>g.status==='active').length;
      if(!grants.length){tbody.innerHTML='<tr><td colspan="6" class="table-empty">No access grants yet.</td></tr>';return;}
      tbody.innerHTML=grants.map(g=>{
        const expired=g.expiresAt&&new Date(g.expiresAt)<new Date();
        const statusBadge=g.status==='revoked'?'<span class="badge badge-red">Revoked</span>':expired?'<span class="badge badge-yellow">Expired</span>':'<span class="badge badge-green">Active</span>';
        const docsHtml=(g.docNames||[]).map(n=>`<span class="grant-doc-pill">${esc(n)}</span>`).join('')||'<span class="grant-doc-pill">Identity Only</span>';
        const initials=(g.granteeUsername||'?')[0].toUpperCase();
        const expiryStr=g.expiresAt?new Date(g.expiresAt).toLocaleDateString():'Never';
        return `<tr>
          <td><div class="grant-target-cell"><div class="grant-avatar">${initials}</div><div><div class="grant-target-name">${esc(g.granteeUsername||g.granteeEmail||'—')}</div><div class="grant-target-sub">${esc(g.purpose||'')}</div></div></div></td>
          <td><div class="grant-docs-cell">${docsHtml}</div></td>
          <td><span class="grant-level-badge level-${g.level}">${g.level}</span></td>
          <td><span class="grant-expires ${expired?'expired':''}">${expiryStr}</span></td>
          <td>${statusBadge}</td>
          <td>${g.status==='active'&&!expired?`<button class="btn-danger" style="padding:5px 12px;font-size:0.8rem" data-id="${g._id}" data-target="${esc(g.granteeUsername||g.granteeEmail)}">Revoke</button>`:'—'}</td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('[data-id]').forEach(btn=>{btn.addEventListener('click',()=>{revokeId=btn.dataset.id;document.getElementById('revokeGrantTarget').textContent=btn.dataset.target;document.getElementById('revokeGrantModal').style.display='flex';});});
    }catch(err){tbody.innerHTML=`<tr><td colspan="6" class="table-empty" style="color:var(--red)">Failed: ${esc(err.message)}</td></tr>`;}
  }

  document.getElementById('closeRevokeGrant').addEventListener('click',closeRevoke);
  document.getElementById('cancelRevokeGrant').addEventListener('click',closeRevoke);
  function closeRevoke(){document.getElementById('revokeGrantModal').style.display='none';document.getElementById('revokeGrantError').style.display='none';revokeId=null;}
  document.getElementById('confirmRevokeGrant').addEventListener('click',async()=>{
    if(!revokeId) return;
    const errEl=document.getElementById('revokeGrantError'); errEl.style.display='none';
    try{await API.delete(`/access/grant/${revokeId}`,true);closeRevoke();await loadGrants();await loadAuditLog();}
    catch(err){errEl.textContent=err.message||'Revoke failed';errEl.style.display='block';}
  });

  async function loadAuditLog(){
    const el=document.getElementById('auditLogList');
    try{
      const r=await API.get('/access/audit',true);
      const entries=r.log||[];
      if(!entries.length){el.innerHTML='<div class="audit-empty"><p>No consent events recorded yet.</p></div>';return;}
      el.innerHTML=entries.map(e=>{
        const dot=e.action.includes('grant')?'dot-grant':e.action.includes('revoke')?'dot-revoke':e.action.includes('upload')?'dot-upload':'dot-other';
        return `<div class="audit-entry"><div class="audit-dot ${dot}"></div><div class="audit-content"><div class="audit-action">${esc(formatAction(e.action,e.details))}</div><div class="audit-meta"><span class="audit-block">Block #${e.blockIndex??'—'}</span><span class="audit-time">${new Date(e.timestamp).toLocaleString()}</span>${e.details?.granteeUsername?`<span>→ ${esc(e.details.granteeUsername)}</span>`:''}</div></div></div>`;
      }).join('');
    }catch(err){el.innerHTML='<div class="audit-empty"><p style="color:var(--red)">Failed to load audit log</p></div>';}
  }

  function formatAction(action,d){
    if(action==='access_granted')   return `Access granted to ${d?.granteeUsername||d?.granteeEmail||'—'} (${d?.level||''})`;
    if(action==='access_revoked')   return `Access revoked for ${d?.granteeUsername||d?.granteeEmail||'—'}`;
    if(action==='document_upload')  return `Document anchored: "${d?.docName||'—'}"`;
    if(action==='document_revocation') return `Document revoked: "${d?.docName||'—'}"`;
    if(action==='keypair_generated')return `Key pair generated: "${d?.label||'—'}"`;
    return action;
  }
  function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  await loadDocCheckboxes();
  await loadGrants();
  await loadAuditLog();
});
