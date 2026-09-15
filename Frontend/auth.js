(() => {
const API_BASE_URL = "http://localhost:5000";
const AUTH_TOKEN_KEY = "referconnect_token";
const AUTH_USER_KEY = "referconnect_user";

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getStoredUser() {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function saveAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function getProfileState(user) {
  const userKey = user && (user.id || user.email);
  if (!userKey) return null;

  const storedProfile = localStorage.getItem(`referconnect_profile_${userKey}`);
  if (!storedProfile) return null;

  try {
    return JSON.parse(storedProfile);
  } catch (error) {
    localStorage.removeItem(`referconnect_profile_${userKey}`);
    return null;
  }
}

function saveProfileState(user, profile) {
  const userKey = user && (user.id || user.email);
  if (!userKey) return;
  localStorage.setItem(`referconnect_profile_${userKey}`, JSON.stringify(profile));
}

async function getCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (!response.ok) {
    clearAuthSession();
    return null;
  }

  const data = await response.json();
  const user = data.user;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return user;
}

async function getApiError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

window.ReferConnectAuth = {
  API_BASE_URL,
  getAuthToken,
  getStoredUser,
  saveAuthSession,
  clearAuthSession,
  getProfileState,
  saveProfileState,
  getCurrentUser,
  getApiError
};
})();
