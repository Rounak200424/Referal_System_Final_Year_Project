const {
  getStoredUser,
  clearAuthSession,
  getCurrentUser
} = window.ReferConnectAuth;

// ===============================
// FILTER ELEMENTS
// ===============================

const city = document.getElementById("city");
const profession = document.getElementById("profession");
const opportunity = document.getElementById("opportunity");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const selectedFilters = document.getElementById("selectedFilters");

function renderSelectedFilters() {
  selectedFilters.innerHTML = "";

  [
    { name: "City", element: city },
    { name: "Profession", element: profession },
    { name: "Opportunity", element: opportunity }
  ].forEach((filter) => {
    if (!filter.element.value) return;

    const chip = document.createElement("div");
    chip.className = "filter-chip";
    chip.innerHTML = `<span>${filter.element.value}</span><button type="button" aria-label="Remove ${filter.name}">×</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      filter.element.value = "";
      renderSelectedFilters();
    });
    selectedFilters.appendChild(chip);
  });
}

[city, profession, opportunity].forEach((element) => {
  element.addEventListener("change", renderSelectedFilters);
});

searchBtn.addEventListener("click", () => {
  renderSelectedFilters();
  const originalText = searchBtn.innerHTML;
  searchBtn.innerHTML = "✓ Filters Applied";
  setTimeout(() => {
    searchBtn.innerHTML = originalText;
  }, 1200);
});

clearBtn.addEventListener("click", () => {
  city.value = "";
  profession.value = "";
  opportunity.value = "";
  renderSelectedFilters();
});

// ===============================
// AUTHENTICATED NAVBAR
// ===============================

const menuBtn = document.getElementById("menuBtn");
const navlinks = document.getElementById("navlinks");

function renderAuthState(user) {
  document.querySelectorAll("#loginBtn, #signupBtn, #mobileLoginBtn, #mobileSignupBtn").forEach((element) => {
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

function closeUserMenus() {
  document.querySelectorAll("[data-user-menu].open").forEach((menu) => {
    menu.classList.remove("open");
    menu.querySelector("[data-user-toggle]").setAttribute("aria-expanded", "false");
  });
}

menuBtn.addEventListener("click", () => {
  navlinks.classList.toggle("active");
  menuBtn.textContent = navlinks.classList.contains("active") ? "×" : "☰";
});

navlinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => navlinks.classList.remove("active"));
});

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

function redirectToAuth(type) {
  window.location.href = `../homepage.html?auth=${type}`;
}

document.getElementById("loginBtn").addEventListener("click", () => redirectToAuth("login"));
document.getElementById("signupBtn").addEventListener("click", () => redirectToAuth("signup"));
document.getElementById("mobileLoginBtn").addEventListener("click", () => redirectToAuth("login"));
document.getElementById("mobileSignupBtn").addEventListener("click", () => redirectToAuth("signup"));

renderSelectedFilters();
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
