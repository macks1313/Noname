const SUPABASE_URL = "https://avexlkdrnhzdbxdhgpau.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_afp3TzOTuIj8tNLv8OaErA_TOWrUCzh";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
let currentUser = null;
let currentProfile = null;
let activeFeed = "all";
let activeView = "home";
let toastTimer;

const $ = (id) => document.getElementById(id);
function getPreferredTheme() {
  const saved = localStorage.getItem("pip-theme");
  if (saved === "day" || saved === "night") return saved;
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? "night" : "day";
}
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const night = theme === "night";
  $("theme-icon").textContent = night ? "☀️" : "🌙";
  $("theme-label").textContent = night ? "Mode jour" : "Mode nuit";
  $("theme-toggle").setAttribute("aria-label", night ? "Activer le mode jour" : "Activer le mode nuit");
  if ($("auth-theme-icon")) { $("auth-theme-icon").textContent = night ? "☀️" : "🌙"; $("auth-theme-label").textContent = night ? "Mode jour" : "Mode nuit"; }
  document.querySelector('meta[name="theme-color"]').setAttribute("content", night ? "#292536" : "#fffaf5");
}
applyTheme(getPreferredTheme());
const toggleTheme = () => {
  const next = document.body.dataset.theme === "night" ? "day" : "night";
  localStorage.setItem("pip-theme", next);
  applyTheme(next);
};
$("theme-toggle").addEventListener("click", toggleTheme);
$("auth-theme-toggle").addEventListener("click", toggleTheme);

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials = (name = "P") => name.trim().split(/\s+/).slice(0,2).map(x => x[0] || "").join("").toUpperCase() || "P";
const handleFor = (profile) => "@" + (profile?.username || "membre");
function showToast(message, error = false) {
  const el = $("toast"); el.textContent = message; el.className = "toast show" + (error ? " error" : "");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = "toast", 3500);
}
function showAuthError(message) { $("auth-error").textContent = message || ""; }
function avatarMarkup(profile, extra = "") {
  const name = profile?.display_name || "Membre";
  return profile?.avatar_url
    ? '<div class="avatar '+extra+'"><img src="'+escapeHtml(profile.avatar_url)+'" alt=""></div>'
    : '<div class="avatar '+extra+'">'+escapeHtml(initials(name))+'</div>';
}
function switchAuth(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach(b => b.classList.toggle("active", b.dataset.authTab === tab));
  $("login-form").classList.toggle("hidden", tab !== "login");
  $("signup-form").classList.toggle("hidden", tab !== "signup");
  showAuthError("");
}
document.querySelectorAll("[data-auth-tab]").forEach(b => b.addEventListener("click", () => switchAuth(b.dataset.authTab)));

$("login-button").addEventListener("click", async () => {
  showAuthError("");
  const email = $("login-email").value.trim(), password = $("login-password").value;
  if (!email || !password) return showAuthError("Saisissez votre e-mail et votre mot de passe.");
  setBusy("login-button", true, "Connexion...");
  const { error } = await db.auth.signInWithPassword({ email, password });
  setBusy("login-button", false, "Se connecter");
  if (error) showAuthError(authMessage(error));
});
$("signup-button").addEventListener("click", async () => {
  showAuthError("");
  const name = $("signup-name").value.trim(), email = $("signup-email").value.trim(), password = $("signup-password").value;
  if (!name || !email || password.length < 8) return showAuthError("Indiquez un nom, un e-mail valide et un mot de passe d'au moins 8 caractères.");
  setBusy("signup-button", true, "Création...");
  const username = makeUsername(name);
  const { data, error } = await db.auth.signUp({ email, password, options: { data: { display_name: name, username }, emailRedirectTo: location.origin + location.pathname } });
  setBusy("signup-button", false, "Créer mon compte");
  if (error) return showAuthError(authMessage(error));
  if (data.session) showToast("Compte créé. Bienvenue chez PIP !");
  else showAuthError("Compte créé. Vérifiez votre boîte e-mail pour confirmer votre inscription, puis connectez-vous.");
});
$("forgot-button").addEventListener("click", async () => {
  const email = $("login-email").value.trim();
  if (!email) return showAuthError("Saisissez d'abord votre adresse e-mail.");
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  showAuthError(error ? authMessage(error) : "Si un compte correspond à cette adresse, un e-mail de réinitialisation a été envoyé.");
});
function makeUsername(name) {
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,18);
  return (base || "membre") + "_" + Math.floor(1000 + Math.random()*9000);
}
function authMessage(error) {
  const m = (error.message || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("already registered")) return "Cette adresse e-mail possède déjà un compte.";
  if (m.includes("password")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("email")) return "Vérifiez votre adresse e-mail.";
  return error.message || "Une erreur est survenue.";
}
function setBusy(id, busy, label) { const b=$(id); b.disabled=busy; b.dataset.original ||= b.innerHTML; b.textContent=label; }
$("logout-button").addEventListener("click", async () => { await db.auth.signOut(); showToast("Vous êtes déconnecté."); });

db.auth.onAuthStateChange((_event, session) => {
  setTimeout(() => {
    currentUser = session?.user || null;
    if (currentUser) enterApp();
    else { $("app").classList.add("hidden"); $("auth-screen").classList.remove("hidden"); }
  }, 0);
});

async function enterApp() {
  $("auth-screen").classList.add("hidden"); $("app").classList.remove("hidden");
  await loadMyProfile();
  await loadFeed();
  await loadSuggestedMembers();
}
async function loadMyProfile() {
  const { data, error } = await db.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
  if (error) { showToast("Impossible de charger votre profil : vérifiez le script SQL Supabase.", true); return; }
  currentProfile = data;
  const display = data?.display_name || currentUser.user_metadata?.display_name || "Membre";
  const handle = handleFor(data);
  $("side-name").textContent = display; $("side-handle").textContent = handle;
  $("side-avatar").textContent = initials(display); $("composer-avatar").textContent = initials(display);
}
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => openView(b.dataset.view)));
function openView(view) {
  activeView = view;
  document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  ["home","explore","profile"].forEach(v => $(v+"-view").classList.toggle("hidden", v !== view));
  $("view-title").textContent = view === "home" ? "Accueil" : view === "explore" ? "Explorer" : "Mon profil";
  if (view === "profile") loadProfile(currentUser.id, true);
  if (view === "explore") loadExplore();
}
$("sidebar-compose").addEventListener("click", () => { openView("home"); $("post-input").focus(); window.scrollTo({top:0,behavior:"smooth"}); });
$("post-input").addEventListener("input", () => {
  const n = $("post-input").value.length; $("char-count").textContent = n + " / 500";
  $("publish-button").disabled = !$("post-input").value.trim() || n > 500;
});
$("publish-button").addEventListener("click", async () => {
  const content = $("post-input").value.trim(); if (!content) return;
  $("publish-button").disabled = true;
  const { error } = await db.from("posts").insert({ user_id: currentUser.id, content });
  if (error) { showToast("Publication impossible : " + error.message, true); $("publish-button").disabled = false; return; }
  $("post-input").value = ""; $("char-count").textContent = "0 / 500"; showToast("Votre publication est en ligne.");
  await loadFeed();
});
document.querySelectorAll("[data-feed]").forEach(b => b.addEventListener("click", () => {
  activeFeed = b.dataset.feed;
  document.querySelectorAll("[data-feed]").forEach(x => x.classList.toggle("active", x === b));
  loadFeed();
}));
async function loadFeed(target = "feed", mode = activeFeed) {
  const container = $(target); if (!container) return;
  container.innerHTML = '<div class="loading-state"><span class="spinner"></span> Chargement...</div>';
  let query = db.from("posts").select("id,user_id,content,created_at,profiles(id,display_name,username,avatar_url),likes(user_id)").order("created_at",{ascending:false}).limit(60);
  if (mode === "following") {
    const { data: follows, error: followError } = await db.from("follows").select("following_id").eq("follower_id",currentUser.id);
    if (followError) { container.innerHTML = '<div class="empty-state">Impossible de charger les abonnements.</div>'; return; }
    const ids = (follows || []).map(x=>x.following_id);
    if (!ids.length) { container.innerHTML = emptyMarkup("Vous ne suivez personne pour le moment.","Explorez la communauté pour trouver des comptes à suivre."); return; }
    query = query.in("user_id",ids);
  }
  const { data, error } = await query;
  if (error) { container.innerHTML = '<div class="empty-state">Erreur de chargement. Vérifiez les tables et les règles RLS dans Supabase.</div>'; return; }
  renderPosts(container,data || []);
}
function emptyMarkup(title, detail) { return '<div class="empty-state"><div class="empty-icon">✳</div><strong>'+escapeHtml(title)+'</strong><p>'+escapeHtml(detail)+'</p></div>'; }
function renderPosts(container, posts) {
  if (!posts.length) { container.innerHTML = emptyMarkup("Le fil est encore calme.","Soyez le premier à lancer une conversation."); return; }
  container.innerHTML = posts.map(post => {
    const p = post.profiles || {display_name:"Membre",username:"membre"};
    const liked = (post.likes || []).some(l=>l.user_id===currentUser.id);
    const when = timeAgo(post.created_at);
    return '<article class="post" data-post="'+post.id+'">'+avatarMarkup(p)+'<div class="post-body"><div class="post-head"><strong>'+escapeHtml(p.display_name || "Membre")+'</strong><span class="post-handle">'+escapeHtml(handleFor(p))+'</span><span class="post-time">· '+when+'</span></div><p class="post-text">'+escapeHtml(post.content)+'</p><div class="post-actions"><button class="action-btn like-btn '+(liked?'liked':'')+'" data-like="'+post.id+'">'+(liked?'♥':'♡')+' <span>'+(post.likes?.length || 0)+'</span></button>'+(post.user_id===currentUser.id?'<button class="action-btn delete-post" data-delete="'+post.id+'">Supprimer</button>':'')+'</div></div></article>';
  }).join("");
  container.querySelectorAll("[data-like]").forEach(b=>b.addEventListener("click",()=>toggleLike(b.dataset.like,b)));
  container.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deletePost(b.dataset.delete)));
}
function timeAgo(date) {
  const seconds=Math.max(0,Math.floor((Date.now()-new Date(date).getTime())/1000));
  if(seconds<60)return "à l'instant"; if(seconds<3600)return Math.floor(seconds/60)+" min";
  if(seconds<86400)return Math.floor(seconds/3600)+" h"; if(seconds<604800)return Math.floor(seconds/86400)+" j";
  return new Date(date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"});
}
async function toggleLike(postId,button) {
  button.disabled=true;
  const {data:existing}=await db.from("likes").select("post_id").eq("post_id",postId).eq("user_id",currentUser.id).maybeSingle();
  const result = existing
    ? await db.from("likes").delete().eq("post_id",postId).eq("user_id",currentUser.id)
    : await db.from("likes").insert({post_id:postId,user_id:currentUser.id});
  if(result.error) showToast("Action impossible : "+result.error.message,true);
  await loadFeed(activeView==="explore"?"explore-feed":"feed",activeFeed);
}
async function deletePost(id) {
  if(!confirm("Supprimer définitivement cette publication ?"))return;
  const {error}=await db.from("posts").delete().eq("id",id).eq("user_id",currentUser.id);
  if(error)showToast(error.message,true);else{showToast("Publication supprimée.");await loadFeed();}
}
async function loadExplore() {
  await loadFeed("explore-feed","all");
}
let searchTimeout;
$("member-search").addEventListener("input",()=>{
  clearTimeout(searchTimeout); searchTimeout=setTimeout(searchMembers,250);
});
async function searchMembers() {
  const term=$("member-search").value.trim();
  if(term.length<2){$("member-results").innerHTML='<p class="muted small">Saisissez au moins 2 caractères.</p>';return;}
  const {data,error}=await db.from("profiles").select("id,display_name,username,avatar_url").ilike("display_name","%"+term.replace(/[%_]/g,"")+"%").neq("id",currentUser.id).limit(10);
  if(error){$("member-results").innerHTML='<p class="muted small">Recherche indisponible.</p>';return;}
  $("member-results").innerHTML=data.length?data.map(p=>'<div class="member-result">'+avatarMarkup(p)+'<div class="member-info"><strong>'+escapeHtml(p.display_name)+'</strong><small>'+escapeHtml(handleFor(p))+'</small></div><button class="action-btn" data-open-profile="'+p.id+'">Voir le profil ↗</button></div>').join(""):'<p class="muted small">Aucun membre trouvé.</p>';
  $("member-results").querySelectorAll("[data-open-profile]").forEach(b=>b.addEventListener("click",()=>loadProfile(b.dataset.openProfile,false)));
}
async function loadSuggestedMembers() {
  const {data}=await db.from("profiles").select("id,display_name,username,avatar_url").neq("id",currentUser.id).limit(3);
  $("suggested-members").innerHTML=(data||[]).length?(data||[]).map(p=>'<div class="suggested-member">'+avatarMarkup(p)+'<div><strong>'+escapeHtml(p.display_name||"Membre")+'</strong><small>'+escapeHtml(handleFor(p))+'</small></div></div>').join(""):'<span class="muted small">Vous êtes parmi les premiers membres !</span>';
}
async function loadProfile(userId, own) {
  const {data:profile,error}=await db.from("profiles").select("*").eq("id",userId).maybeSingle();
  if(error||!profile){$("profile-content").innerHTML=emptyMarkup("Profil introuvable.","Ce membre n'est peut-être plus disponible.");return;}
  const [{count:postsCount},{count:followerCount},{count:followingCount},{data:posts},{data:follow}] = await Promise.all([
    db.from("posts").select("*",{count:"exact",head:true}).eq("user_id",userId),
    db.from("follows").select("*",{count:"exact",head:true}).eq("following_id",userId),
    db.from("follows").select("*",{count:"exact",head:true}).eq("follower_id",userId),
    db.from("posts").select("id,user_id,content,created_at,profiles(id,display_name,username,avatar_url),likes(user_id)").eq("user_id",userId).order("created_at",{ascending:false}).limit(40),
    own?Promise.resolve({data:null}):db.from("follows").select("following_id").eq("follower_id",currentUser.id).eq("following_id",userId).maybeSingle()
  ]);
  $("profile-content").innerHTML='<div class="profile-cover"></div><div class="profile-head">'+avatarMarkup(profile)+'<h2>'+escapeHtml(profile.display_name)+'</h2><span class="handle">'+escapeHtml(handleFor(profile))+'</span>'+(profile.bio?'<p>'+escapeHtml(profile.bio)+'</p>':'')+'<div class="profile-stats"><span><strong>'+(postsCount||0)+'</strong> publications</span><span><strong>'+(followerCount||0)+'</strong> abonnés</span><span><strong>'+(followingCount||0)+'</strong> abonnements</span></div>'+(!own?'<button class="primary-btn follow-btn" id="follow-toggle">'+(follow.data?'Abonné ✓':'Suivre ＋')+'</button>':'')+'</div><h3 class="profile-title">Publications</h3><div id="profile-posts" class="feed"></div>';
  renderPosts($("profile-posts"),posts||[]);
  if(!own)$("follow-toggle").addEventListener("click",()=>toggleFollow(userId,!!follow.data));
}
async function toggleFollow(userId,following) {
  const result=following?await db.from("follows").delete().eq("follower_id",currentUser.id).eq("following_id",userId):await db.from("follows").insert({follower_id:currentUser.id,following_id:userId});
  if(result.error)showToast(result.error.message,true);else{showToast(following?"Vous ne suivez plus ce membre.":"Vous suivez maintenant ce membre.");loadProfile(userId,false);}
}
$("member-results").innerHTML='<p class="muted small">Recherchez un membre de PIP.</p>';
