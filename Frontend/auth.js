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
  getCurrentUser,
  getApiError
};
})();
