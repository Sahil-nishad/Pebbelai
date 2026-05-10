const AUTH_TOKEN_KEY = 'pebelaiAuthToken';
const AUTH_EMAIL_KEY = 'pebelaiAuthEmail';
const JOB_CACHE_KEY = 'pebelaiJobCacheByTab';
const AUTO_SAVE_LOG_KEY = 'pebelaiAutoSaveLog';
const PENDING_AUTO_SAVE_KEY = 'pebelaiPendingAutoSaves';

const APPLICATION_CREATE_ENDPOINTS = [
  'https://pebelai.com/api/applications/create',
  'https://www.pebelai.com/api/applications/create'
];

const PEBEL_TAB_PATTERNS = ['https://pebelai.com/*', 'https://www.pebelai.com/*'];

const AUTO_SAVE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const MAX_AUTO_SAVE_LOG_ENTRIES = 600;
const MAX_PENDING_AUTO_SAVES = 40;
const FETCH_TIMEOUT_MS = 5000;

const AUTH_COOKIE_NAMES = new Set([
  'token',
  'authtoken',
  'access_token',
  'auth_token',
  'jwt',
  'pebelai_token',
  'pebelai_auth_token'
]);

function setBadge(loggedIn) {
  chrome.action.setBadgeText({ text: loggedIn ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: loggedIn ? '#0A6A47' : '#8D9591' });
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function tokenPreview(token) {
  const clean = String(token || '').trim();
  if (clean.length < 12) {
    return clean || '';
  }
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

function isLikelyJwt(value) {
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(String(value || '').trim());
}

function isLikelyTokenString(value) {
  const text = String(value || '').trim();
  if (!text) {
    return false;
  }
  return isLikelyJwt(text) || (text.length >= 16 && !/\s/.test(text));
}

function extractTokenCandidate(rawValue, depth = 0) {
  if (depth > 4 || rawValue === undefined || rawValue === null) {
    return '';
  }

  if (typeof rawValue === 'string') {
    const text = rawValue.trim();
    if (!text) {
      return '';
    }

    if (text.toLowerCase().startsWith('bearer ')) {
      const bearer = text.slice(7).trim();
      if (isLikelyTokenString(bearer)) {
        return bearer;
      }
    }

    if (isLikelyTokenString(text)) {
      return text;
    }

    try {
      const parsed = JSON.parse(text);
      return extractTokenCandidate(parsed, depth + 1);
    } catch (_error) {
      return '';
    }
  }

  if (Array.isArray(rawValue)) {
    for (const item of rawValue) {
      const token = extractTokenCandidate(item, depth + 1);
      if (token) {
        return token;
      }
    }
    return '';
  }

  if (typeof rawValue === 'object') {
    const directFields = [
      'token',
      'access_token',
      'accessToken',
      'auth_token',
      'authToken',
      'jwt',
      'id_token',
      'idToken'
    ];

    for (const field of directFields) {
      if (field in rawValue) {
        const token = extractTokenCandidate(rawValue[field], depth + 1);
        if (token) {
          return token;
        }
      }
    }

    for (const value of Object.values(rawValue)) {
      const token = extractTokenCandidate(value, depth + 1);
      if (token) {
        return token;
      }
    }
  }

  return '';
}

function decodeJwtPayload(token) {
  const rawToken = String(token || '').trim();
  if (!isLikelyJwt(rawToken)) {
    return null;
  }

  try {
    const payloadPart = rawToken.split('.')[1] || '';
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}

function extractEmailFromObject(data, depth = 0) {
  if (!data || depth > 4) {
    return '';
  }

  if (typeof data === 'string') {
    const candidate = data.trim();
    return /@/.test(candidate) ? candidate : '';
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const email = extractEmailFromObject(item, depth + 1);
      if (email) {
        return email;
      }
    }
    return '';
  }

  if (typeof data === 'object') {
    const directFields = ['email', 'user_email', 'preferred_username', 'upn', 'mail'];
    for (const key of directFields) {
      if (typeof data[key] === 'string' && /@/.test(data[key])) {
        return data[key].trim();
      }
    }

    for (const value of Object.values(data)) {
      const email = extractEmailFromObject(value, depth + 1);
      if (email) {
        return email;
      }
    }
  }

  return '';
}

function queryTabs(queryInfo) {
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      resolve(Array.isArray(tabs) ? tabs : []);
    });
  });
}

function executeScriptInMainWorld(tabId, func, args = []) {
  return new Promise((resolve, reject) => {
    if (!chrome.scripting || !chrome.scripting.executeScript) {
      reject(new Error('Scripting API unavailable.'));
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId },
        world: 'MAIN',
        func,
        args
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(Array.isArray(results) ? results : []);
      }
    );
  });
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    let json = null;
    try {
      json = await response.json();
    } catch (_error) {
      json = null;
    }

    return { response, json };
  } finally {
    clearTimeout(timer);
  }
}

async function getAuthToken() {
  const data = await chrome.storage.local.get(AUTH_TOKEN_KEY);
  return data[AUTH_TOKEN_KEY] || '';
}

async function getStoredAuthEmail() {
  const data = await chrome.storage.local.get(AUTH_EMAIL_KEY);
  return data[AUTH_EMAIL_KEY] || '';
}

async function getTokenFromCookies() {
  if (!chrome.cookies || !chrome.cookies.getAll) {
    return '';
  }

  const cookies = await chrome.cookies.getAll({ domain: 'pebelai.com' });
  if (!cookies.length) {
    return '';
  }

  for (const cookie of cookies) {
    const name = String(cookie.name || '').toLowerCase();
    if (AUTH_COOKIE_NAMES.has(name) && cookie.value) {
      const directCandidate = extractTokenCandidate(cookie.value);
      if (directCandidate) {
        return directCandidate;
      }

      try {
        const decoded = decodeURIComponent(cookie.value);
        const decodedCandidate = extractTokenCandidate(decoded);
        if (decodedCandidate) {
          return decodedCandidate;
        }
      } catch (_error) {
        // Ignore decode errors.
      }
    }
  }

  for (const cookie of cookies) {
    const name = String(cookie.name || '').toLowerCase();
    if ((name.includes('token') || name.includes('auth') || name.includes('jwt')) && cookie.value) {
      const token = extractTokenCandidate(cookie.value);
      if (token) {
        return token;
      }
    }

    if (isLikelyTokenString(cookie.value)) {
      return cookie.value;
    }
  }

  return '';
}

async function storeAuthToken(token, email = '') {
  const cleanToken = extractTokenCandidate(token) || normalizeText(token);
  if (!cleanToken) {
    await clearAuthToken();
    return;
  }

  let cleanEmail = normalizeText(email);
  if (!cleanEmail) {
    cleanEmail = await getStoredAuthEmail();
  }

  await chrome.storage.local.set({
    [AUTH_TOKEN_KEY]: cleanToken,
    [AUTH_EMAIL_KEY]: cleanEmail
  });

  setBadge(true);

  drainPendingAutoSaves(cleanToken).catch(() => {
    // Ignore queue drain failures.
  });
}

async function clearAuthToken() {
  await chrome.storage.local.remove([AUTH_TOKEN_KEY, AUTH_EMAIL_KEY]);
  setBadge(false);
}

async function ensureAuthTokenSynced() {
  const existing = await getAuthToken();
  if (existing) {
    const normalizedExisting = extractTokenCandidate(existing) || normalizeText(existing);
    if (normalizedExisting && normalizedExisting !== existing) {
      await chrome.storage.local.set({ [AUTH_TOKEN_KEY]: normalizedExisting });
      setBadge(true);
      return normalizedExisting;
    }

    setBadge(true);
    return existing;
  }

  const cookieToken = await getTokenFromCookies();
  if (cookieToken) {
    await storeAuthToken(cookieToken);
    return cookieToken;
  }

  setBadge(false);
  return '';
}

async function initializeBadge() {
  await ensureAuthTokenSynced();
}

async function readEmailFromPebelTab() {
  const tabs = await queryTabs({ url: PEBEL_TAB_PATTERNS });
  if (!tabs.length) {
    return '';
  }

  for (const tab of tabs) {
    if (typeof tab.id !== 'number') {
      continue;
    }

    try {
      const results = await executeScriptInMainWorld(
        tab.id,
        () => {
          const looksLikeEmail = (value) => /@/.test(String(value || '').trim());

          const extractEmail = (data, depth = 0) => {
            if (!data || depth > 4) {
              return '';
            }

            if (typeof data === 'string') {
              const text = data.trim();
              return looksLikeEmail(text) ? text : '';
            }

            if (Array.isArray(data)) {
              for (const item of data) {
                const email = extractEmail(item, depth + 1);
                if (email) {
                  return email;
                }
              }
              return '';
            }

            if (typeof data === 'object') {
              const directFields = ['email', 'user_email', 'preferred_username', 'upn', 'mail'];
              for (const key of directFields) {
                if (typeof data[key] === 'string' && looksLikeEmail(data[key])) {
                  return String(data[key]).trim();
                }
              }

              for (const value of Object.values(data)) {
                const email = extractEmail(value, depth + 1);
                if (email) {
                  return email;
                }
              }
            }

            return '';
          };

          const readStorage = (storageObj) => {
            if (!storageObj) {
              return '';
            }

            for (let i = 0; i < storageObj.length; i += 1) {
              const key = storageObj.key(i);
              if (!key) {
                continue;
              }

              let value = '';
              try {
                value = storageObj.getItem(key) || '';
              } catch (_error) {
                continue;
              }

              if (looksLikeEmail(value)) {
                return value.trim();
              }

              try {
                const parsed = JSON.parse(value);
                const email = extractEmail(parsed);
                if (email) {
                  return email;
                }
              } catch (_error) {
                // Ignore non-JSON values.
              }
            }

            return '';
          };

          const fromLocalStorage = readStorage(window.localStorage);
          if (fromLocalStorage) {
            return fromLocalStorage;
          }

          const fromSessionStorage = readStorage(window.sessionStorage);
          if (fromSessionStorage) {
            return fromSessionStorage;
          }

          const emailNode = document.querySelector('[data-email], [data-user-email], a[href^="mailto:"]');
          if (emailNode) {
            const raw = emailNode.getAttribute('data-email') || emailNode.getAttribute('data-user-email') || emailNode.textContent || '';
            if (looksLikeEmail(raw)) {
              return raw.trim();
            }
          }

          return '';
        },
        []
      );

      const email = results && results[0] && typeof results[0].result === 'string' ? results[0].result.trim() : '';
      if (email) {
        return email;
      }
    } catch (_error) {
      // Try next tab.
    }
  }

  return '';
}

async function getAuthIdentity() {
  const token = await ensureAuthTokenSynced();
  if (!token) {
    return {
      loggedIn: false,
      email: '',
      source: '',
      tokenPreview: ''
    };
  }

  let email = await getStoredAuthEmail();
  let source = email ? 'stored' : '';

  if (!email) {
    const claims = decodeJwtPayload(token);
    const tokenEmail = extractEmailFromObject(claims);
    if (tokenEmail) {
      email = tokenEmail;
      source = 'token';
    }
  }

  if (!email) {
    const tabEmail = await readEmailFromPebelTab();
    if (tabEmail) {
      email = tabEmail;
      source = 'pebel_tab';
    }
  }

  if (email) {
    await chrome.storage.local.set({ [AUTH_EMAIL_KEY]: email });
  }

  return {
    loggedIn: true,
    email,
    source,
    tokenPreview: tokenPreview(token)
  };
}

async function cacheJobData(tabId, payload) {
  const data = await chrome.storage.session.get(JOB_CACHE_KEY);
  const cache = data[JOB_CACHE_KEY] || {};
  cache[String(tabId)] = payload;
  await chrome.storage.session.set({ [JOB_CACHE_KEY]: cache });
}

async function getCachedJobData(tabId) {
  const data = await chrome.storage.session.get(JOB_CACHE_KEY);
  const cache = data[JOB_CACHE_KEY] || {};
  return cache[String(tabId)] || null;
}

async function removeCachedJobData(tabId) {
  const data = await chrome.storage.session.get(JOB_CACHE_KEY);
  const cache = data[JOB_CACHE_KEY] || {};
  delete cache[String(tabId)];
  await chrome.storage.session.set({ [JOB_CACHE_KEY]: cache });
}

function parseSalaryNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  const text = String(value).trim().toLowerCase();
  if (!text) {
    return null;
  }

  const match = text.match(/([\d,.]+)\s*(k)?/i);
  if (!match) {
    return null;
  }

  const numeric = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.round(match[2] ? numeric * 1000 : numeric);
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeStatus(statusValue, fallback = 'applied') {
  const raw = normalizeText(statusValue || fallback).toLowerCase();
  return raw === 'saved' ? 'saved' : 'applied';
}

function normalizeApplicationPayload(rawPayload, statusFallback = 'applied') {
  const payload = rawPayload || {};

  return {
    company_name: normalizeText(payload.company_name),
    role_title: normalizeText(payload.role_title || payload.job_title),
    job_url: normalizeText(payload.job_url),
    job_description: normalizeText(payload.job_description),
    location: normalizeText(payload.location),
    salary_min: parseSalaryNumber(payload.salary_min),
    salary_max: parseSalaryNumber(payload.salary_max),
    status: normalizeStatus(payload.status, statusFallback),
    applied_date: normalizeText(payload.applied_date) || getTodayLocalDate(),
    excitement_level: 3,
    source: 'chrome_extension'
  };
}

function hasEnoughPayloadData(payload) {
  if (!payload) {
    return false;
  }

  // Accept if we have a job title, company, description, OR at minimum a job URL
  // (URL alone is meaningful for apply-intent saves from recognized portals)
  return Boolean(
    payload.role_title ||
    payload.company_name ||
    (payload.job_description || '').length > 80 ||
    payload.job_url
  );
}

function makeAutoSaveKey(payload) {
  const base = [payload.job_url, payload.company_name, payload.role_title]
    .map((part) => normalizeText(part).toLowerCase())
    .filter(Boolean)
    .join('|');

  return base || '';
}

async function readAutoSaveLog() {
  const data = await chrome.storage.local.get(AUTO_SAVE_LOG_KEY);
  return data[AUTO_SAVE_LOG_KEY] || {};
}

async function writeAutoSaveLog(log) {
  await chrome.storage.local.set({ [AUTO_SAVE_LOG_KEY]: log });
}

async function wasRecentlyAutoSaved(payload) {
  const key = makeAutoSaveKey(payload);
  if (!key) {
    return false;
  }

  const log = await readAutoSaveLog();
  const lastSavedAt = log[key] || 0;
  return Boolean(lastSavedAt && Date.now() - lastSavedAt < AUTO_SAVE_COOLDOWN_MS);
}

async function markAutoSaved(payload) {
  const key = makeAutoSaveKey(payload);
  if (!key) {
    return;
  }

  const log = await readAutoSaveLog();
  log[key] = Date.now();

  const sorted = Object.entries(log)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .slice(0, MAX_AUTO_SAVE_LOG_ENTRIES);

  const trimmed = {};
  for (const [entryKey, entryValue] of sorted) {
    trimmed[entryKey] = entryValue;
  }

  await writeAutoSaveLog(trimmed);
}

async function getPendingAutoSaves() {
  const data = await chrome.storage.local.get(PENDING_AUTO_SAVE_KEY);
  return Array.isArray(data[PENDING_AUTO_SAVE_KEY]) ? data[PENDING_AUTO_SAVE_KEY] : [];
}

async function setPendingAutoSaves(items) {
  await chrome.storage.local.set({ [PENDING_AUTO_SAVE_KEY]: items.slice(-MAX_PENDING_AUTO_SAVES) });
}

async function enqueuePendingAutoSave(item) {
  const pending = await getPendingAutoSaves();
  pending.push(item);
  await setPendingAutoSaves(pending);
}

async function sendApplicationByExtensionFetch(token, payload) {
  const errors = [];

  for (const endpoint of APPLICATION_CREATE_ENDPOINTS) {
    try {
      const { response, json } = await fetchJsonWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { endpoint, data: json || null };
      }

      const detail = json && json.message ? `: ${json.message}` : '';
      errors.push(`HTTP ${response.status} at ${endpoint}${detail}`);
    } catch (error) {
      errors.push(error && error.message ? error.message : `Network error at ${endpoint}`);
    }
  }

  throw new Error(errors.filter(Boolean).join(' | ') || 'Extension fetch save failed.');
}

async function sendApplicationViaPebelTab(payload, token) {
  const tabs = await queryTabs({ url: PEBEL_TAB_PATTERNS });
  if (!tabs.length) {
    throw new Error('No pebelai.com tab is open. Open pebelai.com and try again.');
  }

  const errors = [];

  for (const tab of tabs) {
    if (typeof tab.id !== 'number') {
      continue;
    }

    try {
      const results = await executeScriptInMainWorld(
        tab.id,
        async (applicationPayload, authToken) => {
          const attemptConfigs = [
            { endpoint: '/api/applications/create', useAuth: true },
            { endpoint: '/api/applications/create', useAuth: false },
            { endpoint: '/api/applications/create/', useAuth: true },
            { endpoint: '/api/applications/create/', useAuth: false }
          ];

          const localErrors = [];
          for (const config of attemptConfigs) {
            try {
              const headers = {
                'Content-Type': 'application/json'
              };
              if (config.useAuth && authToken) {
                headers.Authorization = `Bearer ${authToken}`;
              }

              const response = await fetch(config.endpoint, {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify(applicationPayload)
              });

              const rawText = await response.text();
              let data = null;
              try {
                data = rawText ? JSON.parse(rawText) : null;
              } catch (_error) {
                data = rawText || null;
              }

              if (response.ok) {
                return {
                  ok: true,
                  status: response.status,
                  endpoint: config.endpoint,
                  mode: config.useAuth ? 'auth_header' : 'cookie_session',
                  data
                };
              }

              const detail = data && typeof data === 'object' && data.message
                ? data.message
                : String(rawText || '').slice(0, 180);
              localErrors.push(`HTTP ${response.status} at ${config.endpoint}${detail ? `: ${detail}` : ''}`);
            } catch (error) {
              localErrors.push(error && error.message ? error.message : `Network error at ${config.endpoint}`);
            }
          }

          return {
            ok: false,
            error: localErrors.join(' | ') || 'Pebel tab proxy save failed.'
          };
        },
        [payload, token]
      );

      const result = results && results[0] ? results[0].result : null;
      if (result && result.ok) {
        return {
          endpoint: `pebel_tab:${result.endpoint}`,
          mode: result.mode,
          data: result.data || null
        };
      }

      errors.push(result && result.error ? result.error : 'Unknown pebel tab proxy error.');
    } catch (error) {
      errors.push(error && error.message ? error.message : 'Unable to run save in pebel tab.');
    }
  }

  throw new Error(errors.filter(Boolean).join(' | ') || 'Pebel tab proxy save failed.');
}

async function sendApplicationToPebel(token, payload) {
  try {
    return await sendApplicationByExtensionFetch(token, payload);
  } catch (extensionError) {
    try {
      const proxied = await sendApplicationViaPebelTab(payload, token);
      return {
        ...proxied,
        fallback: 'pebel_tab_proxy'
      };
    } catch (proxyError) {
      const combinedError = [
        extensionError && extensionError.message ? `Extension fetch failed: ${extensionError.message}` : '',
        proxyError && proxyError.message ? `Pebel tab fallback failed: ${proxyError.message}` : ''
      ]
        .filter(Boolean)
        .join(' | ');

      throw new Error(combinedError || 'Failed to save application.');
    }
  }
}

async function drainPendingAutoSaves(token) {
  if (!token) {
    return;
  }

  const pending = await getPendingAutoSaves();
  if (!pending.length) {
    return;
  }

  const remaining = [];
  for (const item of pending) {
    try {
      if (!item || !item.payload || !hasEnoughPayloadData(item.payload)) {
        continue;
      }

      if (await wasRecentlyAutoSaved(item.payload)) {
        continue;
      }

      await sendApplicationToPebel(token, item.payload);
      await markAutoSaved(item.payload);
    } catch (_error) {
      remaining.push(item);
    }
  }

  await setPendingAutoSaves(remaining);
}

async function maybeDrainPendingAutoSaves() {
  const token = await ensureAuthTokenSynced();
  if (!token) {
    return;
  }

  const pebelTabs = await queryTabs({ url: PEBEL_TAB_PATTERNS });
  if (!pebelTabs.length) {
    return;
  }

  await drainPendingAutoSaves(token);
}

async function handleManualSaveApplication(message) {
  const token = await ensureAuthTokenSynced();
  if (!token) {
    return {
      ok: false,
      needsAuth: true,
      error: 'Not logged in. Open pebelai.com and click Sync Login.'
    };
  }

  const normalizedPayload = normalizeApplicationPayload(message.payload || {}, 'applied');
  if (!hasEnoughPayloadData(normalizedPayload)) {
    return {
      ok: false,
      error: 'Please fill at least job title/company or provide a longer description.'
    };
  }

  try {
    const result = await sendApplicationToPebel(token, normalizedPayload);
    const identity = await getAuthIdentity();

    return {
      ok: true,
      endpoint: result.endpoint,
      fallback: result.fallback || '',
      email: identity.email || '',
      identitySource: identity.source || ''
    };
  } catch (error) {
    return {
      ok: false,
      error: error && error.message ? error.message : 'Failed to save application.',
      retryable: true
    };
  }
}

async function handleAutoSaveApplication(message) {
  const trigger = message.trigger || 'unknown';

  // All auto-saves are apply-intent — page_view saves were removed to prevent duplicates
  const isApplyIntent = /apply_click|application_submit|application_confirmed/.test(trigger);

  const normalizedPayload = normalizeApplicationPayload(message.payload || {}, 'applied');
  if (!hasEnoughPayloadData(normalizedPayload)) {
    return { ok: false, error: 'Missing job data for automation.' };
  }

  // Apply-intent uses a short 2-minute cooldown to prevent burst duplicates
  // but overrides the 12h page_view cooldown so "applied" always gets recorded
  const APPLY_COOLDOWN_MS = 2 * 60 * 1000;
  if (isApplyIntent) {
    const log = await readAutoSaveLog();
    const key = makeAutoSaveKey(normalizedPayload);
    const lastSavedAt = key ? (log[key] || 0) : 0;
    if (lastSavedAt && Date.now() - lastSavedAt < APPLY_COOLDOWN_MS) {
      return { ok: true, skipped: true, reason: 'apply_duplicate_burst' };
    }
  } else if (await wasRecentlyAutoSaved(normalizedPayload)) {
    return { ok: true, skipped: true, reason: 'duplicate_recent_save' };
  }

  const token = await ensureAuthTokenSynced();
  if (!token) {
    await enqueuePendingAutoSave({
      payload: normalizedPayload,
      trigger: message.trigger || 'unknown',
      occurred_at: message.occurred_at || new Date().toISOString()
    });

    return { ok: false, queued: true, error: 'Not logged in. Auto-save queued.' };
  }

  try {
    await sendApplicationToPebel(token, normalizedPayload);
    await markAutoSaved(normalizedPayload);
    return { ok: true, saved: true };
  } catch (error) {
    await enqueuePendingAutoSave({
      payload: normalizedPayload,
      trigger: message.trigger || 'unknown',
      occurred_at: message.occurred_at || new Date().toISOString()
    });

    return {
      ok: false,
      queued: true,
      error: error && error.message ? error.message : 'Auto-save failed and was queued for retry.'
    };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeBadge();
  maybeDrainPendingAutoSaves().catch(() => {
    // Ignore startup drain errors.
  });
});

chrome.runtime.onStartup.addListener(() => {
  initializeBadge();
  maybeDrainPendingAutoSaves().catch(() => {
    // Ignore startup drain errors.
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removeCachedJobData(tabId).catch(() => {
    // No-op if session cache is unavailable.
  });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') {
    return;
  }

  const url = String(tab && tab.url ? tab.url : '');
  if (!url.includes('pebelai.com')) {
    return;
  }

  maybeDrainPendingAutoSaves().catch(() => {
    // Ignore sync errors.
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return;
  }

  if (message.type === 'PEBELAI_AUTH_TOKEN') {
    storeAuthToken(message.token || '')
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_AUTH_TOKEN') {
    ensureAuthTokenSynced()
      .then((token) => {
        sendResponse({
          ok: true,
          token,
          loggedIn: Boolean(token)
        });
      })
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_AUTH_IDENTITY') {
    getAuthIdentity()
      .then((identity) => sendResponse({ ok: true, ...identity }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'CLEAR_AUTH_TOKEN') {
    clearAuthToken()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'MANUAL_SAVE_APPLICATION') {
    handleManualSaveApplication(message)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'JOB_DATA_EXTRACTED') {
    const tabId = sender.tab && sender.tab.id;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, error: 'Missing sender tab id.' });
      return;
    }

    cacheJobData(tabId, message.payload || null)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_CACHED_JOB_DATA') {
    const tabId = typeof message.tabId === 'number' ? message.tabId : sender.tab && sender.tab.id;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, error: 'Missing tab id.' });
      return;
    }

    getCachedJobData(tabId)
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'AUTO_SAVE_APPLICATION') {
    handleAutoSaveApplication(message)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }
});

if (chrome.cookies && chrome.cookies.onChanged) {
  chrome.cookies.onChanged.addListener((changeInfo) => {
    const cookie = changeInfo.cookie;
    if (!cookie || !cookie.domain.includes('pebelai.com')) {
      return;
    }

    const cookieName = String(cookie.name || '').toLowerCase();
    if (!AUTH_COOKIE_NAMES.has(cookieName) && !cookieName.includes('token') && !cookieName.includes('auth')) {
      return;
    }

    if (changeInfo.removed) {
      ensureAuthTokenSynced().catch(() => {
        // Ignore storage cleanup errors.
      });
      return;
    }

    if (cookie.value) {
      storeAuthToken(cookie.value).catch(() => {
        // Ignore cookie sync failures.
      });
    }
  });
}

initializeBadge();
