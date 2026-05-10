# PebelAI Job Saver (Chrome Extension MVP)

PebelAI Job Saver is a Manifest V3 Chrome extension that extracts job details from supported job boards and saves applications to a user's PebelAI account.

## What Happens Automatically

- The extension auto-detects job details while you browse supported job pages.
- When you click an **Apply** action (or submit an application form), it auto-sends the job to PebelAI with `status: "applied"`.
- Duplicate protection avoids repeated saves for the same role/company/job URL for 24 hours.
- If you're temporarily logged out, the auto-save is queued and retried after login sync.
- Chrome site access must be allowed on each job domain you want automated.
- Popup shows which account is logged in (email when available, otherwise token preview).
- If apply opens a different step/page, confirmation text like \"Application submitted\" also triggers auto-save.

## Files

- `manifest.json`
- `popup.html`
- `popup.js`
- `content.js`
- `background.js`
- `icon.png`

## Load in Chrome (Unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this extension folder (`C:\Users\sahil\OneDrive\Desktop\extension`).
5. Pin **PebelAI Job Saver** from the extensions menu.

## How Auth Works

1. User logs in on `https://pebelai.com` normally.
2. PebelAI website sends token to the extension page context using `window.postMessage`.
3. `content.js` listens for auth messages and forwards token to `background.js`.
4. `background.js` stores token in `chrome.storage.local` under `pebelaiAuthToken`.
5. Popup reads token on open. If no token is present, it shows: **"Login at pebelai.com"**.
6. Badge status:
   - Green (`ON`) when token exists.
   - Grey (`OFF`) when token is missing.

### Example postMessage payload from pebelai.com

```js
window.postMessage({
  type: 'PEBELAI_AUTH_TOKEN',
  token: '<jwt_token>'
}, window.location.origin);
```

Also supported:

```js
window.postMessage({
  type: 'pebelai:auth',
  token: '<jwt_token>'
}, window.location.origin);
```

## Supported Job Sites

- LinkedIn
- Indeed
- Glassdoor
- Greenhouse (`jobs.greenhouse.io`)
- Lever (`jobs.lever.co`)
- Workday (`*.myworkdayjobs.com`, `*.workday.com`)

## API Payload

`popup.js` sends this request on **Save to PebelAI**:

- `POST https://pebelai.com/api/applications/create`
- Headers:
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- Body:

```json
{
  "company_name": "...",
  "role_title": "...",
  "job_url": "...",
  "job_description": "...",
  "location": "...",
  "salary_min": 90000,
  "salary_max": 120000,
  "status": "applied",
  "applied_date": "YYYY-MM-DD",
  "excitement_level": 3,
  "source": "chrome_extension"
}
```

## Error Handling

- If selectors do not match, fields stay empty and remain editable.
- If current page is not a likely job listing, popup shows: **"Navigate to a job listing to save it"**.
- If API call fails, popup shows a clear error and a **Retry** button.
- If auto-save fires while auth is missing or network fails, the request is queued for retry.

## Troubleshooting Save Failures

1. Reload extension at `chrome://extensions`.
2. Open `https://pebelai.com`, ensure badge is `ON`, and verify account shown in popup.
3. Keep at least one `pebelai.com` tab open (used as same-origin fallback when extension-origin CORS is blocked).
4. On each job site, allow site access once from the extension site-access menu.
5. If auto-save was queued while `pebelai.com` tab was closed, opening `pebelai.com` triggers automatic queue retry.
6. If save still fails, open popup and use **Retry** to surface exact backend error text.

## Add a New Job Site

1. Open `content.js`.
2. Add a new key in `SITE_SELECTORS` with `title`, `company`, `location`, `salary`, and `description` selectors.
3. Update `detectJobSite()` with hostname rules for the new site.
4. Add site URL match patterns to `manifest.json > content_scripts.matches` and `host_permissions`.
5. Reload the extension in `chrome://extensions`.

Selector comments are included directly in `content.js` so updates are quick when site markup changes.
