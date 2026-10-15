const {
  API_BASE_URL,
  getAuthToken,
  clearAuthSession,
  getApiError
} = window.ReferConnectAuth;
const dashboard = window.ReferConnectDashboard;
const dashboardState = document.getElementById("dashboardState");
const referralList = document.getElementById("referralList");
const emptyState = document.getElementById("emptyState");
const authRequired = document.getElementById("authRequired");
const decisionOverlay = document.getElementById("decisionOverlay");
const decisionTitle = document.getElementById("decisionTitle");
const decisionContext = document.getElementById("decisionContext");
const decisionMessage = document.getElementById("decisionMessage");
const decisionError = document.getElementById("decisionError");
const confirmDecision = document.getElementById("confirmDecision");
const cancelDecision = document.getElementById("cancelDecision");
const closeDecision = document.getElementById("closeDecision");
let pendingDecision = null;
let decisionSubmitting = false;

const STATUS_ORDER = { APPROVED: 0, PENDING: 1, REJECTED: 2 };

function setState(message, type = "") {
  dashboardState.textContent = message;
  dashboardState.className = `dashboard-state${type ? ` ${type}` : ""}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text || "";
  return element;
}

function statusBadge(status) {
  const badge = createTextElement("span", `status-badge ${String(status).toLowerCase()}`, status);
  return badge;
}

function sortApplications(applications) {
  return applications.sort((left, right) => {
    const statusDifference =
      (STATUS_ORDER[left.status] ?? Number.MAX_SAFE_INTEGER) -
      (STATUS_ORDER[right.status] ?? Number.MAX_SAFE_INTEGER);
    if (statusDifference) return statusDifference;
    return new Date(right.applicationDate).getTime() -
      new Date(left.applicationDate).getTime();
  });
}

function closeDecisionModal() {
  if (decisionSubmitting) return;
  decisionOverlay.classList.remove("active");
  decisionOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  pendingDecision = null;
  decisionMessage.value = "";
  decisionError.textContent = "";
}

function openDecisionModal(application, referral, status, details) {
  pendingDecision = {
    applicationId: application.applicationId,
    referralId: referral._id,
    status,
    role: referral.roleHiringFor,
    company: referral.companyName,
    details
  };
  decisionTitle.textContent = status === "APPROVED"
    ? "Accept Applicant"
    : "Reject Applicant";
  decisionContext.textContent =
    `${application.applicant.fullName} — ${referral.roleHiringFor} at ${referral.companyName}`;
  decisionMessage.value = "";
  decisionError.textContent = "";
  decisionOverlay.classList.add("active");
  decisionOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

async function requestResume(applicationId, download, button) {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "./homepage.html?auth=login";
    return;
  }

  const resumeWindow = window.open("about:blank", "_blank");
  if (!resumeWindow) {
    setState("Allow pop-ups to open or download applicant resumes.", "error");
    return;
  }
  resumeWindow.opener = null;
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = download ? "Preparing..." : "Opening...";

  try {
    const query = download ? "?download=true" : "";
    const response = await fetch(
      `${API_BASE_URL}/api/applications/${encodeURIComponent(applicationId)}/resume${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to access this resume."));
    }
    const data = await response.json();
    if (!data.signedUrl) throw new Error("Resume access link was not returned.");
    resumeWindow.location.replace(data.signedUrl);
  } catch (error) {
    resumeWindow.close();
    setState(
      error instanceof TypeError
        ? "Cannot connect to the resume service. Please try again."
        : error.message,
      "error"
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function renderApplicants(applications, referral, details) {
  const list = details.querySelector(".applicant-list");
  list.replaceChildren();
  const orderedApplications = sortApplications(applications);
  if (!orderedApplications.length) {
    list.appendChild(createTextElement("p", "applicant-email", "No applicants yet."));
    return;
  }

  orderedApplications.forEach((application) => {
    const row = document.createElement("article");
    row.className = "applicant-row";
    const info = document.createElement("div");
    info.className = "applicant-info";
    const applicant = application.applicant;
    info.append(
      createTextElement("p", "applicant-name", applicant ? applicant.fullName : "Account unavailable"),
      createTextElement("p", "applicant-email", applicant ? applicant.email : "")
    );
    const dateAndStatus = document.createElement("div");
    dateAndStatus.append(
      statusBadge(application.status),
      createTextElement("p", "applicant-date", `Applied ${formatDate(application.applicationDate)}`)
    );
    const actions = document.createElement("div");
    actions.className = "applicant-actions";

    const viewButton = createTextElement("button", "small-button", "View Resume");
    viewButton.type = "button";
    viewButton.addEventListener("click", () =>
      requestResume(application.applicationId, false, viewButton)
    );
    const downloadButton = createTextElement("button", "small-button", "Download Resume");
    downloadButton.type = "button";
    downloadButton.addEventListener("click", () =>
      requestResume(application.applicationId, true, downloadButton)
    );
    actions.append(viewButton, downloadButton);

    if (application.status === "PENDING") {
      const decisionActions = document.createElement("div");
      decisionActions.className = "decision-actions";
      const acceptButton = createTextElement("button", "small-button accept", "Accept");
      acceptButton.type = "button";
      acceptButton.addEventListener("click", () =>
        openDecisionModal(application, referral, "APPROVED", details)
      );
      const rejectButton = createTextElement("button", "small-button reject", "Reject");
      rejectButton.type = "button";
      rejectButton.addEventListener("click", () =>
        openDecisionModal(application, referral, "REJECTED", details)
      );
      decisionActions.append(acceptButton, rejectButton);
      actions.appendChild(decisionActions);
    }
    row.append(info, dateAndStatus, actions);
    if (application.decisionMessage) {
      const message = createTextElement(
        "p",
        "applicant-message",
        `Message: ${application.decisionMessage}`
      );
      row.appendChild(message);
    }
    list.appendChild(row);
  });
}

async function loadApplicants(referral, details) {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "./homepage.html?auth=login";
    return;
  }

  const list = details.querySelector(".applicant-list");
  list.replaceChildren(createTextElement("p", "applicant-email", "Loading applicants..."));
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/referral/${encodeURIComponent(referral._id)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to load applicants."));
    }
    const data = await response.json();
    renderApplicants(
      Array.isArray(data.applications) ? data.applications : [],
      referral,
      details
    );
  } catch (error) {
    list.replaceChildren(
      createTextElement(
        "p",
        "inline-error",
        error instanceof TypeError
          ? "Cannot connect to the application service."
          : error.message
      )
    );
  }
}

function renderReferrals(referrals) {
  referralList.replaceChildren();
  emptyState.classList.toggle("hidden", referrals.length > 0);
  referrals.forEach((referral) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";
    const cardHeader = document.createElement("div");
    cardHeader.className = "dashboard-card-header";
    const titleGroup = document.createElement("div");
    titleGroup.append(
      createTextElement("h2", "", referral.roleHiringFor || "Role"),
      createTextElement("p", "card-company", referral.companyName || "Company")
    );
    const isClosed = referral.applicationsClosed ||
      Number(referral.applicantCount) >= Number(referral.applicantLimit);
    const status = createTextElement(
      "span",
      `status-badge ${isClosed ? "closed" : "active"}`,
      isClosed ? "Applications Closed" : "Active"
    );
    cardHeader.append(titleGroup, status);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    [
      referral.jobLocation,
      referral.professionalCategory,
      referral.opportunityCategory,
      `Posted ${formatDate(referral.createdAt)}`
    ].filter(Boolean).forEach((text) => meta.appendChild(createTextElement("span", "", text)));

    const stats = document.createElement("div");
    stats.className = "card-stats";
    stats.append(
      createTextElement("span", "", `Applicants: ${referral.applicantCount || 0}`),
      createTextElement("span", "", `Applicant limit: ${referral.applicantLimit}`),
      createTextElement("span", "", `Remaining slots: ${referral.remainingSlots ?? Math.max(0, referral.applicantLimit - (referral.applicantCount || 0))}`)
    );
    card.append(
      cardHeader,
      createTextElement("p", "card-description", referral.jobDescription),
      meta,
      stats
    );

    const details = document.createElement("details");
    details.className = "applicant-details";
    const summary = createTextElement(
      "summary",
      "",
      `Applicants (${referral.applicantCount || 0})`
    );
    const applicantList = document.createElement("div");
    applicantList.className = "applicant-list";
    details.append(summary, applicantList);
    details.addEventListener("toggle", () => {
      if (details.open) loadApplicants(referral, details);
    });
    card.appendChild(details);
    referralList.appendChild(card);
  });
}

async function loadReferrals() {
  const token = getAuthToken();
  if (!token) {
    referralList.replaceChildren();
    authRequired.classList.remove("hidden");
    emptyState.classList.add("hidden");
    setState("");
    return;
  }

  setState("Loading your referrals...");
  authRequired.classList.add("hidden");
  try {
    const response = await fetch(`${API_BASE_URL}/api/referrals/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      clearAuthSession();
      dashboard.renderAuthState(null);
      authRequired.classList.remove("hidden");
      setState("Your session has expired. Please log in again.", "error");
      return;
    }
    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to load your referrals."));
    }
    const data = await response.json();
    const referrals = Array.isArray(data.referrals) ? data.referrals : [];
    renderReferrals(referrals);
    setState("");
  } catch (error) {
    setState(
      error instanceof TypeError
        ? "Cannot connect to the referral service. Please make sure the backend is running."
        : error.message,
      "error"
    );
  }
}

async function submitDecision() {
  if (!pendingDecision || decisionSubmitting) return;
  const token = getAuthToken();
  if (!token) {
    setState("Your session has expired. Please log in again.", "error");
    return;
  }

  const message = decisionMessage.value.trim();
  if (message.length > 1000) {
    decisionError.textContent = "Message must be 1000 characters or fewer.";
    return;
  }

  decisionSubmitting = true;
  confirmDecision.disabled = true;
  cancelDecision.disabled = true;
  closeDecision.disabled = true;
  confirmDecision.textContent = "Saving...";
  decisionError.textContent = "";
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/${encodeURIComponent(pendingDecision.applicationId)}/decision`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: pendingDecision.status,
          message
        })
      }
    );
    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to save the decision."));
    }
    const result = await response.json();
    const details = pendingDecision.details;
    const referralId = pendingDecision.referralId;
    decisionSubmitting = false;
    closeDecisionModal();
    setState(result.message || "Application decision saved.", "success");
    const referral = { _id: referralId };
    const card = details.closest(".dashboard-card");
    referral.roleHiringFor = card.querySelector("h2").textContent;
    referral.companyName = card.querySelector(".card-company").textContent;
    await loadApplicants(referral, details);
  } catch (error) {
    decisionError.textContent =
      error instanceof TypeError
        ? "Cannot connect to the application service. Please try again."
        : error.message;
  } finally {
    decisionSubmitting = false;
    confirmDecision.disabled = false;
    cancelDecision.disabled = false;
    closeDecision.disabled = false;
    confirmDecision.textContent = "Confirm";
  }
}

confirmDecision.addEventListener("click", submitDecision);
cancelDecision.addEventListener("click", closeDecisionModal);
closeDecision.addEventListener("click", closeDecisionModal);
decisionOverlay.addEventListener("click", (event) => {
  if (event.target === decisionOverlay) closeDecisionModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && decisionOverlay.classList.contains("active")) {
    closeDecisionModal();
  }
});

(async function initialize() {
  try {
    const user = await dashboard.getAuthenticatedUser();
    if (!user) {
      authRequired.classList.remove("hidden");
      setState("");
      return;
    }
    await loadReferrals();
  } catch (error) {
    setState(
      error instanceof TypeError
        ? "Cannot connect to the authentication service."
        : "Unable to verify your session.",
      "error"
    );
  }
})();
