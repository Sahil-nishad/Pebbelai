// PebelAI Extension Popup Script

const API_BASE = '/api/careers'

// Elements
const sentCount = document.getElementById('sentCount')
const pendingCount = document.getElementById('pendingCount')
const responseRate = document.getElementById('responseRate')
const resumeSelect = document.getElementById('resumeSelect')
const searchInput = document.getElementById('searchInput')
const searchBtn = document.getElementById('searchBtn')
const resultsDiv = document.getElementById('results')
const dashboardBtn = document.getElementById('dashboardBtn')

let analytics = { total_applications: 0, pending_replies: 0, response_rate: 0 }
let resumes = []
let recruiterPosts = []

// Initialize
async function init() {
  await Promise.all([loadAnalytics(), loadResumes()])
  setupEventListeners()
}

// Load analytics
async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/analytics`)
    if (res.ok) {
      analytics = await res.json()
      updateStats()
    }
  } catch (err) {
    console.error('Failed to load analytics:', err)
  }
}

// Load resumes
async function loadResumes() {
  try {
    const res = await fetch(`${API_BASE}/resume`)
    if (res.ok) {
      resumes = await res.json()
      updateResumeSelect()
    }
  } catch (err) {
    console.error('Failed to load resumes:', err)
  }
}

// Update stats display
function updateStats() {
  sentCount.textContent = analytics.total_applications
  pendingCount.textContent = analytics.pending_replies
  responseRate.textContent = `${analytics.response_rate}%`
}

// Update resume select
function updateResumeSelect() {
  resumeSelect.innerHTML = resumes.length
    ? resumes.map(r => `<option value="${r.id}">${r.parsed_name || 'Resume'}</option>`).join('')
    : '<option value="">No resumes</option>'
}

// Setup event listeners
function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch)
  dashboardBtn.addEventListener('click', () => {
    window.open('https://www.pebelai.com/careers', '_blank')
  })
}

// Handle search
async function handleSearch() {
  const resumeId = resumeSelect.value
  const query = searchInput.value.trim()

  if (!resumeId) {
    showResults('<p class="empty">Please select a resume first</p>')
    return
  }

  searchBtn.disabled = true
  searchBtn.textContent = 'Searching...'

  try {
    const queryTerms = query ? query.split(',').map(t => t.trim()).filter(Boolean) : null
    const res = await fetch(`${API_BASE}/recruiters/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_id: resumeId,
        auto_from_resume: true,
        query_terms: queryTerms,
        limit: 10,
      }),
    })

    if (res.ok) {
      recruiterPosts = await res.json()
      displayResults()
    } else {
      showResults('<p class="empty">Search failed. Try again.</p>')
    }
  } catch (err) {
    console.error('Search error:', err)
    showResults('<p class="empty">Connection error</p>')
  } finally {
    searchBtn.disabled = false
    searchBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      Find Recruiters
    `
  }
}

// Display results
function displayResults() {
  if (!recruiterPosts.length) {
    showResults('<p class="empty">No recruiter posts found</p>')
    return
  }

  const html = recruiterPosts.slice(0, 5).map(post => {
    const score = post.match?.score || 0
    const badgeClass = score >= 70 ? 'badge-success' : 'badge-warning'
    return `
      <div class="result-item">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="result-role">${post.role || 'Open role'}</span>
          <span class="badge ${badgeClass}">${score}% match</span>
        </div>
        <span class="result-company">${post.company || post.recruiter_name}</span>
        <button class="btn btn-primary" style="margin-top:8px;font-size:11px;padding:6px;"
          data-post-id="${post.recruiter_post_id}"
          data-resume-id="${resumeSelect.value}">
          Generate Email
        </button>
      </div>
    `
  }).join('')

  showResults(html)

  // Add click handlers to generate buttons
  resultsDiv.querySelectorAll('button[data-post-id]').forEach(btn => {
    btn.addEventListener('click', handleGenerateEmail)
  })
}

// Handle generate email
async function handleGenerateEmail(e) {
  const btn = e.target
  const postId = btn.dataset.postId
  const resumeId = btn.dataset.resumeId

  btn.disabled = true
  btn.textContent = 'Generating...'

  try {
    const res = await fetch(`${API_BASE}/outreach/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recruiter_post_id: postId,
        resume_id: resumeId,
      }),
    })

    if (res.ok) {
      const generated = await res.json()
      // Store for send and show confirmation
      btn.textContent = 'Generated! ✓'
      btn.classList.remove('btn-primary')
      btn.classList.add('btn-secondary')

      // Open full dashboard for sending
      setTimeout(() => {
        window.open('https://www.pebelai.com/careers/outreach', '_blank')
      }, 1000)
    } else {
      btn.textContent = 'Failed'
      btn.disabled = false
    }
  } catch (err) {
    btn.textContent = 'Error'
    btn.disabled = false
  }
}

// Show results HTML
function showResults(html) {
  resultsDiv.innerHTML = html
}

// Start
document.addEventListener('DOMContentLoaded', init)