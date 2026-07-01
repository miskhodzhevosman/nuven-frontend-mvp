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
    if (res.status === 204) return null;
    throw new Error(`API error: ${res.status}`);
  }

  if (res.status === 204) return null;

  return res.json();
}

/* ================= CRM ================= */

export const projectApi = {
  list() {
    return request("/api/crm/projects/");
  },

  get(id) {
    return request(`/api/crm/projects/${id}/`);
  },

  create(data) {
    return request("/api/crm/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/api/crm/projects/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/api/crm/projects/${id}/`, {
      method: "DELETE",
    });
  },
};

export const projectStatusApi = {
  list() {
    return request("/api/crm/project-statuses/");
  },

  get(id) {
    return request(`/api/crm/project-statuses/${id}/`);
  },

  create(data) {
    return request("/api/crm/project-statuses/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/api/crm/project-statuses/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/api/crm/project-statuses/${id}/`, {
      method: "DELETE",
    });
  },
};

/* ================= SUPPLIES ================= */

export const factoryApi = {
  list() {
    return request("/api/supplies/factories/");
  },

  get(id) {
    return request(`/api/supplies/factories/${id}/`);
  },

  create(data) {
    return request("/api/supplies/factories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/api/supplies/factories/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  patch(id, data) {
    return request(`/api/supplies/factories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/api/supplies/factories/${id}/`, {
      method: "DELETE",
    });
  },
};

export const nomenclatureApi = {
  list() {
    return request("/api/supplies/nomenclatures/");
  },

  get(id) {
    return request(`/api/supplies/nomenclatures/${id}/`);
  },

  create(data) {
    return request("/api/supplies/nomenclatures/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/api/supplies/nomenclatures/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  patch(id, data) {
    return request(`/api/supplies/nomenclatures/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  remove(id) {
    return request(`/api/supplies/nomenclatures/${id}/`, {
      method: "DELETE",
    });
  },
};

