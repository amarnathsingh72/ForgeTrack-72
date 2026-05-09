/**
 * Backend API client for Auditchain FastAPI server.
 * All AI pipeline operations go through the backend, not directly from the browser.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://auditchain-api.onrender.com';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

/** Upload a PDF/DOCX policy document */
export async function uploadPolicy(file, framework, uploadedBy) {
  const form = new FormData();
  form.append('file', file);
  form.append('framework', framework);
  form.append('uploaded_by', uploadedBy);
  return request('/api/policies/upload', { method: 'POST', body: form });
}

/** Segment the policy into clauses via Gemini */
export async function segmentPolicy(policyId) {
  return request(`/api/policies/${policyId}/segment`, { method: 'POST' });
}

/** Extract structured controls from requirement clauses */
export async function extractControls(policyId, clauses) {
  return request(`/api/policies/${policyId}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clauses),
  });
}

/** Activate reviewed controls into the database */
export async function activateControls(policyId, controls) {
  return request(`/api/policies/${policyId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ controls }),
  });
}

/** Get a single policy with its controls */
export async function getPolicy(policyId) {
  return request(`/api/policies/${policyId}`);
}
