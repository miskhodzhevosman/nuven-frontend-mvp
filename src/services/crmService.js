const BASE_URL = "http://127.0.0.1:8000";

async function request(url, options = {}) {
  const res = await fetch(BASE_URL + url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const crmService = {
  getProjects() {
    return request("/api/crm/projects/");
  },

  getStatuses() {
    return request("/api/crm/project-statuses/");
  },
};