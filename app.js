/* Storage keys */
const USERS_KEY='nr_users_align2';
const SESSION_KEY='nr_session_align2';
const AVATAR_KEY='nr_avatar_align2_';

/* Helpers */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY)||'[]');
const saveUsers = list => localStorage.setItem(USERS_KEY, JSON.stringify(list));
const getSession = () => localStorage.getItem(SESSION_KEY);
const setSession = email => localStorage.setItem(SESSION_KEY, email);
const setAvatar = (e,d)=>localStorage.setItem(AVATAR_KEY+e,d);
const getAvatar = e => localStorage.getItem(AVATAR_KEY+e);
const clearAvatar = e => localStorage.removeItem(AVATAR_KEY+e);
const toast = t => { const el=$('#toast'); el.textContent=t; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),1700); };

/* Menu mobile */
$('#menuToggle')?.addEventListener('click',()=> $('#mainNav').classList.toggle('open'));

/* Router */
document.addEventListener('click',e=>{
  const link=e.target.closest('a[data-route]'); if(!link) return;
  const r=link.dataset.route;
  if(r==='login'){ e.preventDefault(); openSheet('#sheet-login'); return; }
  if(r==='register'){ e.preventDefault(); openSheet('#sheet-register'); return; }
  e.preventDefault(); showPage(r);
});
function showPage(name){
  $$('#app [data-page]').forEach(p=>p.hidden=true);
  (document.querySelector('#page-'+name)||document.querySelector('#page-home')).hidden=false;
  if(name==='profile' && !getSession()){ openSheet('#sheet-login'); $('#page-profile').hidden=true; }
  $('#mainNav')?.classList.remove('open');
}
showPage('home');

/* Sheets */
function openSheet(sel){
  document.body.classList.add('sheet-open');
  if(sel==='#sheet-login'){ $('#loginForm')?.reset(); refreshFloating($('#loginForm')); }
  if(sel==='#sheet-register'){ $('#registerForm')?.reset(); refreshFloating($('#registerForm')); renderMeter(0); }
  $(sel).classList.add('is-open');
}
function closeSheet(sel){
  $(sel).classList.remove('is-open');
  if(!document.querySelector('.sheet.is-open')) document.body.classList.remove('sheet-open');
}
$$('.sheet-close').forEach(b=>b.addEventListener('click',()=>closeSheet(b.dataset.close)));
document.addEventListener('click',e=>{
  const a=e.target.closest('a[data-swap]'); if(!a) return; e.preventDefault();
  if(a.dataset.swap==='register'){ closeSheet('#sheet-login'); openSheet('#sheet-register'); }
  else{ closeSheet('#sheet-register'); openSheet('#sheet-login'); }
});

/* Floating labels */
function markFilled(input){
  const f=input.closest('.field'); if(!f) return;
  (input.value||'').trim()!=='' ? f.classList.add('has-value') : f.classList.remove('has-value');
}
function bindFloating(scope=document){
  scope.querySelectorAll('.field input').forEach(inp=>{
    inp.addEventListener('focus',()=> inp.closest('.field')?.classList.add('is-focus'));
    ['input','change','blur'].forEach(ev=> inp.addEventListener(ev,()=>{
      if(ev==='blur') inp.closest('.field')?.classList.remove('is-focus');
      markFilled(inp);
    }));
    markFilled(inp);
  });
}
function refreshFloating(scope){ scope?.querySelectorAll('.field').forEach(f=>f.classList.remove('is-focus','has-value')); bindFloating(scope||document); }
bindFloating(document);

/* Password toggle */
function togglePw(eye){
  const id=eye.getAttribute('data-target');
  const input=document.getElementById(id);
  if(!input) return;
  const show=input.type==='password';
  input.type = show ? 'text' : 'password';
  eye.classList.toggle('fa-eye', !show);
  eye.classList.toggle('fa-eye-slash', show);
}
document.addEventListener('click', e=>{
  const t=e.target.closest('.pw-toggle'); if(!t) return; e.preventDefault(); togglePw(t);
});
document.addEventListener('touchstart', e=>{
  const t=e.target.closest('.pw-toggle'); if(!t) return; e.preventDefault(); togglePw(t);
},{passive:false});

/* Registrazione */
$('#registerForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const name=$('#regName').value.trim();
  const email=$('#regEmail').value.trim().toLowerCase();
  const pw=$('#regPassword').value;
  const pw2=$('#regPassword2').value;
  if(name.length<3) return toast('Nickname troppo corto');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Email non valida');
  if(pw.length<6) return toast('Password troppo corta');
  if(pw!==pw2) return toast('Le password non coincidono');
  if(!$('#terms').checked) return toast('Accetto i termini');

  const users=getUsers();
  if(users.some(u=>u.email===email)) return toast('Email già registrata');

  users.push({name,email,password:pw});
  saveUsers(users);

  toast('Registrazione completata! Accedi ora');
  closeSheet('#sheet-register'); openSheet('#sheet-login');
});

/* Meter password */
const meter = $('#pwMeter')?.querySelector('span');
const pwText = $('#pwText');
function renderMeter(score){
  if(meter) meter.style.width=(score*25)+'%';
  if(pwText) pwText.textContent=(['Molto debole','Debole','Media','Forte'][Math.max(0,score-1)]||'Sicurezza password');
}
$('#regPassword')?.addEventListener('input', e=>{
  const v=e.target.value; let s=0;
  if(v.length>=6)s++; if(v.length>=10)s++;
  if(/[a-z]/.test(v))s++; if(/[A-Z]/.test(v))s++; if(/\d/.test(v))s++; if(/[^A-Za-z0-9]/.test(v))s++;
  renderMeter(Math.min(4, Math.floor(s/2)));
});

/* Login */
$('#loginForm')?.addEventListener('submit', e=>{
  e.preventDefault();
  const email=$('#loginEmail').value.trim().toLowerCase();
  const pw=$('#loginPassword').value;
  const u=getUsers().find(x=>x.email===email && x.password===pw);
  if(!u) return toast('Credenziali errate');
  setSession(email);
  updateAuthUI(); updateTopAvatar(); loadProfile();
  toast('Benvenuto, '+u.name);
  closeSheet('#sheet-login'); showPage('profile');
});

/* Profilo */
function loadProfile(){
  const e=getSession(); if(!e) return;
  const u=getUsers().find(x=>x.email===e); if(!u) return;
  $('#profileName').textContent=u.name;
  $('#profileEmail').textContent=u.email;
  const av=getAvatar(e);
  if(av){ $('#avatarPreview').src=av; $('#avatarPreview').hidden=false; $('#avatarFallback').style.display='none'; }
  else { $('#avatarPreview').hidden=true; $('#avatarFallback').style.display='block'; }
}
$('#avatarInput')?.addEventListener('change',()=>{
  const f=$('#avatarInput').files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{ setAvatar(getSession(), r.result); loadProfile(); updateTopAvatar(); toast('Avatar aggiornato'); };
  r.readAsDataURL(f);
});
$('#removeAvatar')?.addEventListener('click',()=>{ clearAvatar(getSession()); loadProfile(); updateTopAvatar(); toast('Avatar rimosso'); });
$('#saveProfile')?.addEventListener('click',()=>{
  const e=getSession(); if(!e) return;
  const users=getUsers(); const u=users.find(x=>x.email===e); if(!u) return;
  const n=$('#newName').value.trim(); if(!n) return toast('Scrivi un nickname');
  u.name=n; saveUsers(users); loadProfile(); toast('Salvato');
});
$('#logoutBtn')?.addEventListener('click',()=>{
  localStorage.removeItem(SESSION_KEY);
  updateTopAvatar(); updateAuthUI(); showPage('home'); toast('Logout');
});

/* Recovery */
$('#openRecovery')?.addEventListener('click',e=>{e.preventDefault();$('#recoveryOverlay').classList.add('is-open');});
$('#closeRecovery')?.addEventListener('click',()=>$('#recoveryOverlay').classList.remove('is-open'));
$('#sendRecovery')?.addEventListener('click',()=>{ toast('Se esiste un account, riceverai un link ✉️'); $('#recoveryOverlay').classList.remove('is-open'); });

/* Avatar header + navbar visibility */
function updateTopAvatar(){
  const box = document.querySelector('.avatar-topbox');
  const img = $('#avatarImage');
  const icon = $('#avatarIcon');
  const email = getSession();

  if(!email){ box.style.display='none'; img.style.display='none'; icon.style.display='none'; return; }
  box.style.display='flex';
  const data=getAvatar(email);
  if(data){ img.src=data; img.style.display='block'; icon.style.display='none'; }
  else { img.style.display='none'; icon.style.display='block'; }
}
function updateAuthUI(){ $('#navProfile').hidden = !getSession(); }

/* Init */
window.addEventListener('load', ()=>{
  updateTopAvatar(); updateAuthUI();
  if(getSession()) loadProfile();
  bindFloating(document);
});

/* Toast inline */
const ss=document.createElement('style');
ss.textContent=`#toast{opacity:0} #toast.show{opacity:1}`;
document.head.appendChild(ss);
