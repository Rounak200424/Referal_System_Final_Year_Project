const {
  API_BASE_URL,
  getStoredUser,
  clearAuthSession,
  getCurrentUser
} = window.ReferConnectAuth;

const city = document.getElementById("city");
const profession = document.getElementById("profession");
const opportunity = document.getElementById("opportunity");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const selectedFilters = document.getElementById("selectedFilters");
const referralCards = document.getElementById("referralCards");
const emptyCard = document.getElementById("emptyCard");
const referralState = document.getElementById("referralState");
const referrerOverlay = document.getElementById("referrerOverlay");
const applyOverlay = document.getElementById("applyOverlay");

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
    const label = document.createElement("span");
    label.textContent = filter.element.value;
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove ${filter.name}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      filter.element.value = "";
      renderSelectedFilters();
      clearReferralResults();
    });
    chip.append(label, removeButton);
    selectedFilters.appendChild(chip);
  });
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return `Posted: ${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })}`;
}

function createAvatar(profilePictureUrl, name, small = false) {
  const avatar = document.createElement("span");
  avatar.className = small ? "referrer-avatar-small" : "referrer-avatar";
  if (profilePictureUrl) {
    const image = document.createElement("img");
    image.src = profilePictureUrl;
    image.alt = `${name || "Referrer"} profile`;
    image.addEventListener("error", () => {
      avatar.textContent = (name || "R").charAt(0).toUpperCase();
    });
    avatar.appendChild(image);
  } else {
    avatar.textContent = (name || "R").charAt(0).toUpperCase();
  }
  return avatar;
}

function createMeta(text) {
  const item = document.createElement("span");
  item.textContent = text;
  return item;
}

function openReferrerProfile(referrer) {
  const profile = referrer.profile;
  const avatar = document.getElementById("referrerAvatar");
  avatar.replaceChildren();
  if (profile && profile.profilePictureUrl) {
    const image = document.createElement("img");
    image.src = profile.profilePictureUrl;
    image.alt = `${referrer.name || "Referrer"} profile`;
    image.addEventListener("error", () => {
      avatar.textContent = (referrer.name || "R").charAt(0).toUpperCase();
    });
    avatar.appendChild(image);
  } else {
    avatar.textContent = (referrer.name || "R").charAt(0).toUpperCase();
  }
  document.getElementById("referrerTitle").textContent = referrer.name || "Referrer";
  document.getElementById("referrerDesignation").textContent = profile && profile.designation
    ? profile.designation
    : "Professional profile";
  document.getElementById("referrerCompany").textContent = profile && profile.company
    ? profile.company
    : "";

  const links = document.getElementById("referrerLinks");
  links.innerHTML = "";
  if (profile && profile.linkedinUrl) {
    const link = document.createElement("a");
    link.href = profile.linkedinUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "LinkedIn Profile";
    links.appendChild(link);
  }
  if (profile && profile.socialMediaUrl) {
    const link = document.createElement("a");
    link.href = profile.socialMediaUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Social Media Profile";
    links.appendChild(link);
  }
  referrerOverlay.classList.add("active");
  referrerOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeBrowseModal(modal) {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".browse-overlay.active")) document.body.style.overflow = "";
}

function renderReferrals(referrals) {
  referralCards.innerHTML = "";
  emptyCard.classList.toggle("hidden", referrals.length > 0);
  if (!referrals.length) return;

  referrals.forEach((referral) => {
    const creator = referral.createdBy || {};
    const profile = creator.profile;
    const card = document.createElement("article");
    card.className = "referral-card";
    const role = document.createElement("h3");
    role.textContent = referral.roleHiringFor || "Role unavailable";
    const company = document.createElement("p");
    company.className = "referral-company";
    company.textContent = referral.companyName || "Company unavailable";
    const descriptionLabel = document.createElement("strong");
    descriptionLabel.textContent = "Job Description";
    const description = document.createElement("p");
    description.className = "referral-description";
    description.textContent = referral.jobDescription || "No description provided.";
    const meta = document.createElement("div");
    meta.className = "referral-meta";
    meta.append(
      createMeta(`📍 ${referral.jobLocation || "Location unavailable"}`),
      createMeta(referral.professionalCategory || "Category unavailable"),
      createMeta(referral.opportunityCategory || "Opportunity unavailable")
    );
    const posted = document.createElement("p");
    posted.className = "referral-posted";
    posted.textContent = formatDate(referral.createdAt);

    const footer = document.createElement("div");
    footer.className = "referral-footer";
    const referrer = document.createElement("button");
    referrer.type = "button";
    referrer.className = "referrer-trigger";
    referrer.append(createAvatar(profile && profile.profilePictureUrl, creator.name, true));
    const referrerName = document.createElement("span");
    referrerName.textContent = creator.name || "Referrer unavailable";
    referrer.appendChild(referrerName);
    referrer.addEventListener("click", () => openReferrerProfile(creator));

    const actions = document.createElement("div");
    actions.className = "referral-actions";
    if (referral.importantLink) {
      const opportunityLink = document.createElement("a");
      opportunityLink.href = referral.importantLink;
      opportunityLink.target = "_blank";
      opportunityLink.rel = "noopener noreferrer";
      opportunityLink.textContent = "View Opportunity";
      actions.appendChild(opportunityLink);
    }
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.textContent = "Apply";
    applyButton.addEventListener("click", () => {
      applyOverlay.classList.add("active");
      applyOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    });
    actions.appendChild(applyButton);
    footer.append(referrer, actions);
    card.append(role, company, descriptionLabel, description, meta, posted, footer);
    referralCards.appendChild(card);
  });
}

function clearReferralResults() {
  referralCards.innerHTML = "";
  emptyCard.classList.add("hidden");
  referralState.className = "referral-state";
  referralState.textContent = "";
}

async function loadReferrals() {
  referralState.className = "referral-state";
  referralState.textContent = "Loading referrals...";
  searchBtn.disabled = true;
  const params = new URLSearchParams();
  if (city.value) params.set("jobLocation", city.value);
  if (profession.value) params.set("professionalCategory", profession.value);
  if (opportunity.value) params.set("opportunityCategory", opportunity.value);
  try {
    const query = params.toString();
    const response = await fetch(`${API_BASE_URL}/api/referrals${query ? `?${query}` : ""}`);
    if (!response.ok) throw new Error("Unable to load referrals.");
    const data = await response.json();
    renderReferrals(Array.isArray(data.referrals) ? data.referrals : []);
    referralState.textContent = "";
  } catch (error) {
    referralCards.innerHTML = "";
    emptyCard.classList.add("hidden");
    referralState.className = "referral-state error";
    referralState.textContent = error instanceof TypeError
      ? "Cannot connect to the referral service. Please make sure the backend is running."
      : error.message;
  } finally {
    searchBtn.disabled = false;
  }
}

[city, profession, opportunity].forEach((element) => {
  element.addEventListener("change", renderSelectedFilters);
});
searchBtn.addEventListener("click", () => {
  renderSelectedFilters();
  loadReferrals();
});
clearBtn.addEventListener("click", () => {
  city.value = "";
  profession.value = "";
  opportunity.value = "";
  renderSelectedFilters();
  clearReferralResults();
});

document.getElementById("closeReferrer").addEventListener("click", () => closeBrowseModal(referrerOverlay));
document.getElementById("closeApply").addEventListener("click", () => closeBrowseModal(applyOverlay));
document.getElementById("dismissApply").addEventListener("click", () => closeBrowseModal(applyOverlay));
[referrerOverlay, applyOverlay].forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeBrowseModal(overlay);
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  [referrerOverlay, applyOverlay].forEach((overlay) => {
    if (overlay.classList.contains("active")) closeBrowseModal(overlay);
  });
});

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
navlinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => navlinks.classList.remove("active")));
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
["loginBtn", "signupBtn", "mobileLoginBtn", "mobileSignupBtn"].forEach((id) => {
  document.getElementById(id).addEventListener("click", () => redirectToAuth(id.includes("signup") ? "signup" : "login"));
});

renderSelectedFilters();
renderAuthState(getStoredUser());
clearReferralResults();
(async function validateStoredSession() {
  if (!getStoredUser()) return;
  try {
    renderAuthState(await getCurrentUser());
  } catch (error) {
    clearAuthSession();
    renderAuthState(null);
  }
})();
