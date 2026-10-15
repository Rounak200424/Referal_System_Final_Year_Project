const {
  API_BASE_URL,
  getAuthToken,
  clearAuthSession,
  getApiError
} = window.ReferConnectAuth;
const dashboard = window.ReferConnectDashboard;
const dashboardState = document.getElementById("dashboardState");
const applicationList = document.getElementById("applicationList");
const emptyState = document.getElementById("emptyState");
const authRequired = document.getElementById("authRequired");

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text || "";
  return element;
}

function renderApplications(applications) {
  applicationList.replaceChildren();
  emptyState.classList.toggle("hidden", applications.length > 0);
  applications.forEach((application) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";
    const referral = application.referral;
    card.appendChild(
      createElement(
        "h2",
        "",
        referral
          ? `${referral.roleHiringFor} at ${referral.companyName}`
          : "Referral is no longer available"
      )
    );
    card.appendChild(
      createElement(
        "p",
        "card-company",
        `Applied ${formatDate(application.applicationDate)}`
      )
    );
    const status = String(application.status || "PENDING").toLowerCase();
    card.appendChild(
      createElement("span", `status-badge ${status}`, application.status || "PENDING")
    );

    if (referral) {
      const meta = document.createElement("div");
      meta.className = "card-meta";
      [
        referral.jobLocation,
        referral.professionalCategory,
        referral.opportunityCategory,
        `Posted ${formatDate(referral.createdAt)}`
      ].filter(Boolean).forEach((value) => meta.appendChild(createElement("span", "", value)));
      card.appendChild(meta);
    }

    if (application.decisionMessage) {
      card.appendChild(
        createElement("p", "applicant-message", `Message from the referrer: ${application.decisionMessage}`)
      );
    }
    applicationList.appendChild(card);
  });
}

async function loadApplications() {
  const token = getAuthToken();
  if (!token) {
    authRequired.classList.remove("hidden");
    dashboardState.textContent = "";
    return;
  }

  authRequired.classList.add("hidden");
  dashboardState.className = "dashboard-state";
  dashboardState.textContent = "Loading your applications...";
  try {
    const response = await fetch(`${API_BASE_URL}/api/applications/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      clearAuthSession();
      dashboard.renderAuthState(null);
      authRequired.classList.remove("hidden");
      dashboardState.textContent = "Your session has expired. Please log in again.";
      dashboardState.classList.add("error");
      return;
    }
    if (!response.ok) {
      throw new Error(await getApiError(response, "Unable to load your applications."));
    }
    const data = await response.json();
    const applications = Array.isArray(data.applications) ? data.applications : [];
    renderApplications(applications);
    dashboardState.textContent = "";
  } catch (error) {
    dashboardState.className = "dashboard-state error";
    dashboardState.textContent =
      error instanceof TypeError
        ? "Cannot connect to the application service. Please make sure the backend is running."
        : error.message;
  }
}

(async function initialize() {
  try {
    const user = await dashboard.getAuthenticatedUser();
    if (!user) {
      authRequired.classList.remove("hidden");
      dashboardState.textContent = "";
      return;
    }
    await loadApplications();
  } catch (error) {
    dashboardState.className = "dashboard-state error";
    dashboardState.textContent = "Unable to verify your session.";
  }
})();
