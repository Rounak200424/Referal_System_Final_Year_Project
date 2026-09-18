(() => {
  const {
    API_BASE_URL,
    getAuthToken,
    getStoredUser,
    clearAuthSession,
    getApiError
  } = window.ReferConnectAuth;

  const profileOverlay = document.getElementById("profileOverlay");
  const profileForm = document.getElementById("profileForm");
  const profileMessage = document.getElementById("profileMessage");
  const profilePictureInput = document.getElementById("profilePictureInput");
  const profilePicturePreview = document.getElementById("profilePicturePreview");
  const profilePictureButton = document.getElementById("profilePictureButton");
  const removeProfilePictureButton = document.getElementById("removeProfilePicture");
  const profileSubmit = document.getElementById("profileSubmit");
  let selectedPicture = null;
  let profileExists = false;
  let profileSubmitting = false;

  function setProfileFieldError(field, message) {
    const wrapper = field.closest(".profile-field");
    const error = wrapper.querySelector(".field-error");
    wrapper.classList.toggle("invalid", Boolean(message));
    error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function validateProfileForm() {
    const designation = profileForm.elements.designation;
    const company = profileForm.elements.company;
    const linkedIn = profileForm.elements.linkedIn;
    const social = profileForm.elements.social;
    const errors = {};

    [designation, company, linkedIn, social].forEach((field) => setProfileFieldError(field, ""));
    if (!designation.value.trim()) errors.designation = "Current designation is required.";
    if (!company.value.trim()) errors.company = "Current company is required.";

    [linkedIn, social].forEach((field) => {
      if (!field.value.trim()) return;

      try {
        const url = new URL(field.value.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          errors[field.name] = "Enter a valid URL starting with http:// or https://.";
        }
      } catch (error) {
        errors[field.name] = "Enter a valid URL.";
      }
    });

    Object.entries(errors).forEach(([name, message]) => {
      setProfileFieldError(profileForm.elements[name], message);
    });
    return Object.keys(errors).length === 0;
  }

  function renderPicture(picture, user) {
    profilePicturePreview.innerHTML = "";

    if (picture) {
      const image = document.createElement("img");
      image.src = picture;
      image.alt = "Profile preview";
      profilePicturePreview.appendChild(image);
      profilePictureButton.textContent = "Change Picture";
      removeProfilePictureButton.classList.remove("hidden");
      return;
    }

    profilePicturePreview.textContent = (user.name || "R").charAt(0).toUpperCase();
    profilePictureButton.textContent = "Add Picture";
    removeProfilePictureButton.classList.add("hidden");
  }

  function resetProfileFields() {
    profileForm.reset();
    profileForm.querySelectorAll(".profile-field").forEach((field) => field.classList.remove("invalid"));
    profileForm.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
  }

  function handleExpiredSession() {
    clearAuthSession();
    profileOverlay.classList.remove("active");
    profileOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    window.dispatchEvent(new CustomEvent("referconnect:logout"));
  }

  async function loadProfile() {
    const token = getAuthToken();

    if (!token) {
      profileMessage.textContent = "Please login to view your profile.";
      return null;
    }

    profileMessage.textContent = "Loading profile...";
    profileMessage.classList.remove("success");

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      if (response.status === 401) {
        handleExpiredSession();
        return null;
      }

      if (response.status === 404) {
        profileExists = false;
        profileMessage.textContent = "";
        return null;
      }

      if (!response.ok) {
        throw new Error(await getApiError(response, "Unable to load your profile."));
      }

      const data = await response.json();
      profileExists = true;
      profileMessage.textContent = "";
      return data.profile;
    } catch (error) {
      profileMessage.textContent = error instanceof TypeError
        ? "Cannot connect to the profile service. Please make sure the backend is running."
        : error.message || "Unable to load your profile.";
      return null;
    }
  }

  async function openProfileModal() {
    const user = getStoredUser();
    if (!user) {
      profileMessage.textContent = "Please login to view your profile.";
      return;
    }

    resetProfileFields();
    profileForm.elements.name.value = user.name || "";
    selectedPicture = null;
    renderPicture(null, user);
    profileExists = false;
    profileSubmit.textContent = "Create Profile";
    profileOverlay.classList.add("active");
    profileOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeUserMenus();
    profileForm.elements.designation.focus();

    const profile = await loadProfile();
    if (!profile || !profileOverlay.classList.contains("active")) return;

    profileForm.elements.name.value = profile.name || user.name || "";
    profileForm.elements.designation.value = profile.designation || "";
    profileForm.elements.company.value = profile.company || "";
    profileForm.elements.linkedIn.value = profile.linkedinUrl || "";
    profileForm.elements.social.value = profile.socialMediaUrl || "";
    profileSubmit.textContent = "Update Profile";
  }

  function closeProfileModal() {
    if (profileSubmitting) return;
    profileOverlay.classList.remove("active");
    profileOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function closeUserMenus() {
    document.querySelectorAll("[data-user-menu].open").forEach((menu) => {
      menu.classList.remove("open");
      menu.querySelector("[data-user-toggle]").setAttribute("aria-expanded", "false");
    });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    if (profileSubmitting || !validateProfileForm()) {
      if (!profileSubmitting) {
        const firstInvalid = profileForm.querySelector("[aria-invalid='true']");
        if (firstInvalid) firstInvalid.focus();
      }
      return;
    }

    const token = getAuthToken();
    if (!token) {
      handleExpiredSession();
      return;
    }

    profileSubmitting = true;
    profileSubmit.disabled = true;
    profileSubmit.textContent = profileExists ? "Updating..." : "Creating...";
    profileMessage.textContent = "";

    const payload = {
      designation: profileForm.elements.designation.value.trim(),
      company: profileForm.elements.company.value.trim(),
      linkedinUrl: profileForm.elements.linkedIn.value.trim(),
      socialMediaUrl: profileForm.elements.social.value.trim()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: profileExists ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        handleExpiredSession();
        return;
      }

      if (!response.ok) {
        throw new Error(await getApiError(response, "Unable to save your profile."));
      }

      const data = await response.json();
      profileExists = true;
      profileSubmit.textContent = "Update Profile";
      profileMessage.textContent = data.message || "Profile saved successfully.";
      profileMessage.classList.add("success");
    } catch (error) {
      profileMessage.textContent = error instanceof TypeError
        ? "Cannot connect to the profile service. Please make sure the backend is running."
        : error.message || "Unable to save your profile.";
      profileMessage.classList.remove("success");
    } finally {
      profileSubmitting = false;
      profileSubmit.disabled = false;
      if (profileOverlay.classList.contains("active")) {
        profileSubmit.textContent = profileExists ? "Update Profile" : "Create Profile";
      }
    }
  }

  document.querySelectorAll("[data-view-profile]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openProfileModal();
    });
  });

  profilePictureButton.addEventListener("click", () => profilePictureInput.click());
  profilePictureInput.addEventListener("change", () => {
    const file = profilePictureInput.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      profileMessage.textContent = "Please select a JPG, JPEG or PNG image.";
      profilePictureInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      selectedPicture = reader.result;
      renderPicture(selectedPicture, getStoredUser());
      profileMessage.textContent = "Picture preview updated. Picture storage will be available soon.";
    });
    reader.readAsDataURL(file);
  });

  removeProfilePictureButton.addEventListener("click", () => {
    selectedPicture = null;
    profilePictureInput.value = "";
    renderPicture(null, getStoredUser());
  });

  profileForm.addEventListener("submit", handleProfileSubmit);
  document.getElementById("closeProfile").addEventListener("click", closeProfileModal);
  document.getElementById("cancelProfile").addEventListener("click", closeProfileModal);
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) closeProfileModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && profileOverlay.classList.contains("active")) closeProfileModal();
  });
})();
