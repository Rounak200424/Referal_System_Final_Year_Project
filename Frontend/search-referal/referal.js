const {
  API_BASE_URL,
  getAuthToken,
  getStoredUser,
  clearAuthSession,
  getCurrentUser,
  getApiError
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
const applicationForm = document.getElementById("applicationForm");
const applicationFullName = document.getElementById("applicationFullName");
const applicationEmail = document.getElementById("applicationEmail");
const applicationResume = document.getElementById("applicationResume");
const applicationMessage = document.getElementById("applicationMessage");
const submitApplicationButton = document.getElementById("submitApplication");
const dismissApplicationButton = document.getElementById("dismissApply");
const closeApplicationButton = document.getElementById("closeApply");
const appliedReferralIds = new Set();
let selectedReferralId = "";
let selectedResumeFile = null;
let uploadedResumePath = "";
let isSubmittingApplication = false;
let applicationUserAuthenticated = false;

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
    const applicantLimit = Number(referral.applicantLimit);
    const applicationsCount = Number(referral.applicationsCount ?? 0);
    if (Number.isFinite(applicantLimit) && Number.isFinite(applicationsCount)) {
      const slots = createMeta(
        `${Math.max(0, applicantLimit - applicationsCount)} slots left`
      );
      slots.classList.add("referral-slots");
      meta.appendChild(slots);
    }
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
    const alreadyApplied = appliedReferralIds.has(String(referral._id));
    applyButton.textContent = alreadyApplied ? "Applied" : "Apply";
    applyButton.disabled = alreadyApplied;
    applyButton.addEventListener("click", () => {
      handleApply(referral);
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

async function loadReferrals(successMessage = "") {
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
    referralState.className = successMessage
      ? "referral-state success"
      : "referral-state";
    referralState.textContent = successMessage;
  } catch (error) {
    referralCards.innerHTML = "";
    emptyCard.classList.add("hidden");
    referralState.className = "referral-state error";
    const loadError = error instanceof TypeError
      ? "Cannot connect to the referral service. Please make sure the backend is running."
      : error.message;
    referralState.textContent = successMessage
      ? `Application submitted successfully. ${loadError} The referral list could not be refreshed.`
      : loadError;
  } finally {
    searchBtn.disabled = false;
  }
}

function setApplicationMessage(message, isSuccess = false) {
  applicationMessage.textContent = message;
  applicationMessage.classList.toggle("success", isSuccess);
}

function resetApplicationForm() {
  applicationForm.reset();
  applicationFullName.value = "";
  applicationEmail.value = "";
  applicationMessage.textContent = "";
  applicationMessage.classList.remove("success");
  selectedReferralId = "";
  selectedResumeFile = null;
  uploadedResumePath = "";
  applicationUserAuthenticated = false;
  submitApplicationButton.disabled = false;
  submitApplicationButton.textContent = "Submit Application";
  applicationResume.disabled = false;
  dismissApplicationButton.disabled = false;
  closeApplicationButton.disabled = false;
  isSubmittingApplication = false;
}

function closeApplicationModal() {
  if (isSubmittingApplication) return;
  closeBrowseModal(applyOverlay);
  resetApplicationForm();
}

async function handleApply(referral) {
  if (!getAuthToken()) {
    redirectToAuth("login");
    return;
  }

  selectedReferralId = String(referral._id || "");
  if (!selectedReferralId) {
    referralState.className = "referral-state error";
    referralState.textContent = "This referral cannot be applied to right now.";
    return;
  }

  resetApplicationForm();
  selectedReferralId = String(referral._id);
  applicationFullName.value = "Loading account...";
  applicationEmail.value = "Loading account...";
  submitApplicationButton.disabled = true;
  applyOverlay.classList.add("active");
  applyOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  try {
    const user = await getCurrentUser();
    if (!user) {
      closeApplicationModal();
      redirectToAuth("login");
      return;
    }

    applicationFullName.value = user.name || "";
    applicationEmail.value = user.email || "";
    if (user.name && user.email) {
      applicationUserAuthenticated = true;
      submitApplicationButton.disabled = false;
    } else {
      setApplicationMessage("Your account details could not be loaded. Please try again.");
    }
  } catch (error) {
    applicationFullName.value = "";
    applicationEmail.value = "";
    setApplicationMessage(
      "Unable to load your account details. Please check your connection and try again."
    );
  }
}

applicationResume.addEventListener("change", () => {
  selectedResumeFile = null;
  uploadedResumePath = "";
  setApplicationMessage("");

  const file = applicationResume.files[0];
  if (!file) return;

  const hasPdfExtension = /\.pdf$/i.test(file.name);
  const hasPdfMimeType = file.type.toLowerCase() === "application/pdf";
  if (!hasPdfExtension || !hasPdfMimeType) {
    applicationResume.value = "";
    setApplicationMessage("Please select a PDF resume.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    applicationResume.value = "";
    setApplicationMessage("Resume file must be 5 MB or smaller.");
    return;
  }

  selectedResumeFile = file;
});

async function getRequestError(response, fallback) {
  const message = await getApiError(response, fallback);
  if (response.status !== 409) return message;
  if (/already applied|duplicate/i.test(message)) {
    return "You have already applied for this referral.";
  }
  if (/limit|reached|closed/i.test(message)) {
    return "Applications are closed for this referral.";
  }
  return message;
}

applicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSubmittingApplication) return;

  const token = getAuthToken();
  if (!token) {
    redirectToAuth("login");
    return;
  }

  if (!selectedReferralId) {
    setApplicationMessage("Select a referral before submitting.");
    return;
  }

  if (!applicationUserAuthenticated) {
    setApplicationMessage("Please log in again before submitting your application.");
    return;
  }

  if (!applicationFullName.value || !applicationEmail.value) {
    setApplicationMessage("Your account details are incomplete. Please try again.");
    return;
  }

  if (!uploadedResumePath && !selectedResumeFile) {
    setApplicationMessage("Please select a PDF resume.");
    return;
  }

  isSubmittingApplication = true;
  submitApplicationButton.disabled = true;
  submitApplicationButton.textContent = "Submitting...";
  applicationResume.disabled = true;
  dismissApplicationButton.disabled = true;
  closeApplicationButton.disabled = true;
  setApplicationMessage("Submitting your application...");

  try {
    if (!uploadedResumePath) {
      const formData = new FormData();
      formData.append("resume", selectedResumeFile);
      const uploadResponse = await fetch(`${API_BASE_URL}/api/resumes/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const error = new Error(
          await getRequestError(uploadResponse, "Unable to upload your resume.")
        );
        error.status = uploadResponse.status;
        throw error;
      }

      const uploadData = await uploadResponse.json();
      if (!uploadData.resumePath) {
        throw new Error("The resume service did not return a storage path.");
      }
      uploadedResumePath = uploadData.resumePath;
    }

    const applicationResponse = await fetch(`${API_BASE_URL}/api/applications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        referralId: selectedReferralId,
        resumePath: uploadedResumePath
      })
    });

    if (!applicationResponse.ok) {
      const error = new Error(
        await getRequestError(
          applicationResponse,
          "Unable to submit your application."
        )
      );
      error.status = applicationResponse.status;
      throw error;
    }

    await applicationResponse.json();
    const submittedReferralId = selectedReferralId;
    appliedReferralIds.add(submittedReferralId);
    isSubmittingApplication = false;
    closeBrowseModal(applyOverlay);
    resetApplicationForm();
    await loadReferrals("Application submitted successfully.");
  } catch (error) {
    if (error.status === 401) {
      clearAuthSession();
      renderAuthState(null);
      applicationUserAuthenticated = false;
      setApplicationMessage("Your session has expired. Please log in again.");
    } else {
      setApplicationMessage(
        error instanceof TypeError
          ? "Cannot connect to the application service. Please try again."
          : error.message
      );
    }
  } finally {
    if (applyOverlay.classList.contains("active")) {
      isSubmittingApplication = false;
      submitApplicationButton.disabled = false;
      submitApplicationButton.textContent = "Submit Application";
      applicationResume.disabled = false;
      dismissApplicationButton.disabled = false;
      closeApplicationButton.disabled = false;
    }
  }
});

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
dismissApplicationButton.addEventListener("click", closeApplicationModal);
closeApplicationButton.addEventListener("click", closeApplicationModal);
[referrerOverlay].forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeBrowseModal(overlay);
  });
});
applyOverlay.addEventListener("click", (event) => {
  if (event.target === applyOverlay) closeApplicationModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (referrerOverlay.classList.contains("active")) closeBrowseModal(referrerOverlay);
  if (applyOverlay.classList.contains("active")) closeApplicationModal();
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
