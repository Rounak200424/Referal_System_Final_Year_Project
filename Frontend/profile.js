(() => {
  const {
    getStoredUser,
    saveProfileState,
    getProfileState
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

  function getProfileKey(user) {
    return user && (user.id || user.email) ? `referconnect_profile_${user.id || user.email}` : null;
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

  function openProfileModal() {
    const user = getStoredUser();
    if (!user) {
      profileMessage.textContent = "Please login to view your profile.";
      return;
    }

    const savedProfile = getProfileState(user) || {};
    profileForm.reset();
    profileForm.elements.name.value = user.name || "";
    profileForm.elements.designation.value = savedProfile.designation || "";
    profileForm.elements.company.value = savedProfile.company || "";
    profileForm.elements.linkedIn.value = savedProfile.linkedIn || "";
    profileForm.elements.social.value = savedProfile.social || "";
    profileMessage.textContent = "";
    profileMessage.classList.remove("success");
    profileForm.querySelectorAll(".profile-field").forEach((field) => field.classList.remove("invalid"));
    profileForm.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
    selectedPicture = savedProfile.picture || null;
    renderPicture(selectedPicture, user);
    profileSubmit.textContent = savedProfile.exists ? "Update Profile" : "Create Profile";
    profileOverlay.classList.add("active");
    profileOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeUserMenus();
    profileForm.elements.designation.focus();
  }

  function closeProfileModal() {
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
      profileMessage.textContent = "";
    });
    reader.readAsDataURL(file);
  });

  removeProfilePictureButton.addEventListener("click", () => {
    selectedPicture = null;
    profilePictureInput.value = "";
    renderPicture(null, getStoredUser());
  });

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    profileMessage.textContent = "";
    profileMessage.classList.remove("success");
    if (!validateProfileForm()) {
      const firstInvalid = profileForm.querySelector("[aria-invalid='true']");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const user = getStoredUser();
    saveProfileState(user, {
      exists: true,
      designation: profileForm.elements.designation.value.trim(),
      company: profileForm.elements.company.value.trim(),
      linkedIn: profileForm.elements.linkedIn.value.trim(),
      social: profileForm.elements.social.value.trim(),
      picture: selectedPicture
    });
    profileMessage.textContent = "Profile saved successfully.";
    profileMessage.classList.add("success");
    profileSubmit.textContent = "Update Profile";
  });

  document.getElementById("closeProfile").addEventListener("click", closeProfileModal);
  document.getElementById("cancelProfile").addEventListener("click", closeProfileModal);
  profileOverlay.addEventListener("click", (event) => {
    if (event.target === profileOverlay) closeProfileModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && profileOverlay.classList.contains("active")) closeProfileModal();
  });
})();
