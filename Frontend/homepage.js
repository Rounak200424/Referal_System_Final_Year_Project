const {
  API_BASE_URL,
  getStoredUser,
  saveAuthSession,
  clearAuthSession,
  getCurrentUser,
  getApiError
} = window.ReferConnectAuth;

const overlay = document.getElementById("overlay");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");
const nav = document.getElementById("navlinks");
const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

function getRequestErrorMessage(error, fallbackMessage) {
  if (error instanceof TypeError) {
    return "Cannot connect to the authentication server. Make sure the backend is running at http://localhost:5000.";
  }

  return error.message || fallbackMessage;
}

function setMessage(element, message, isSuccess = false) {
  element.textContent = message;
  element.classList.toggle("success", isSuccess);
}

function setFormLoading(form, isLoading) {
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading
    ? "Please wait..."
    : form === loginForm ? "Login" : "Create Account";
}

function renderAuthState(user) {
  document.querySelectorAll(".login, .signup").forEach((element) => {
    element.classList.toggle("hidden", Boolean(user));
  });

  document.querySelectorAll("[data-user-menu]").forEach((menu) => {
    const toggle = menu.querySelector("[data-user-toggle]");
    menu.classList.toggle("hidden", !user);
    menu.classList.remove("open");
    toggle.textContent = user ? user.name : "";
    toggle.setAttribute("aria-expanded", "false");
  });
}

function openAuth(type) {
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  type === "signup" ? showSignup() : showLogin();
}

function showLogin() {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  title.textContent = "Welcome back";
  subtitle.textContent = "Login to continue to your account.";
  setMessage(signupMessage, "");
}

function showSignup() {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  title.textContent = "Create your account";
  subtitle.textContent = "Join ReferConnect and start building connections.";
  setMessage(loginMessage, "");
}

function closeAuth() {
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function closeUserMenus() {
  document.querySelectorAll("[data-user-menu].open").forEach((menu) => {
    menu.classList.remove("open");
    menu.querySelector("[data-user-toggle]").setAttribute("aria-expanded", "false");
  });
}

document.querySelectorAll(".login").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openAuth("login");
    nav.classList.remove("active");
  });
});

document.querySelectorAll(".signup").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openAuth("signup");
    nav.classList.remove("active");
  });
});

document.getElementById("toSignup").addEventListener("click", showSignup);
document.getElementById("toLogin").addEventListener("click", showLogin);
document.getElementById("close").addEventListener("click", closeAuth);
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeAuth();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && overlay.classList.contains("active")) closeAuth();
});
document.getElementById("menu").addEventListener("click", () => nav.classList.toggle("active"));
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => nav.classList.remove("active")));

document.querySelectorAll("[data-user-toggle]").forEach((toggle) => {
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = toggle.closest("[data-user-menu]");
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
});

document.querySelectorAll("[data-placeholder]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    alert("This feature will be available soon.");
    closeUserMenus();
  });
});

document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    clearAuthSession();
    renderAuthState(null);
    closeUserMenus();
  });
});

document.addEventListener("click", closeUserMenus);

document.getElementById("forgotPassword").addEventListener("click", (event) => {
  event.preventDefault();
  setMessage(loginMessage, "Password reset will be available soon.", true);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(loginMessage, "");
  setFormLoading(loginForm, true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value
      })
    });

    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to login. Please try again."));
    }

    const data = await response.json();
    saveAuthSession(data.token, data.user);
    renderAuthState(data.user);
    loginForm.reset();
    closeAuth();
  } catch (error) {
    setMessage(loginMessage, getRequestErrorMessage(error, "Unable to login. Please try again."));
  } finally {
    setFormLoading(loginForm, false);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(signupMessage, "");
  setFormLoading(signupForm, true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: signupForm.elements.name.value.trim(),
        email: signupForm.elements.email.value.trim(),
        password: signupForm.elements.password.value,
        professionalStatus: signupForm.elements.professionalStatus.value
      })
    });

    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to create your account. Please try again."));
    }

    const email = signupForm.elements.email.value.trim();
    signupForm.reset();
    showLogin();
    loginForm.elements.email.value = email;
    setMessage(loginMessage, "Account created successfully. Please login to continue.", true);
  } catch (error) {
    setMessage(signupMessage, getRequestErrorMessage(error, "Unable to create your account. Please try again."));
  } finally {
    setFormLoading(signupForm, false);
  }
});

renderAuthState(getStoredUser());

(async function validateStoredSession() {
  if (!getStoredUser()) return;

  try {
    renderAuthState(await getCurrentUser());
  } catch (error) {
    clearAuthSession();
    renderAuthState(null);
  }
})();

const authQuery = new URLSearchParams(window.location.search).get("auth");
if (authQuery === "login" || authQuery === "signup") {
  openAuth(authQuery);
  window.history.replaceState({}, document.title, window.location.pathname);
}
