const APPLICATIONS_URL = 'https://pebelai.com/applications';
const AUTO_SAVE_ENABLED_KEY = 'pebelaiAutoSaveEnabled';

const state = {
  authToken: '',
  identityEmail: '',
  identitySource: '',
  identityTokenPreview: '',
  activeTabId: null,
  jobUrl: '',
  jobDescription: '',
  isSaving: false
};

const elements = {
  form: document.getElementById('jobForm'),
  authNotice: document.getElementById('authNotice'),
  pageNotice: document.getElementById('pageNotice'),
  accountEmail: document.getElementById('accountEmail'),
  accountAvatar: document.getElementById('accountAvatar'),
  statusMessage: document.getElementById('statusMessage'),
  saveButton: document.getElementById('saveButton'),
  retryButton: document.getElementById('retryButton'),
  syncLoginButton: document.getElementById('syncLoginButton'),
  successState: document.getElementById('successState'),
  autoSaveToggle: document.getElementById('autoSaveToggle'),
  toggleDesc: document.getElementById('toggleDesc'),
  jobTitle: document.getElementById('jobTitle'),
  companyName: document.getElementById('companyName'),
  location: document.getElementById('location'),
  salaryMin: document.getElementById('salaryMin'),
  salaryMax: document.getElementById('salaryMax'),
  status: document.getElementById('status')
};

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function executeScript(tabId, func) {
  return new Promise((resolve, reject) => {
    if (!chrome.scripting || !chrome.scripting.executeScript) {
      reject(new Error('Scripting API unavailable.'));
      return;
    }

    chrome.scripting.executeScript(
      { target: { tabId }, func },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(results || []);
      }
    );
  });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs && tabs.length ? tabs[0] : null);
    });
  });
}

async function readTokenFromActivePebelTab(tabId) {
  const TOKEN_FIELD_NAMES = ['token','access_token','accesstoken','auth_token','authtoken','jwt','id_token','idtoken'];

  const results = await executeScript(tabId, () => {
    const TOKEN_FIELD_NAMES = ['token','access_token','accesstoken','auth_token','authtoken','jwt','id_token','idtoken'];

    const isLikelyJwt = (v) => /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(String(v||'').trim());

    const tokenFromRawValue = (raw, allowOpaque = false) => {
      if (raw == null) return '';
      const text = String(raw).trim();
      if (!text) return '';
      if (text.toLowerCase().startsWith('bearer ')) {
        const bearer = text.slice(7).trim();
        if (isLikelyJwt(bearer) || (allowOpaque && bearer.length >= 16 && !/\s/.test(bearer))) return bearer;
      }
      if (isLikelyJwt(text)) return text;
      if (allowOpaque && text.length >= 16 && !/\s/.test(text)) return text;
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          for (const field of TOKEN_FIELD_NAMES) {
            if (typeof parsed[field] === 'string' && parsed[field].trim()) {
              const c = tokenFromRawValue(parsed[field], true);
              if (c) return c;
            }
          }
        }
      } catch (_) {}
      return '';
    };

    const tokenFromStorage = (s) => {
      if (!s) return '';
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (!key) continue;
        let val = '';
        try { val = s.getItem(key) || ''; } catch (_) { continue; }
        const lk = key.toLowerCase();
        if (lk.includes('token') || lk.includes('auth') || lk.includes('jwt')) {
          const c = tokenFromRawValue(val, true);
          if (c) return c;
        }
        const fc = tokenFromRawValue(val);
        if (fc) return fc;
      }
      return '';
    };

    const tokenFromCookies = () => {
      const parts = String(document.cookie || '').split(';');
      for (const part of parts) {
        const [rawKey, ...vParts] = part.split('=');
        const key = (rawKey || '').trim().toLowerCase();
        const rawVal = vParts.join('=').trim();
        if (!key || !rawVal) continue;
        if (key.includes('token') || key.includes('auth') || key.includes('jwt')) {
          const c = tokenFromRawValue(decodeURIComponent(rawVal), true);
          if (c) return c;
        }
      }
      return '';
    };

    return tokenFromStorage(window.localStorage) || tokenFromStorage(window.sessionStorage) || tokenFromCookies();
  });

  const value = results && results[0] ? results[0].result : '';
  return String(value || '').trim();
}

function toNumberOrNull(value) {
  if (!value && value !== 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function setStatusMessage(message, kind = 'info') {
  elements.statusMessage.textContent = message || '';
  elements.statusMessage.classList.remove('error', 'success');
  if (kind === 'error' || kind === 'success') {
    elements.statusMessage.classList.add(kind);
  }
}

function updateAccountDisplay(loggedIn, email, tokenPreview) {
  if (!loggedIn) {
    elements.accountEmail.textContent = 'Not logged in';
    elements.accountEmail.classList.add('not-logged-in');
    elements.accountAvatar.textContent = '?';
    elements.accountAvatar.style.background = '#8D9591';
    return;
  }

  elements.accountEmail.classList.remove('not-logged-in');
  elements.accountAvatar.style.background = '#0A6A47';

  if (email) {
    elements.accountEmail.textContent = email;
    // Show first letter of email as avatar
    elements.accountAvatar.textContent = email.charAt(0).toUpperCase();
  } else if (tokenPreview) {
    elements.accountEmail.textContent = `Token ${tokenPreview}`;
    elements.accountAvatar.textContent = 'T';
  } else {
    elements.accountEmail.textContent = 'Logged in';
    elements.accountAvatar.textContent = 'P';
  }
}

function toggleAuthNotice(show) {
  elements.authNotice.classList.toggle('hidden', !show);
}

function togglePageNotice(show) {
  elements.pageNotice.classList.toggle('hidden', !show);
}

function setSavingState(saving) {
  state.isSaving = saving;
  elements.saveButton.disabled = saving || !state.authToken;
  elements.saveButton.textContent = saving ? 'Saving...' : 'Save to PebelAI';
}

function splitSalaryText(salaryText) {
  const text = String(salaryText || '');
  const match = text.match(/([\d,]+)\D+([\d,]+)/);
  if (!match) return { min: '', max: '' };
  return {
    min: match[1].replace(/,/g, ''),
    max: match[2].replace(/,/g, '')
  };
}

function populateForm(jobData) {
  if (!jobData || typeof jobData !== 'object') return;

  elements.jobTitle.value = jobData.job_title || '';
  elements.companyName.value = jobData.company_name || '';
  elements.location.value = jobData.location || '';

  const salary = splitSalaryText(jobData.salary || '');
  elements.salaryMin.value = jobData.salary_min || salary.min || '';
  elements.salaryMax.value = jobData.salary_max || salary.max || '';

  state.jobDescription = jobData.job_description || '';
  state.jobUrl = jobData.job_url || state.jobUrl;
}

function handleRuntimeMessage(message) {
  if (!message || message.type !== 'JOB_DATA_EXTRACTED' || !message.payload) return;
  populateForm(message.payload);
  togglePageNotice(!isLikelyJobData(message.payload));
}

function isLikelyJobData(jobData) {
  if (!jobData) return false;
  return Boolean(jobData.job_title || jobData.company_name || (jobData.job_description || '').length > 80);
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildApiPayload() {
  return {
    company_name: elements.companyName.value.trim(),
    role_title: elements.jobTitle.value.trim(),
    job_url: state.jobUrl,
    job_description: state.jobDescription,
    location: elements.location.value.trim(),
    salary_min: toNumberOrNull(elements.salaryMin.value),
    salary_max: toNumberOrNull(elements.salaryMax.value),
    status: elements.status.value || 'applied',
    applied_date: getTodayLocalDate(),
    excitement_level: 3,
    source: 'chrome_extension'
  };
}

async function refreshIdentityState() {
  try {
    const identity = await sendRuntimeMessage({ type: 'GET_AUTH_IDENTITY' });
    state.identityEmail = identity && identity.email ? identity.email : '';
    state.identityTokenPreview = identity && identity.tokenPreview ? identity.tokenPreview : '';

    updateAccountDisplay(Boolean(state.authToken), state.identityEmail, state.identityTokenPreview);
  } catch (_error) {
    updateAccountDisplay(Boolean(state.authToken), '', '');
  }
}

async function ensureAuthState() {
  try {
    const response = await sendRuntimeMessage({ type: 'GET_AUTH_TOKEN' });
    state.authToken = response && response.token ? response.token : '';
  } catch (_error) {
    state.authToken = '';
  }

  toggleAuthNotice(!state.authToken);
  setSavingState(false);
  refreshIdentityState().catch(() => {});
}

async function loadAutoSaveToggle() {
  const data = await chrome.storage.local.get(AUTO_SAVE_ENABLED_KEY);
  const enabled = data[AUTO_SAVE_ENABLED_KEY] !== false; // default true
  elements.autoSaveToggle.checked = enabled;
  updateToggleDesc(enabled);
}

function updateToggleDesc(enabled) {
  elements.toggleDesc.textContent = enabled
    ? 'Saves jobs automatically when browsing portals'
    : 'Auto-save is OFF — use manual save only';
}

async function findPebelTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ url: ['https://pebelai.com/*', 'https://www.pebelai.com/*'] }, (tabs) => {
      resolve(tabs && tabs.length ? tabs[0] : null);
    });
  });
}

async function syncLoginFromPebelTab() {
  // First try to sync via background cookie read (no pebelai.com tab needed)
  await ensureAuthState();
  if (state.authToken) {
    setStatusMessage('Login synced automatically.', 'success');
    setTimeout(() => setStatusMessage(''), 2000);
    return;
  }

  // Find a pebelai.com tab (any tab, not necessarily active)
  const tab = await findPebelTab();
  if (!tab || typeof tab.id !== 'number') {
    setStatusMessage('Open pebelai.com in any tab, then click Sync Login again.', 'error');
    return;
  }

  try {
    let response = null;
    try {
      response = await sendMessageToTab(tab.id, { type: 'REQUEST_AUTH_SYNC' });
    } catch (_error) {}

    if (!response || !response.ok || !response.found) {
      const token = await readTokenFromActivePebelTab(tab.id);
      if (token) {
        await sendRuntimeMessage({ type: 'PEBELAI_AUTH_TOKEN', token });
      }
    }

    await ensureAuthState();
    if (state.authToken) {
      setStatusMessage('Login synced. You can save now.', 'success');
      return;
    }

    setStatusMessage('Not detected. Reload pebelai.com and try again.', 'error');
  } catch (_error) {
    setStatusMessage('Sync failed. Reload pebelai.com and try again.', 'error');
  }
}

async function loadJobData() {
  const tab = await getActiveTab();
  if (!tab || typeof tab.id !== 'number') {
    togglePageNotice(true);
    return;
  }

  state.activeTabId = tab.id;
  state.jobUrl = tab.url || '';

  let response = null;
  try {
    response = await sendMessageToTab(tab.id, { type: 'REQUEST_JOB_DATA' });
  } catch (_error) {
    try {
      response = await sendRuntimeMessage({ type: 'GET_CACHED_JOB_DATA', tabId: tab.id });
    } catch (_innerError) {
      response = null;
    }
  }

  const payload = response && response.payload ? response.payload : null;
  if (payload) {
    populateForm(payload);
    togglePageNotice(!isLikelyJobData(payload));
    return;
  }

  togglePageNotice(true);
}

async function saveToPebelAI() {
  if (!state.authToken) {
    setStatusMessage('Login at pebelai.com before saving.', 'error');
    toggleAuthNotice(true);
    return;
  }

  const payload = buildApiPayload();

  setStatusMessage('');
  elements.retryButton.classList.add('hidden');
  elements.successState.classList.add('hidden');
  setSavingState(true);

  try {
    const response = await sendRuntimeMessage({
      type: 'MANUAL_SAVE_APPLICATION',
      payload
    });

    if (!response || !response.ok) {
      const errorMessage = response && response.error ? response.error : 'Could not save application.';
      throw new Error(errorMessage);
    }

    if (response.email) {
      state.identityEmail = response.email;
      updateAccountDisplay(true, state.identityEmail, state.identityTokenPreview);
    }

    setStatusMessage('Application saved successfully.', 'success');
    elements.successState.classList.remove('hidden');
  } catch (error) {
    setStatusMessage(error.message || 'Could not save application. Please retry.', 'error');
    elements.retryButton.classList.remove('hidden');
  } finally {
    setSavingState(false);
  }
}

async function initializePopup() {
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.isSaving) saveToPebelAI();
  });

  elements.retryButton.addEventListener('click', () => {
    if (!state.isSaving) saveToPebelAI();
  });

  elements.syncLoginButton.addEventListener('click', () => {
    syncLoginFromPebelTab();
  });

  elements.autoSaveToggle.addEventListener('change', async () => {
    const enabled = elements.autoSaveToggle.checked;
    await chrome.storage.local.set({ [AUTO_SAVE_ENABLED_KEY]: enabled });
    updateToggleDesc(enabled);
    setStatusMessage(enabled ? 'Auto-save enabled.' : 'Auto-save disabled.', 'success');
    setTimeout(() => setStatusMessage(''), 2000);
  });

  const viewLink = elements.successState.querySelector('a');
  if (viewLink) viewLink.href = APPLICATIONS_URL;

  await ensureAuthState();
  await loadAutoSaveToggle();
  await loadJobData();
}

initializePopup();
