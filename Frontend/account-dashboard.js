(() => {
  const auth = window.ReferConnectAuth;

  function renderAuthState(user) {
    document.querySelectorAll(".auth-login, .auth-signup").forEach((button) => {
      button.classList.toggle("hidden", Boolean(user));
    });
    document.querySelectorAll("[data-user-menu]").forEach((menu) => {
      const toggle = menu.querySelector("[data-user-toggle]");
      menu.classList.toggle("hidden", !user);
      menu.classList.remove("open");
      toggle.textContent = user ? user.name : "";
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll(".auth-login").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = "./homepage.html?auth=login";
    });
  });
  document.querySelectorAll(".auth-signup").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = "./homepage.html?auth=signup";
    });
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
      window.alert("This feature will be available soon.");
    });
  });
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      auth.clearAuthSession();
      renderAuthState(null);
      window.location.href = "./homepage.html";
    });
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-user-menu]")) return;
    document.querySelectorAll("[data-user-menu].open").forEach((menu) => {
      menu.classList.remove("open");
      menu.querySelector("[data-user-toggle]").setAttribute("aria-expanded", "false");
    });
  });

  const menuButton = document.getElementById("menuBtn");
  const navlinks = document.getElementById("navlinks");
  menuButton.addEventListener("click", () => {
    navlinks.classList.toggle("active");
    menuButton.textContent = navlinks.classList.contains("active") ? "×" : "☰";
  });

  renderAuthState(auth.getStoredUser());

  window.ReferConnectDashboard = {
    renderAuthState,
    async getAuthenticatedUser() {
      if (!auth.getAuthToken()) {
        renderAuthState(null);
        return null;
      }
      const user = await auth.getCurrentUser();
      renderAuthState(user);
      return user;
    },
  };
})();
