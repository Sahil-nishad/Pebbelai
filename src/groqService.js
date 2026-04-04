/**
 * Groq API Client — Calls backend server (API key is server-side)
 */

/**
 * Enhance resume via backend Groq API
 */
export async function enhanceWithGroq(userData, targetRole, rolePackId) {
  const response = await fetch('/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userData, targetRole, rolePackId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `Server error (${response.status})`);
  }

  return response.json();
}

export async function generateCareerKitWithGroq(resumeData, targetRole, jobDescription) {
  const response = await fetch('/api/career-kit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeData, targetRole, jobDescription }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `Server error (${response.status})`);
  }

  return response.json();
}

export async function scoreATSWithGroq(resumeData, targetRole, jobDescription) {
  const response = await fetch('/api/ats-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeData, targetRole, jobDescription }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error || `Server error (${response.status})`);
  }

  return response.json();
}

/**
 * Check if the backend server is running and Groq is configured
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) return { running: false, groqConfigured: false };
    const data = await response.json();
    return { running: true, groqConfigured: data.groqConfigured };
  } catch {
    return { running: false, groqConfigured: false };
  }
}
