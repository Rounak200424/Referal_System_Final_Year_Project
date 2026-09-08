const overlay=document.getElementById("overlay"), loginForm=document.getElementById("loginForm"), signupForm=document.getElementById("signupForm"), title=document.getElementById("title"), subtitle=document.getElementById("subtitle"), nav=document.getElementById("navlinks");
function openAuth(type){overlay.classList.add("active");document.body.style.overflow="hidden";type==="signup"?showSignup():showLogin()}
function showLogin(){loginForm.classList.remove("hidden");signupForm.classList.add("hidden");title.textContent="Welcome back";subtitle.textContent="Login to continue to your account."}
function showSignup(){signupForm.classList.remove("hidden");loginForm.classList.add("hidden");title.textContent="Create your account";subtitle.textContent="Join ReferConnect and start building connections."}
document.querySelectorAll(".login").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openAuth("login");nav.classList.remove("active")}));
document.querySelectorAll(".signup").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openAuth("signup");nav.classList.remove("active")}));
document.getElementById("toSignup").onclick=showSignup;
document.getElementById("toLogin").onclick=showLogin;
document.getElementById("close").onclick=()=>{overlay.classList.remove("active");document.body.style.overflow=""};
overlay.onclick=e=>{if(e.target===overlay)document.getElementById("close").click()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay.classList.contains("active"))document.getElementById("close").click()});
document.getElementById("menu").onclick=()=>nav.classList.toggle("active");
nav.querySelectorAll("a").forEach(a=>a.onclick=()=>nav.classList.remove("active"));
loginForm.onsubmit=e=>{e.preventDefault();alert("Login UI is ready. We will connect it to the backend later.");};
signupForm.onsubmit=e=>{e.preventDefault();alert("Signup UI is ready. We will connect it to the backend later.");};
